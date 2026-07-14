import React from 'react';
import { Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-[clamp(16px,5vw,64px)] pt-32 pb-24 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Lock size={32} className="text-accent" />
        <h1 className="font-display font-black text-4xl text-s5">Privacy Policy</h1>
      </div>
      
      <div className="prose prose-invert prose-p:text-s4 prose-h2:text-s5 prose-h2:font-display prose-h2:mt-8 prose-li:text-s4">
        <p className="text-s4 mb-8">Last updated: 2026</p>

        <h2 className="text-xl font-bold mb-4 text-s5">1. Information We Collect</h2>
        <p className="mb-6 text-s4 leading-relaxed">When you create an account on AniVerse, we may collect basic information such as your email address and a username. We also automatically collect certain technical information when you visit the site, such as your IP address, browser type, and usage patterns to help us improve your experience.</p>

        <h2 className="text-xl font-bold mb-4 text-s5">2. How We Use Your Information</h2>
        <p className="mb-6 text-s4 leading-relaxed">We use the information we collect to operate, maintain, and improve our services. This includes syncing your watchlist, personalizing content, and ensuring the security of our platform. We do not sell your personal data to third parties.</p>

        <h2 className="text-xl font-bold mb-4 text-s5">3. Cookies and Tracking</h2>
        <p className="mb-6 text-s4 leading-relaxed">AniVerse uses cookies to keep you logged in and to remember your preferences (like volume levels or UI themes). You can control the use of cookies at the individual browser level, but if you choose to disable cookies, it may limit your use of certain features or functions on our website.</p>

        <h2 className="text-xl font-bold mb-4 text-s5">4. Third-Party Links and Content</h2>
        <p className="mb-6 text-s4 leading-relaxed">AniVerse acts as an aggregator and does not host media files on its own servers. Our site contains links to third-party services and embedded media players. We are not responsible for the privacy practices or the content of these third-party websites.</p>

        <h2 className="text-xl font-bold mb-4 text-s5">5. Data Security</h2>
        <p className="mb-6 text-s4 leading-relaxed">We implement standard security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.</p>

        <h2 className="text-xl font-bold mb-4 text-s5">6. Changes to this Policy</h2>
        <p className="mb-6 text-s4 leading-relaxed">We may update this Privacy Policy periodically. We will notify you of any changes by posting the new Privacy Policy on this page. Your continued use of the service after such modifications will constitute your acknowledgment of the modified policy.</p>
      </div>
    </div>
  );
}
