'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
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

        {/* Logo — centered */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center select-none group">
          <img src="/logo_new.png" alt="AniVerse" className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-105" />
          <span className="font-display font-black text-xl tracking-tight text-s5 ml-1">
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
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-s1 transition-all text-s4 hover:text-s5"
            aria-label="Download app">
            <Download size={18} />
          </Link>
        </div>
      </nav>
    </>
  );
}
