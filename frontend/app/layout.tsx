'use client';
import './globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar    from '@/components/Navbar';
import Sidebar   from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import { ToastProvider } from '@/components/Toast';
import LoadingScreen from '@/components/LoadingScreen';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [booting, setBooting] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
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
    setBooting(false);
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
        <title>AniVerse — Enter the Anime Multiverse</title>
      </head>
      <body className="bg-s0 text-s5 font-body">
        <ToastProvider>
          {booting && <LoadingScreen onDone={handleLoadDone} />}
          <div className={`transition-opacity duration-500 ${booting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <Navbar />
            <Sidebar />
            <main className="relative z-10 pt-[64px] pb-24 min-h-screen max-w-full overflow-x-hidden">
              {children}
              
              <footer className="py-10 px-6 border-t border-[var(--border)] mt-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-s3 font-mono text-[10px] tracking-widest uppercase">
                    Build with <span className="text-s4">❤</span> by Leo
                  </div>
                  <p className="text-[9px] text-s2 font-mono uppercase tracking-[.3em]">Enter the Multiverse</p>
                </div>
              </footer>
            </main>
            <BottomNav />
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
