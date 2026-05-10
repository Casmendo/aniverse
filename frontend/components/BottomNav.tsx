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
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex justify-center pointer-events-none">
      <nav className="flex items-center floating-nav pointer-events-auto"
        style={{
          background:'rgba(11,22,32,0.92)',
          backdropFilter:'blur(20px)',
          border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:'100px',
          padding:'6px 12px',
          gap:'2px',
          boxShadow:'0 20px 40px -10px rgba(0,0,0,0.5)',
        }}>
        {NAV.map(({href,icon:Icon,label}) => {
          const active = path===href || (href!=='/' && path.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-full text-[9px] font-display font-bold uppercase tracking-widest transition-all duration-300 ${
                active
                  ? 'text-s5 bg-white/5'
                  : 'text-s3 hover:text-white/80'
              }`}>
              <Icon size={19} strokeWidth={active ? 2.5 : 2}
                className={`transition-all duration-300 ${active ? 'scale-110' : 'opacity-70'}`} />
              <span className={active ? 'opacity-100' : 'opacity-60'}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
