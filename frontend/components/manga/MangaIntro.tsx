'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen } from 'lucide-react';

interface MangaIntroProps {
  onComplete: () => void;
}

// Particle helper
function Particle({ x, y, size, delay, duration }: { x: number; y: number; size: number; delay: number; duration: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-red-500/30"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0, 1.2, 0],
        y: [0, -60, -120],
        x: [0, (Math.random() - 0.5) * 40],
      }}
      transition={{ delay, duration, repeat: Infinity, repeatDelay: Math.random() * 2 }}
    />
  );
}

// Speed line helper
function SpeedLine({ angle, y }: { angle: number; y: number }) {
  return (
    <motion.div
      className="absolute h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent"
      style={{ top: `${y}%`, left: '-10%', right: '-10%', transform: `rotate(${angle}deg)` }}
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: [0, 1, 0], opacity: [0, 0.5, 0] }}
      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: Math.random() * 2, delay: Math.random() * 1.5 }}
    />
  );
}

export default function MangaIntro({ onComplete }: MangaIntroProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    // Phase timing: enter (1.2s) → hold (1.5s) → exit (0.8s)
    const t1 = setTimeout(() => setPhase('hold'), 1200);
    const t2 = setTimeout(() => setPhase('exit'), 2700);
    const t3 = setTimeout(() => onComplete(), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  const particles = Array.from({ length: 20 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 3,
    delay: Math.random() * 2,
    duration: Math.random() * 2 + 1.5,
  }));

  const speedLines = Array.from({ length: 12 }, (_, i) => ({
    angle: (Math.random() - 0.5) * 15,
    y: i * 8 + 5,
  }));

  return (
    <AnimatePresence>
      {phase !== 'exit' ? (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ background: 'radial-gradient(ellipse at center, #1a0a0a 0%, #06141B 50%, #000 100%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {/* Manga panel grid background */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `
              linear-gradient(rgba(225,29,72,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(225,29,72,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }} />

          {/* Speed lines */}
          {speedLines.map((l, i) => <SpeedLine key={i} {...l} />)}

          {/* Particles */}
          {particles.map((p, i) => <Particle key={i} {...p} />)}

          {/* Radial glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
              style={{ background: 'radial-gradient(ellipse, rgba(225,29,72,0.15) 0%, transparent 70%)' }} />
          </div>

          {/* Corner manga panels */}
          <div className="absolute top-4 left-4 w-24 h-32 border border-red-900/30 rounded opacity-20" />
          <div className="absolute top-4 right-4 w-20 h-20 border border-red-900/30 rounded opacity-20" />
          <div className="absolute bottom-4 left-4 w-20 h-28 border border-red-900/30 rounded opacity-20" />
          <div className="absolute bottom-4 right-4 w-28 h-20 border border-red-900/30 rounded opacity-20" />

          {/* Main Content */}
          <div className="relative flex flex-col items-center justify-center select-none">
            {/* BookOpen Icon — bounces in */}
            <motion.div
              className="mb-6"
              initial={{ y: -120, opacity: 0, scale: 0.3 }}
              animate={phase === 'enter'
                ? { y: 0, opacity: 1, scale: 1 }
                : { y: 0, opacity: 1, scale: [1, 1.1, 1] }
              }
              transition={phase === 'enter'
                ? { type: 'spring', stiffness: 300, damping: 12, delay: 0.3 }
                : { duration: 1, repeat: Infinity, ease: 'easeInOut' }
              }
            >
              <div className="relative">
                {/* Icon glow */}
                <div className="absolute inset-0 blur-2xl rounded-full bg-red-500/40 scale-150" />
                <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #e11d48, #9f1239)', boxShadow: '0 0 40px rgba(225,29,72,0.6)' }}>
                  <BookOpen size={40} className="text-white drop-shadow-lg" />
                </div>
              </div>
            </motion.div>

            {/* MANGA text */}
            <div className="overflow-hidden mb-0">
              <motion.div
                initial={{ x: -200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.5 }}
              >
                <span
                  className="block font-black tracking-[0.2em] leading-none"
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 'clamp(3rem, 12vw, 7rem)',
                    color: '#fff',
                    WebkitTextStroke: '2px rgba(225,29,72,0.8)',
                    textShadow: '0 0 40px rgba(225,29,72,0.5), 0 0 80px rgba(225,29,72,0.2), 4px 4px 0 rgba(225,29,72,0.3)',
                  }}
                >
                  MANGA
                </span>
              </motion.div>
            </div>

            {/* VERSE text */}
            <div className="overflow-hidden">
              <motion.div
                initial={{ x: 200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.75 }}
              >
                <span
                  className="block font-black tracking-[0.35em] leading-none"
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 'clamp(2.5rem, 9vw, 5.5rem)',
                    background: 'linear-gradient(90deg, #e11d48, #fb923c, #e11d48)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: 'none',
                    filter: 'drop-shadow(0 0 20px rgba(225,29,72,0.6))',
                  }}
                >
                  VERSE
                </span>
              </motion.div>
            </div>

            {/* Tagline */}
            <motion.p
              className="mt-6 text-sm tracking-[0.4em] uppercase font-bold"
              style={{ color: 'rgba(225,29,72,0.7)', fontFamily: "'Orbitron', monospace" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
            >
              Enter the World
            </motion.p>

            {/* Loading dots */}
            <motion.div
              className="flex items-center gap-2 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-red-500"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
