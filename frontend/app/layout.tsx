'use client';
import './globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar    from '@/components/Navbar';
import Sidebar   from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import { ToastProvider } from '@/components/Toast';
import LoadingScreen from '@/components/LoadingScreen';
import { useIntroStore } from '@/store/introStore';
import GlobalDownloadProgress from '@/components/GlobalDownloadProgress';
import AuthGuard from '@/components/AuthGuard';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { playIntro, triggerIntro, finishIntro } = useIntroStore();

  useEffect(() => {
    setMounted(true);
    
    // Check if this is the first time visiting in this session
    if (!sessionStorage.getItem('aniverse-intro-played')) {
      triggerIntro();
      sessionStorage.setItem('aniverse-intro-played', 'true');
    }
    
    // Handle Android Back Button
    (async () => {
      if (typeof window !== 'undefined') {
        const { App } = await import('@capacitor/app');
        App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            App.exitApp();
          }
        });
      }
    })();
  }, []);

  const handleLoadDone = () => {
    finishIntro();
  };

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
          {playIntro && <LoadingScreen onDone={handleLoadDone} />}
          <div className={`transition-opacity duration-500 ${playIntro ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <AuthGuard>
              <Navbar />
              <Sidebar />
              <main className="relative z-10 pt-[64px] pb-24 min-h-screen max-w-full overflow-x-hidden">
                {children}
              </main>
              <footer className="py-10 px-6 border-t border-[var(--border)] mt-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase font-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    <span className="text-white font-bold">leo</span>
                    <span style={{ color: '#53C6C1', fontSize: 7 }}>✦</span>
                    <span className="text-s4 font-medium">dev</span>
                    <span style={{ color: '#53C6C1', opacity: 0.4 }}>│</span>
                    <span className="text-white font-bold">zion</span>
                    <span style={{ color: '#53C6C1', fontSize: 7 }}>✦</span>
                    <span className="text-s4 font-medium">ass</span>
                  </div>
                  <p className="text-[9px] text-s2 font-mono uppercase tracking-[.3em]">Enter the Multiverse</p>
                </div>
              </footer>
            <BottomNav />
            </AuthGuard>
          </div>
          <GlobalDownloadProgress />
        </ToastProvider>
      </body>
    </html>
  );
}
