'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Download } from 'lucide-react';
import { useSidebarStore } from '@/store/sidebarStore';
import SearchPage from './SearchPage';
import { animeAPI } from '@/lib/api';

export default function Navbar() {
  const { open } = useSidebarStore();
  const [scrolled,     setScrolled]     = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [recommendations, setRecs]      = useState<Record<string,unknown>[]>([]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  // Preload recommendations for search page
  useEffect(() => {
    (async () => {
      try {
        const { data } = await animeAPI.getAiring();
        const items = data.results || data.data || data.anime || [];
        setRecs(items.slice(0, 20));
      } catch {}
    })();
  }, []);

  return (
    <>
      <SearchPage isOpen={searchOpen} onClose={() => setSearchOpen(false)} initialRecs={recommendations} />

      <nav className={`fixed top-0 left-0 right-0 z-50 h-[64px] flex items-center justify-between px-4 md:px-6 transition-all duration-400 ${
        scrolled ? 'bg-s0/95 backdrop-blur-xl border-b border-[var(--border)]' : 'bg-transparent'
      }`}>

        {/* Hamburger */}
        <button onClick={open}
          className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-s1 transition-all"
          aria-label="Menu">
          <span className="block w-5 h-px bg-s5 rounded-full" />
          <span className="block w-4 h-px bg-s4 rounded-full" />
          <span className="block w-5 h-px bg-s5 rounded-full" />
        </button>

        {/* Logo — SVG A-style */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 select-none group">
          <svg viewBox="0 0 34 38" fill="none" className="w-8 h-9 transition-transform duration-300 group-hover:scale-110">
            <defs>
              <linearGradient id="navLg" x1="0" y1="0" x2="34" y2="38" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#CCD0CF"/>
                <stop offset="60%" stopColor="#9BA8AB"/>
                <stop offset="100%" stopColor="#4A5C6A"/>
              </linearGradient>
            </defs>
            <path d="M17 2L32 36H24L21 29H13L10 36H2Z" fill="url(#navLg)"/>
            <path d="M17 10L22 26H12Z" fill="#06141B"/>
            <circle cx="17" cy="2" r="2" fill="#CCD0CF"/>
          </svg>
          <span className="font-display font-black text-xl tracking-tight text-s5">
            niVerse
          </span>
        </Link>

        {/* Right */}
        <div className="flex items-center gap-1">
          <button onClick={() => setSearchOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-s1 transition-all text-s4 hover:text-s5"
            aria-label="Search">
            <Search size={19} />
          </button>
          <Link href="/apk"
            className="relative flex items-center justify-center w-10 h-10 rounded-xl group overflow-hidden"
            aria-label="Download app">
            {/* Animated gradient border */}
            <div className="absolute inset-0 bg-gradient-to-tr from-s5 via-s3 to-s4 rounded-xl animate-spin-slow" style={{ padding: '2px' }}>
              <div className="w-full h-full bg-s0 rounded-[10px] group-hover:bg-s1 transition-colors flex items-center justify-center">
                <Download size={18} className="text-s5 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            {/* Pulsing glow */}
            <div className="absolute inset-0 bg-s5 opacity-20 blur-md group-hover:opacity-40 transition-opacity rounded-xl" />
          </Link>
        </div>
      </nav>
    </>
  );
}
