
import React from 'react';

export const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-24">
      <div className="border-b border-zinc-800 pb-8">
        <h2 className="text-4xl font-bold mb-2 tracking-tight text-white font-cinematic uppercase tracking-widest">Terms of Service</h2>
        <p className="text-zinc-400 uppercase text-[10px] font-bold tracking-widest">Effective Date: October 24, 2023 • Last Updated: March 20, 2024</p>
      </div>

      <div className="space-y-8 text-zinc-300 leading-relaxed text-sm">
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">1. Acceptance of Terms</h3>
          <p>
            By accessing and using <strong>The Secret Life Of Your Pet</strong> ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the studio services.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">2. User Conduct & Content Policy</h3>
          <p>
            You are responsible for all creative prompts and media uploaded to the App.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Safety:</strong> Users must not attempt to generate content that is violent, offensive, adult-oriented, or otherwise harmful.</li>
            <li><strong>Family Friendly:</strong> As the App is distributed on mobile marketplaces, all productions must maintain a PG-rated aesthetic.</li>
            <li><strong>Automated Filtering:</strong> We use AI-driven safety filters. Attempts to bypass these filters may result in account suspension.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">3. Credits & Payments</h3>
          <p>
            Production of cinematic assets requires "Credits".
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Credits have no monetary value outside of the App.</li>
            <li>Purchases are processed securely via Stripe.</li>
            <li>Refunds are governed by the relevant platform's (App Store/Play Store/Stripe) refund policies.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">4. Intellectual Property</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>User Ownership:</strong> Subject to these terms, you own the rights to the AI-generated assets produced by your prompts.</li>
            <li><strong>Model Rights:</strong> The underlying AI models (Gemini, Veo) are owned by Google. Usage is subject to the Google Generative AI Terms of Service.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">5. Disclaimer of Warranties</h3>
          <p>
            The App is provided "as is". Due to the nature of generative AI, we do not guarantee consistent or specific artistic results. Content is synthesized dynamically and may vary between sessions.
          </p>
        </section>
      </div>

      <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] text-center">
         <p className="text-xs text-zinc-500 mb-4">By clicking "Render" or "Generate" within the App, you reaffirm your agreement to these terms.</p>
         <div className="flex justify-center gap-4">
            <div className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full text-[10px] font-black uppercase border border-indigo-500/20">Studio Bound</div>
         </div>
      </div>
    </div>
  );
};
