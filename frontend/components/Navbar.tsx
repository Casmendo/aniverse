'use client';
import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { useSidebarStore } from '@/store/sidebarStore';
import dynamic from 'next/dynamic';

const NotificationBell = dynamic(() => import('@/components/NotificationBell'), { ssr: false });

export default function Navbar() {
  const { open } = useSidebarStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 h-[64px] flex items-center justify-between px-5 md:px-6 transition-all duration-500 ${
      scrolled ? 'bg-s0/70 backdrop-blur-2xl border-b border-white/5' : 'bg-transparent'
    }`}>
      {/* Hamburger */}
      <button onClick={open}
        className="w-10 h-10 flex flex-col items-center justify-center gap-[5px] rounded-full hover:bg-white/5 transition-all"
        aria-label="Menu">
        <span className="block w-[18px] h-[1.5px] bg-s5 rounded-full" />
        <span className="block w-[12px] h-[1.5px] bg-s4 rounded-full mr-1.5" />
      </button>

      {/* Center */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 select-none group">
          <svg viewBox="0 0 34 38" fill="none" className="w-8 h-9 transition-transform duration-300 group-hover:scale-110">
            <defs>
              <linearGradient id="navLg" x1="0" y1="0" x2="34" y2="38" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffffff"/>
                <stop offset="50%" stopColor="#fca5a5"/>
                <stop offset="100%" stopColor="#e11d48"/>
              </linearGradient>
            </defs>
            <path d="M17 2L32 36H24L21 29H13L10 36H2Z" fill="url(#navLg)"/>
            <path d="M17 10L22 26H12Z" fill="var(--s0)"/>
            <circle cx="17" cy="2" r="2.5" fill="#e11d48"/>
          </svg>
          <span className="font-display font-black text-xl tracking-tight text-white">
            niVerse
          </span>
        </a>
        
        {/* Divider */}
        <div className="w-[1px] h-5 bg-white/10 hidden sm:block" />
        
        {/* MangaVerse Button */}
        <a href="/manga" className="hidden sm:flex px-2.5 py-1 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-full items-center gap-1.5 transition-colors group">
          <img src="/mangaverse-logo.png" alt="MangaVerse" className="w-4 h-4 object-contain rounded-[2px]" />
          <span className="text-[10px] font-bold text-blue-400 group-hover:text-blue-300 uppercase tracking-wider">Manga</span>
        </a>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <NotificationBell />
      </div>
    </nav>
  );
}
