import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen px-[clamp(16px,5vw,64px)] pt-32 pb-24 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck size={32} className="text-accent" />
        <h1 className="font-display font-black text-4xl text-s5">Terms of Service</h1>
      </div>
      
      <div className="prose prose-invert prose-p:text-s4 prose-h2:text-s5 prose-h2:font-display prose-h2:mt-8 prose-li:text-s4">
        <p className="text-s4 mb-8">Last updated: 2026</p>

        <h2 className="text-xl font-bold mb-4 text-s5">1. Acceptance of Terms</h2>
        <p className="mb-6 text-s4 leading-relaxed">By accessing or using AniVerse, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree, you are prohibited from using the site.</p>

        <h2 className="text-xl font-bold mb-4 text-s5">2. Use of Content</h2>
        <p className="mb-6 text-s4 leading-relaxed">AniVerse does not host any media files. All content is provided by non-affiliated third parties. You are responsible for ensuring your use of the site complies with local laws and the rights of content owners.</p>

        <h2 className="text-xl font-bold mb-4 text-s5">3. Accounts</h2>
        <p className="mb-6 text-s4 leading-relaxed">If you create an account, you are responsible for maintaining its security and for all activities that occur under the account. You must provide accurate information and promptly update any changes.</p>

        <h2 className="text-xl font-bold mb-4 text-s5">4. Prohibited Activities</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2 text-s4">
          <li>Attempting to bypass access restrictions or security</li>
          <li>Using the service for illegal purposes</li>
          <li>Scraping or automated data collection that degrades the service</li>
        </ul>

        <h2 className="text-xl font-bold mb-4 text-s5">5. Disclaimer</h2>
        <p className="mb-6 text-s4 leading-relaxed">The service is provided on an "as is" and "as available" basis without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free.</p>

        <h2 className="text-xl font-bold mb-4 text-s5">6. Changes to Terms</h2>
        <p className="mb-6 text-s4 leading-relaxed">We may update these Terms from time to time. Continued use of the site after changes constitutes acceptance of the new Terms.</p>
      </div>
    </div>
  );
}
