/**
 * Stripe Payment Service
 * Handles credit purchases via Stripe Payment Links or Checkout Sessions
 *
 * SETUP OPTIONS:
 *
 * Option 1: Stripe Payment Links (No backend required)
 *   - Create Payment Links in Stripe Dashboard for each package
 *   - Set VITE_STRIPE_LINK_STARTER, VITE_STRIPE_LINK_PRO, VITE_STRIPE_LINK_STUDIO
 *
 * Option 2: Stripe Checkout Sessions (Requires backend)
 *   - Set VITE_STRIPE_CHECKOUT_API to your backend endpoint
 *   - Backend creates checkout sessions with your secret key
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceInCents: number;
  priceDisplay: string;
  description: string;
  badge?: string;
  paymentLink?: string;
  stripePriceId?: string;
}

// Credit packages configuration
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Short Film',
    credits: 20,
    priceInCents: 499,
    priceDisplay: '$4.99',
    description: 'Perfect for a single poster and a few edits.',
    paymentLink: (import.meta as any).env?.VITE_STRIPE_LINK_STARTER,
    stripePriceId: (import.meta as any).env?.VITE_STRIPE_PRICE_STARTER
  },
  {
    id: 'pro',
    name: 'Feature Film',
    credits: 100,
    priceInCents: 1999,
    priceDisplay: '$19.99',
    description: 'Produce a full comic strip and multiple video sequences.',
    badge: 'Best Value',
    paymentLink: (import.meta as any).env?.VITE_STRIPE_LINK_PRO,
    stripePriceId: (import.meta as any).env?.VITE_STRIPE_PRICE_PRO
  },
  {
    id: 'studio',
    name: "Director's Cut",
    credits: 300,
    priceInCents: 4999,
    priceDisplay: '$49.99',
    description: 'Unlimited creativity for professional storytelling.',
    paymentLink: (import.meta as any).env?.VITE_STRIPE_LINK_STUDIO,
    stripePriceId: (import.meta as any).env?.VITE_STRIPE_PRICE_STUDIO
  }
];

class StripeService {
  private stripe: Stripe | null = null;
  private stripePromise: Promise<Stripe | null> | null = null;

  /**
   * Get Stripe publishable key from environment
   */
  getPublishableKey(): string | null {
    return (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || null;
  }

  /**
   * Get checkout API endpoint (for backend-based checkout)
   */
  getCheckoutApiEndpoint(): string | null {
    return (import.meta as any).env?.VITE_STRIPE_CHECKOUT_API || null;
  }

  /**
   * Check if Stripe is configured
   */
  isConfigured(): boolean {
    // Either need payment links OR (publishable key + checkout API)
    const hasPaymentLinks = CREDIT_PACKAGES.some(pkg => pkg.paymentLink);
    const hasCheckoutApi = !!(this.getPublishableKey() && this.getCheckoutApiEndpoint());
    return hasPaymentLinks || hasCheckoutApi;
  }

  /**
   * Check if using Payment Links (no backend)
   */
  isUsingPaymentLinks(): boolean {
    return CREDIT_PACKAGES.some(pkg => pkg.paymentLink);
  }

  /**
   * Initialize Stripe SDK
   */
  async init(): Promise<Stripe | null> {
    if (this.stripe) return this.stripe;

    const publishableKey = this.getPublishableKey();
    if (!publishableKey) {
      console.warn('Stripe publishable key not configured');
      return null;
    }

    if (!this.stripePromise) {
      this.stripePromise = loadStripe(publishableKey);
    }

    this.stripe = await this.stripePromise;
    return this.stripe;
  }

  /**
   * Start checkout process for a package
   */
  async checkout(
    packageId: string,
    userId: string,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return { success: false, error: 'Package not found' };
    }

    // Default URLs
    const baseUrl = window.location.origin;
    const defaultSuccessUrl = `${baseUrl}/?payment=success&package=${packageId}&credits=${pkg.credits}`;
    const defaultCancelUrl = `${baseUrl}/?payment=cancelled`;

    // Option 1: Use Payment Link (no backend required)
    if (pkg.paymentLink) {
      const url = new URL(pkg.paymentLink);
      // Add client reference for tracking
      url.searchParams.set('client_reference_id', userId);
      // Stripe Payment Links handle success/cancel internally
      window.location.href = url.toString();
      return { success: true };
    }

    // Option 2: Use Checkout Session via backend API
    const checkoutApi = this.getCheckoutApiEndpoint();
    if (checkoutApi) {
      try {
        const response = await fetch(checkoutApi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageId,
            userId,
            priceId: pkg.stripePriceId,
            successUrl: successUrl || defaultSuccessUrl,
            cancelUrl: cancelUrl || defaultCancelUrl
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create checkout session');
        }

        const { sessionId, url } = await response.json();

        // If backend returns a URL, redirect directly
        if (url) {
          window.location.href = url;
          return { success: true };
        }

        // Otherwise use Stripe SDK to redirect
        const stripe = await this.init();
        if (!stripe || !sessionId) {
          throw new Error('Stripe not initialized');
        }

        const result = await stripe.redirectToCheckout({ sessionId });
        if (result.error) {
          throw new Error(result.error.message);
        }

        return { success: true };
      } catch (error) {
        console.error('Checkout error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Checkout failed'
        };
      }
    }

    return { success: false, error: 'Stripe not configured' };
  }

  /**
   * Check URL for payment result (after redirect back from Stripe)
   */
  checkPaymentResult(): {
    success: boolean;
    cancelled: boolean;
    packageId?: string;
    credits?: number;
  } {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');

    if (payment === 'success') {
      const packageId = params.get('package');
      const credits = parseInt(params.get('credits') || '0', 10);
      return { success: true, cancelled: false, packageId: packageId || undefined, credits };
    }

    if (payment === 'cancelled') {
      return { success: false, cancelled: true };
    }

    return { success: false, cancelled: false };
  }

  /**
   * Clear payment result from URL
   */
  clearPaymentResult(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('payment');
    url.searchParams.delete('package');
    url.searchParams.delete('credits');
    window.history.replaceState({}, '', url.toString());
  }

  /**
   * Get all packages
   */
  getPackages(): CreditPackage[] {
    return CREDIT_PACKAGES;
  }

  /**
   * Get package by ID
   */
  getPackage(id: string): CreditPackage | undefined {
    return CREDIT_PACKAGES.find(p => p.id === id);
  }
}

export const stripeService = new StripeService();
