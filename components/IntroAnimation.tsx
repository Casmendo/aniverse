'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IntroAnimation({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'logo' | 'tagline' | 'exit'>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tagline'), 900);
    const t2 = setTimeout(() => setPhase('exit'), 2600);
    const t3 = setTimeout(() => onDone(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== 'exit' ? (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#06141B] overflow-hidden"
          exit={{ opacity: 0, scale: 1.06 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Animated background glows */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute w-[500px] h-[500px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(83,198,193,0.12) 0%, transparent 70%)', top: '20%', left: '30%', transform: 'translate(-50%,-50%)' }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute w-[300px] h-[300px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(170,217,214,0.08) 0%, transparent 70%)', top: '70%', right: '20%' }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
          </div>

          {/* Logo */}
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* A icon */}
            <motion.div
              className="relative"
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black text-white"
                style={{ background: 'linear-gradient(135deg, #53C6C1, #AAD9D6)', boxShadow: '0 0 40px rgba(83,198,193,0.4)' }}>
                A
              </div>
            </motion.div>

            {/* niVerse text */}
            <motion.h1
              className="font-black text-4xl tracking-tight text-white"
              style={{ fontFamily: 'var(--font-display, system-ui)', letterSpacing: '-0.03em' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <span style={{ color: '#53C6C1' }}>Ani</span>Verse
            </motion.h1>
          </motion.div>

          {/* Tagline */}
          <AnimatePresence>
            {phase === 'tagline' && (
              <motion.div
                key="tagline"
                className="absolute bottom-12 flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ color: '#e05d5d', fontSize: 16 }}
                  >
                    ♥
                  </motion.span>
                  <span className="font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Built with love by <span className="text-white font-bold">Leo</span>
                  </span>
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                    style={{ color: '#e05d5d', fontSize: 16 }}
                  >
                    ♥
                  </motion.span>
                </div>
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: '#53C6C1' }}
                      animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
