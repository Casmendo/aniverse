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
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
        {/* Logo */}
        <a href="/" className="flex items-center select-none group">
          <span className="font-display font-black text-3xl tracking-tight text-accent transition-transform duration-300 group-hover:scale-105">
            Ani
          </span>
          <span className="font-display font-black text-3xl tracking-tight text-white transition-transform duration-300 group-hover:scale-105">
            Verse
          </span>
        </a>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <NotificationBell />
      </div>
    </nav>
  );
}
