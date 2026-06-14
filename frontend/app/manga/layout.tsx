'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import MangaIntro from '@/components/manga/MangaIntro';
import MangaBottomNav from '@/components/manga/MangaBottomNav';

const INTRO_KEY = 'mangaverse_intro_shown';

export default function MangaLayout({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(false);
  const [ready, setReady] = useState(false);
  const path = usePathname();

  useEffect(() => {
    // Show intro only once per session
    const shown = sessionStorage.getItem(INTRO_KEY);
    if (!shown && path === '/manga') {
      setShowIntro(true);
    } else {
      setReady(true);
    }
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem(INTRO_KEY, '1');
    setShowIntro(false);
    setReady(true);
  };

  const isReader = path.includes('/manga/read/');

  return (
    <>
      {showIntro && <MangaIntro onComplete={handleIntroComplete} />}

      <AnimatePresence mode="wait">
        {ready && (
          <motion.div
            key="manga-content"
            className="min-h-screen"
            style={{ background: 'var(--s0)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {children}
            {!isReader && <MangaBottomNav />}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
