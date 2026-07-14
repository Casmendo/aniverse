'use client';
import './globals.css';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Navbar    from '@/components/Navbar';
import Sidebar   from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import { ToastProvider } from '@/components/Toast';
import LoadingScreen from '@/components/LoadingScreen';
import { useIntroStore } from '@/store/introStore';
import GlobalDownloadProgress from '@/components/GlobalDownloadProgress';
import AuthGuard from '@/components/AuthGuard';
import WelcomeNotification from '@/components/WelcomeNotification';
import OfflineBanner from '@/components/OfflineBanner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { playIntro, triggerIntro, finishIntro } = useIntroStore();

  useEffect(() => {
    setMounted(true);
    
    // Check if this is the first time visiting in this session
    if (!sessionStorage.getItem('aniverse-intro-played')) {
      triggerIntro();
      sessionStorage.setItem('aniverse-intro-played', 'true');
    }
  }, []);

  const handleLoadDone = () => {
    finishIntro();
  };

  const isManga = pathname?.startsWith('/manga');

  if (!mounted) return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <title>AniVerse</title>
      </head>
      <body className="bg-s0" />
    </html>
  );

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Enter the Anime Multiverse — stream and explore anime." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Exo+2:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="shortcut icon" href="/icon.svg" />
        <title>AniVerse — Enter the Anime Multiverse</title>
      </head>
      <body className="bg-s0 text-s5 font-body">
        <ToastProvider>
          <OfflineBanner />
          {playIntro && <LoadingScreen onDone={handleLoadDone} />}
          <div className={`transition-opacity duration-500 ${playIntro ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <AuthGuard>
              {!isManga && <Navbar />}
              {!isManga && <Sidebar />}
              <main className={`relative z-10 ${!isManga ? 'pt-[64px] pb-24' : ''} min-h-screen max-w-full overflow-x-hidden`}>
                {children}
              </main>
              {!isManga && (
                <footer className="py-12 px-[clamp(16px,5vw,64px)] border-t border-[var(--border)] mt-10 bg-s0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
                    {/* Brand & About */}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2 text-2xl font-black font-display text-white">
                        <span className="text-accent">Ani</span>Verse
                      </div>
                      <p className="text-sm text-s4 leading-relaxed">
                        The ultimate anime streaming experience. Watch your favorite anime shows anytime, anywhere.
                      </p>
                      <div className="flex gap-4 mt-2">
                        <a href="https://wa.me/23409039951951" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-s2 flex items-center justify-center hover:bg-s4 hover:text-white transition-colors" title="Contact Developer">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                        </a>
                        <a href="https://t.me/Aniverseup" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[#2AABEE]/20 text-[#2AABEE] flex items-center justify-center hover:bg-[#2AABEE] hover:text-white transition-colors" title="Telegram Channel">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.68c.223-.198-.054-.309-.346-.111l-6.4 4.024-2.76-.86c-.6-.188-.61-.6.126-.89l10.814-4.17c.505-.19.95.128.846.942z"/></svg>
                        </a>
                        <a href="https://whatsapp.com/channel/0029Vb80hNm29758RPvXFc2K" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-colors" title="WhatsApp Channel">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                        </a>
                      </div>
                    </div>
                    
                    {/* Navigation */}
                    <div className="flex flex-col gap-3">
                      <h3 className="font-bold text-s5 uppercase tracking-wider mb-2">Navigation</h3>
                      <ul className="space-y-2 text-sm text-s4 flex flex-col items-start">
                        <Link href="/" className="hover:text-accent transition-colors">Home</Link>
                        <Link href="/catalog" className="hover:text-accent transition-colors">Catalog</Link>
                        <Link href="/library" className="hover:text-accent transition-colors">Schedule</Link>
                        <Link href="#" className="hover:text-accent transition-colors">Forums</Link>
                        <Link href="#" className="hover:text-accent transition-colors">Music</Link>
                      </ul>
                    </div>

                    {/* Legal */}
                    <div className="flex flex-col gap-3">
                      <h3 className="font-bold text-s5 uppercase tracking-wider mb-2">Legal & Info</h3>
                      <ul className="space-y-2 text-sm text-s4 flex flex-col items-start">
                        <Link href="/terms" className="hover:text-accent transition-colors">Terms of Service</Link>
                        <Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-accent transition-colors">DMCA</Link>
                        <Link href="#" className="hover:text-accent transition-colors">Contact Us</Link>
                        <Link href="#" className="hover:text-accent transition-colors">FAQ</Link>
                      </ul>
                    </div>

                    {/* Top Genres */}
                    <div className="flex flex-col gap-3">
                      <h3 className="font-bold text-s5 uppercase tracking-wider mb-2">Top Genres</h3>
                      <div className="flex flex-wrap gap-2">
                        {['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mecha', 'Music', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'].map(g => (
                          <Link key={g} href={`/?genre=${g}`} className="text-xs px-2 py-1 rounded bg-s1 text-s4 hover:bg-s2 hover:text-s5 transition-colors border border-[var(--border)]">
                            {g}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Copyright & Disclaimer */}
                  <div className="flex flex-col items-center gap-3 pt-8 border-t border-[var(--border)]">
                    <p className="text-xs text-s4 text-center">
                      This site does not store any files on its server. All contents are provided by non-affiliated third parties.
                    </p>
                    <div className="text-[12px] text-s4 font-mono">
                      © {new Date().getFullYear()} AniVerse. All rights reserved.
                    </div>
                  </div>
                </footer>
              )}
              {!isManga && <BottomNav />}
            </AuthGuard>
          </div>
          <WelcomeNotification />
          <GlobalDownloadProgress />
        </ToastProvider>
      </body>
    </html>
  );
}
