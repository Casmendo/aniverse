'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Compass, Search, Clock, Heart } from 'lucide-react';

// ── Nav items (Home, Discover, Search, Recent, Favorites) ─────────────────────
const NAV_ITEMS = [
  { href: '/manga',          icon: Home,    label: 'Home'     },
  { href: '/manga/discover', icon: Compass, label: 'Discover' },
  { href: '/manga/search',   icon: Search,  label: 'Search'   },
  { href: '/manga/library',  icon: Clock,   label: 'Recent'   },
  { href: '/manga/favorites',icon: Heart,   label: 'Saved'    },
];

// ── Sparkling Star icon ────────────────────────────────────────────────────────
function SparkStar({ animate }: { animate: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      {/* Main star */}
      <motion.path
        d="M12 2 L13.5 9 L20 12 L13.5 15 L12 22 L10.5 15 L4 12 L10.5 9 Z"
        fill="white"
        animate={animate ? {
          scale: [1, 1.3, 1],
          filter: ['drop-shadow(0 0 0px white)', 'drop-shadow(0 0 8px white)', 'drop-shadow(0 0 0px white)'],
        } : {}}
        transition={{ duration: 0.6, repeat: animate ? Infinity : 0, repeatDelay: 1.2 }}
      />
      {/* Small sparkle top-right */}
      <motion.circle cx="19" cy="5" r="1.5" fill="white"
        animate={animate ? { opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] } : { opacity: 0.4 }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
      />
      {/* Small sparkle bottom-left */}
      <motion.circle cx="5" cy="19" r="1" fill="white"
        animate={animate ? { opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] } : { opacity: 0.4 }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0.8 }}
      />
    </svg>
  );
}

// ── AniVerse Exit Splash ───────────────────────────────────────────────────────
function ExitSplash({ onDone }: { onDone: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: '#0a0a0f' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onAnimationComplete={() => setTimeout(onDone, 1400)}
    >
      {/* Radiating rings */}
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          className="absolute rounded-full border border-red-500/30"
          initial={{ width: 60, height: 60, opacity: 0 }}
          animate={{ width: 300, height: 300, opacity: [0, 0.4, 0] }}
          transition={{ duration: 1.2, delay: i * 0.25, ease: 'easeOut' }}
        />
      ))}
      {/* Logo mark */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="flex flex-col items-center gap-4"
      >
        <svg viewBox="0 0 34 38" fill="none" className="w-16 h-16 drop-shadow-[0_0_24px_rgba(225,29,72,0.8)]">
          <defs>
            <linearGradient id="exitGrad" x1="0" y1="0" x2="34" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff"/>
              <stop offset="50%" stopColor="#fca5a5"/>
              <stop offset="100%" stopColor="#e11d48"/>
            </linearGradient>
          </defs>
          <path d="M17 2L32 36H24L21 29H13L10 36H2Z" fill="url(#exitGrad)"/>
          <path d="M17 10L22 26H12Z" fill="#0a0a0f"/>
          <circle cx="17" cy="2" r="2.5" fill="#e11d48"/>
        </svg>
        <motion.span
          className="font-black text-2xl tracking-widest text-white"
          style={{ fontFamily: "'Orbitron', monospace" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          ni<span className="text-red-400">Verse</span>
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MangaBottomNav() {
  const path   = usePathname();
  const router = useRouter();
  const [exiting, setExiting] = useState(false);
  const [sparkHover, setSparkHover] = useState(false);

  // Hide on reader pages
  if (path.includes('/reader/')) return null;

  const handleExit = useCallback(() => {
    if (exiting) return;
    setExiting(true);
  }, [exiting]);

  const handleExitDone = useCallback(() => {
    router.push('/');
  }, [router]);

  // Active check — /manga exact match is Home
  const isActive = (href: string) => {
    if (href === '/manga') return path === '/manga';
    return path.startsWith(href);
  };

  return (
    <>
      {/* Exit splash overlay */}
      <AnimatePresence>
        {exiting && <ExitSplash onDone={handleExitDone} />}
      </AnimatePresence>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pb-[env(safe-area-inset-bottom)]">
        <nav
          className="flex items-center gap-1 px-2 py-2 rounded-full"
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.06)',
          }}
        >
          {/* ── Exit button (left highlight circle like reference) ── */}
          <motion.button
            onClick={handleExit}
            onHoverStart={() => setSparkHover(true)}
            onHoverEnd={() => setSparkHover(false)}
            whileTap={{ scale: 0.9 }}
            className="relative flex items-center justify-center w-11 h-11 rounded-full shrink-0"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 0 16px rgba(37,99,235,0.6)',
            }}
            title="Exit to AniVerse"
          >
            <SparkStar animate={sparkHover || true} />
          </motion.button>

          {/* ── Divider ── */}
          <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />

          {/* ── Nav items ── */}
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href}
                className="relative flex flex-col items-center justify-center w-12 h-11 gap-0.5 group rounded-full transition-all"
              >
                {active && (
                  <motion.div
                    layoutId="manga-pill-active"
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'rgba(37,99,235,0.18)', border: '1px solid rgba(37,99,235,0.3)' }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  />
                )}
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={`relative transition-all duration-200 ${
                    active ? 'text-blue-400 scale-110' : 'text-white/50 group-hover:text-white/80'
                  }`}
                />
                <span className={`relative text-[9px] font-bold tracking-wide transition-colors ${
                  active ? 'text-blue-400' : 'text-white/40 group-hover:text-white/60'
                }`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
