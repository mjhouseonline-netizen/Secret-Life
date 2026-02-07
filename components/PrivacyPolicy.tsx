
import React from 'react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-24">
      <div className="border-b border-zinc-800 pb-8">
        <h2 className="text-4xl font-bold mb-2 tracking-tight text-white font-cinematic uppercase tracking-widest">Privacy Policy</h2>
        <p className="text-zinc-400 uppercase text-[10px] font-bold tracking-widest">Effective Date: October 24, 2023 • Last Updated: March 20, 2024</p>
      </div>

      <div className="space-y-8 text-zinc-300 leading-relaxed text-sm">
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">1. Introduction</h3>
          <p>
            Welcome to <strong>The Secret Life Of Your Pet</strong> ("the App"). We are committed to protecting your privacy. This policy explains how we handle your data when you use our AI-powered creative studio.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">2. Data Collection & Usage</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Images & Audio:</strong> Any media you upload is processed exclusively to generate AI content. We do not use your personal media for training general AI models.</li>
            <li><strong>Gemini API:</strong> Content generation is powered by the Google Gemini API. Data sent to Gemini is subject to Google's Enterprise Privacy commitments.</li>
            <li><strong>Local Storage:</strong> Your production history and settings are stored locally on your device for your convenience.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">3. OAuth & Google Drive Sync</h3>
          <p>
            If you choose to enable "Cloud Sync," we request access to your Google Drive via the <code>drive.file</code> scope.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>We ONLY access files created by this App.</li>
            <li>We do not read or delete your other personal files in Google Drive.</li>
            <li>Your access token is stored locally and never transmitted to our own servers.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">4. Safety & Content</h3>
          <p>
            The App utilizes strict family-friendly filtering. We do not allow the generation of prohibited or harmful content. For more details on safe AI usage, refer to the Google AI Studio safety guidelines.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">5. Contact</h3>
          <p>
            For questions regarding this policy, contact the studio director at: <span className="text-indigo-400 font-bold">bubblesfox@gmail.com</span>
          </p>
        </section>
      </div>

      <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] text-center">
         <p className="text-xs text-zinc-500 mb-4">This policy is designed to meet the requirements for App Store and Play Store distribution.</p>
         <div className="flex justify-center gap-4">
            <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase border border-green-500/20">GDPR COMPLIANT</div>
            <div className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full text-[10px] font-black uppercase border border-indigo-500/20">CCPA READY</div>
         </div>
      </div>
    </div>
  );
};
