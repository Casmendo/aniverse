'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Download, Bookmark, User } from 'lucide-react';

const NAV = [
  { href:'/',          icon:Home,     label:'Home' },
  { href:'/downloads', icon:Download, label:'Library' },
  { href:'/watchlist', icon:Bookmark, label:'Watchlist' },
  { href:'/profile',   icon:User,     label:'Profile' },
];

export default function BottomNav() {
  const path = usePathname();
  if (path.startsWith('/watch/')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-s0/95 backdrop-blur-xl border-t border-[var(--border)] pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] px-4 flex items-center justify-around">
      {NAV.map(({href,icon:Icon,label}) => {
        const active = path===href || (href!=='/' && path.startsWith(href));
        return (
          <Link key={href} href={href}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              active ? 'text-s5' : 'text-s3'
            }`}>
            <Icon size={20} strokeWidth={active ? 2.5 : 2}
              className={`transition-all duration-300 ${active ? 'scale-110' : 'opacity-70'}`} />
            <span className={`text-[9px] font-display font-bold uppercase tracking-wider ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
