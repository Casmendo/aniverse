'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Download, Bookmark, User } from 'lucide-react';

const NAV = [
  { href:'/',          icon:Home,     label:'Home' },
  { href:'/downloads', icon:Download, label:'Library' },
  { href:'/watchlist', icon:Bookmark, label:'Watchlist' },
  { href:'/auth',      icon:User,     label:'Account' },
];

export default function BottomNav() {
  const path = usePathname();
  if (path.startsWith('/watch')) return null;

  return (
    <nav className="fixed bottom-4 left-1/2 z-40 flex items-center floating-nav"
      style={{
        background:'rgba(17,33,45,0.95)',
        backdropFilter:'blur(24px)',
        border:'1px solid var(--border)',
        borderRadius:'100px',
        padding:'8px 16px',
        gap:'4px',
        boxShadow:'var(--shadow-lg)',
      }}>
      {NAV.map(({href,icon:Icon,label}) => {
        const active = path===href || (href!=='/' && path.startsWith(href));
        return (
          <Link key={href} href={href}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-full text-[9px] font-display font-bold uppercase tracking-widest transition-all duration-250 ${
              active
                ? 'text-s5 bg-s2'
                : 'text-s3 hover:text-s5 hover:bg-s1'
            }`}>
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8}
              className={`transition-transform duration-250 ${active ? 'scale-110' : ''}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
