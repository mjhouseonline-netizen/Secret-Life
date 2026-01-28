
import React, { useState } from 'react';
import { stripeService, CREDIT_PACKAGES, CreditPackage } from '../services/stripe';

interface CreditPurchaseProps {
  userId: string;
  onPurchaseComplete: (credits: number) => void;
  onClose: () => void;
}

export const CreditPurchase: React.FC<CreditPurchaseProps> = ({ userId, onPurchaseComplete, onClose }) => {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'selection' | 'checkout'>('selection');

  const isStripeConfigured = stripeService.isConfigured();
  const isUsingPaymentLinks = stripeService.isUsingPaymentLinks();

  const handleCheckout = async () => {
    if (!selectedPackage) return;

    setIsProcessing(true);
    setError(null);

    if (isStripeConfigured) {
      const result = await stripeService.checkout(selectedPackage, userId);

      if (!result.success) {
        setError(result.error || 'Checkout failed');
        setIsProcessing(false);
      }
      return;
    }

    setTimeout(() => {
      const pkg = CREDIT_PACKAGES.find(p => p.id === selectedPackage);
      if (pkg) {
        onPurchaseComplete(pkg.credits);
      }
      setIsProcessing(false);
    }, 2000);
  };

  const getPackageStatus = (pkg: CreditPackage): 'available' | 'mock' => {
    if (pkg.paymentLink) return 'available';
    if (stripeService.getCheckoutApiEndpoint()) return 'available';
    return 'mock';
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose}></div>

      <div className="max-w-4xl w-full bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden relative z-10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-12 h-full">
          <div className="md:col-span-5 p-12 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-r border-zinc-800 flex flex-col justify-between">
            <div>
              <h2 className="text-4xl font-cinematic tracking-widest text-white mb-4">REFILL CREDITS</h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                Fuelling your creativity with Secret Life energy. Each credit powers advanced Gemini 3 and Veo generations.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs text-zinc-300">
                  <span className="text-indigo-400">&#9889;</span>
                  Gemini 3 Pro Access
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-300">
                  <span className="text-indigo-400">&#9889;</span>
                  Veo Video Rendering
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-300">
                  <span className="text-indigo-400">&#9889;</span>
                  4K Image Exports
                </div>
              </div>

              {!isStripeConfigured && (
                <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <p className="text-[10px] text-yellow-400/80 font-bold uppercase">Demo Mode</p>
                  <p className="text-[10px] text-yellow-400/60 mt-1">
                    Stripe not configured. Purchases are simulated.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-zinc-800/50">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Secure Payments</p>
              <div className={'flex gap-4 transition-all cursor-default ' + (isStripeConfigured ? '' : 'opacity-30 grayscale')}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-5" />
              </div>
            </div>
          </div>

          <div className="md:col-span-7 p-12 flex flex-col">
            <div className="flex-1">
              {step === 'selection' ? (
                <div className="space-y-4">
                  {CREDIT_PACKAGES.map((pkg) => {
                    const status = getPackageStatus(pkg);
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg.id)}
                        className={'w-full p-6 rounded-[2rem] border-2 transition-all text-left flex items-center justify-between group relative ' +
                          (selectedPackage === pkg.id
                            ? 'border-indigo-600 bg-indigo-600/5'
                            : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700')
                        }
                      >
                        <div>
                          {pkg.badge && (
                            <span className="absolute -top-3 left-6 px-3 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase rounded-full tracking-widest shadow-lg">
                              {pkg.badge}
                            </span>
                          )}
                          <h3 className="text-lg font-bold text-white mb-1">{pkg.name}</h3>
                          <p className="text-xs text-zinc-500 leading-tight">{pkg.description}</p>
                          {status === 'mock' && (
                            <span className="mt-2 inline-block px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[8px] font-bold rounded uppercase">
                              Demo
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-indigo-400">{pkg.credits}</p>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase">{pkg.priceDisplay}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                  <div className="w-20 h-20 bg-indigo-600/10 rounded-full flex items-center justify-center text-3xl">
                    {isStripeConfigured ? '&#128274;' : '&#128179;'}
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {isStripeConfigured ? 'Secure Checkout' : 'Demo Purchase'}
                  </h3>
                  <p className="text-sm text-zinc-400 max-w-xs">
                    {isStripeConfigured
                      ? 'You will be redirected to Stripe\'s secure checkout for the ' + (CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.name || '') + ' package.'
                      : 'This is a demo purchase. ' + (CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.credits || 0) + ' credits will be added instantly.'
                    }
                  </p>
                  {isUsingPaymentLinks && (
                    <p className="text-[10px] text-zinc-500">
                      Payment processed securely by Stripe
                    </p>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            <div className="mt-8 flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-4 bg-zinc-800 text-zinc-400 font-bold rounded-2xl hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              {step === 'selection' ? (
                <button
                  disabled={!selectedPackage}
                  onClick={() => setStep('checkout')}
                  className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                >
                  Continue to Checkout
                </button>
              ) : (
                <button
                  disabled={isProcessing}
                  onClick={handleCheckout}
                  className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{isStripeConfigured ? 'Redirecting to Stripe...' : 'Processing...'}</span>
                    </>
                  ) : (
                    <span>{isStripeConfigured ? 'Pay with Stripe' : 'Complete Demo Purchase'}</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
