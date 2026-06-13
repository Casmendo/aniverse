'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Download, Search, Bookmark, User } from 'lucide-react';
import SearchPage from './SearchPage';
import { animeAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const NAV_ITEMS = [
  { href:'/',          icon:Home,     label:'Home' },
  { href:'/schedule',  icon:Search,   label:'Schedule' }, // Using Search icon temporarily for schedule/catalog since we don't have all imported, let's fix imports
  { href:'/catalog',   icon:Bookmark, label:'Catalog' },
  { href:'/library',   icon:Download, label:'Library' },
  { href:'/profile',   icon:User,     label:'Profile' },
];

export default function BottomNav() {
  const path = usePathname();
  const { user } = useAuthStore();

  if (path.startsWith('/watch/')) return null;

  return (
    <div className="fixed bottom-[6px] left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-[420px] pb-[env(safe-area-inset-bottom)]">
      <nav className="relative flex items-center justify-between bg-s1/90 backdrop-blur-2xl border border-white/5 rounded-[28px] px-4 py-4 shadow-[0_24px_48px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)]">
        {NAV_ITEMS.map(({href,icon:Icon,label}) => {
          const active = path===href || (href!=='/' && path.startsWith(href));
          return (
            <Link key={href} href={href} className="relative flex flex-col items-center gap-1 w-[20%] group">
              {href === '/profile' && user && user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className={`w-6 h-6 rounded-full object-cover transition-all duration-300 ${active ? 'scale-110 shadow-[0_0_10px_rgba(255,215,0,0.3)]' : 'opacity-70'}`} />
              ) : (
                <Icon size={24} strokeWidth={active ? 2.5 : 2} className={`transition-all duration-300 ${active ? 'text-[#FFD700] scale-110' : 'text-s4 group-hover:text-white'}`} />
              )}
              <span className={`text-[10px] font-bold ${active ? 'text-[#FFD700]' : 'text-s4 group-hover:text-white'} transition-all`}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
