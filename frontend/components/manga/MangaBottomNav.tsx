'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Compass, Search, Heart, BookOpen, User, ArrowLeft } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/manga/discover', icon: Compass,  label: 'Discover' },
  { href: '/manga/search',   icon: Search,   label: 'Search'  },
  { href: '/manga/favorites',icon: Heart,    label: 'Saved'   },
  { href: '/manga/library',  icon: BookOpen, label: 'Library' },
  { href: '/manga/profile',  icon: User,     label: 'Profile' },
];

export default function MangaBottomNav() {
  const path = usePathname();
  const router = useRouter();

  // Hide on reader pages
  if (path.includes('/manga/read/')) return null;

  return (
    <div className="fixed bottom-[6px] left-1/2 -translate-x-1/2 z-50 w-[96%] max-w-[480px] pb-[env(safe-area-inset-bottom)]">
      <nav className="relative flex items-center justify-between bg-[#0d0505]/95 backdrop-blur-2xl border border-red-900/20 rounded-[28px] px-2 py-3 shadow-[0_24px_48px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(225,29,72,0.05)]">
        {/* Exit button at far left */}
        <button
          onClick={() => router.push('/')}
          className="relative flex flex-col items-center gap-1.5 w-12 group"
          title="Back to AniVerse"
        >
          <div className="w-8 h-8 rounded-xl bg-red-950/60 border border-red-900/40 flex items-center justify-center group-hover:bg-red-900/60 transition-colors">
            <ArrowLeft size={16} className="text-red-400 group-hover:text-red-300 transition-colors" />
          </div>
          <span className="text-[9px] font-bold text-red-400/70 uppercase tracking-wider">Exit</span>
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-red-900/20 mx-1 shrink-0" />

        {/* Nav items */}
        <div className="flex flex-1 items-center justify-around">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = path === href || path.startsWith(href + '/');
            return (
              <Link key={href} href={href} className="relative flex flex-col items-center gap-1.5 w-12 group">
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="manga-nav-indicator"
                      className="absolute -inset-2 rounded-xl bg-red-500/15"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={`relative transition-all duration-300 ${
                      isActive
                        ? 'text-red-400 scale-110'
                        : 'text-slate-500 group-hover:text-red-400/70'
                    }`}
                  />
                </div>
                <span className={`text-[10px] font-bold transition-all ${
                  isActive ? 'text-red-400' : 'text-slate-600 group-hover:text-slate-400'
                }`}>{label}</span>
                {isActive && (
                  <div className="absolute -bottom-3 w-5 h-0.5 bg-red-500 rounded-t-full shadow-[0_-2px_8px_rgba(225,29,72,0.6)]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
