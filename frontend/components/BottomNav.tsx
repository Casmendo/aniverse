'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Download, Search, Bookmark, User, BookOpen } from 'lucide-react';
import SearchPage from './SearchPage';
import { animeAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const NAV_LEFT = [
  { href:'/',          icon:Home,     label:'Home' },
  { href:'/library',   icon:Download, label:'Library' },
];
const NAV_RIGHT = [
  { href:'/catalog',   icon:Bookmark, label:'Catalog' }, 
  { href:'/profile',   icon:User,     label:'Profile' },
];

export default function BottomNav() {
  const path = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [recommendations, setRecs]  = useState<Record<string,unknown>[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await animeAPI.getAiring();
        const items = data.results || data.data || data.anime || [];
        setRecs(items.slice(0, 20));
      } catch {}
    })();
  }, []);

  // Hide on watch pages AND all manga pages (manga has its own nav)
  if (path.startsWith('/watch/') || path.startsWith('/manga')) return null;

  return (
    <>
      <SearchPage isOpen={searchOpen} onClose={() => setSearchOpen(false)} initialRecs={recommendations} />

      <div className="fixed bottom-[6px] left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-[420px] pb-[env(safe-area-inset-bottom)]">
        {/* Floating Pill Container */}
        <nav className="relative flex items-center justify-between bg-s1/90 backdrop-blur-2xl border border-white/5 rounded-[28px] px-2 py-4 shadow-[0_24px_48px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)]">
          
          {/* Left Items */}
          <div className="flex w-[40%] justify-around items-center">
            {NAV_LEFT.map(({href,icon:Icon,label}) => {
              const active = path===href || (href!=='/' && path.startsWith(href));
              return (
                <Link key={href} href={href} className="relative flex flex-col items-center gap-1.5 w-12 group">
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} className={`transition-all duration-300 ${active ? 'text-accent scale-110' : 'text-s4 group-hover:text-accent/80'}`} />
                  <span className={`text-[10px] font-bold ${active ? 'text-accent' : 'text-s4 group-hover:text-accent/80'} transition-all`}>{label}</span>
                  {active && <div className="absolute -bottom-4 w-6 h-1 bg-accent rounded-t-full shadow-[0_-2px_10px_rgba(225,29,72,0.6)]" />}
                </Link>
              );
            })}
          </div>

          {/* Center Elevated Button (Search) */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-7">
            <div className="bg-s0 p-2 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.6)]">
              <button onClick={() => setSearchOpen(true)}
                className="w-[52px] h-[52px] bg-accent flex items-center justify-center rounded-full text-white shadow-[0_8px_24px_rgba(225,29,72,0.5),inset_0_2px_4px_rgba(255,255,255,0.3)] hover:scale-105 transition-all duration-300 active:scale-95 group">
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <Search size={22} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform duration-300" />
                </div>
              </button>
            </div>
          </div>

          {/* Right Items */}
          <div className="flex w-[40%] justify-around items-center">
            {NAV_RIGHT.map(({href,icon:Icon,label}) => {
              const active = path===href || (href!=='/' && path.startsWith(href));
              return (
                <Link key={href} href={href} className="relative flex flex-col items-center gap-1.5 w-12 group">
                  {href === '/profile' && user ? (
                    user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.username} className={`w-[22px] h-[22px] rounded-full object-cover transition-all duration-300 ${active ? 'scale-110 border border-accent shadow-[0_0_10px_rgba(225,29,72,0.3)]' : ''}`} />
                    ) : (
                      <div className={`w-[22px] h-[22px] rounded-full bg-s2 border border-[var(--border)] flex items-center justify-center font-bold text-[10px] text-accent transition-all duration-300 ${active ? 'scale-110 border-accent shadow-[0_0_10px_rgba(225,29,72,0.3)]' : ''}`}>
                        {user.avatar || user.username[0].toUpperCase()}
                      </div>
                    )
                  ) : (
                    <Icon size={22} strokeWidth={active ? 2.5 : 2} className={`transition-all duration-300 ${active ? 'text-accent scale-110' : 'text-s4 group-hover:text-accent/80'}`} />
                  )}
                  <span className={`text-[10px] font-bold ${active ? 'text-accent' : 'text-s4 group-hover:text-accent/80'} transition-all`}>{label}</span>
                  {active && <div className="absolute -bottom-4 w-6 h-1 bg-accent rounded-t-full shadow-[0_-2px_10px_rgba(225,29,72,0.6)]" />}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
