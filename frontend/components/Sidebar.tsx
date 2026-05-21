'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Download, Bookmark, AppWindow, Pencil, LogOut, LogIn, X, History, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebarStore } from '@/store/sidebarStore';
import { useAuthStore } from '@/store/authStore';
import { useWatchlistStore } from '@/store/watchlistStore';
import { useToast } from './Toast';

export default function Sidebar() {
  const router   = useRouter();
  const path     = usePathname();
  const { isOpen, close } = useSidebarStore();
  const { user, logout, update } = useAuthStore();
  const { watchlist, recentlyWatched } = useWatchlistStore();
  const toast = useToast();
  const [editMode, setEditMode] = useState(false);
  const [newName,  setNewName]  = useState('');
  const [nameErr,  setNameErr]  = useState('');

  const handleLogout = () => {
    logout(); close();
    toast('Logged out', 'info');
    router.push('/');
  };

  const saveUsername = () => {
    if (newName.trim().length < 3) { setNameErr('At least 3 characters'); return; }
    update(newName.trim());
    setEditMode(false);
    toast('Username updated!', 'success');
  };

  const nav = [
    { href:'/',          icon:Home,      label:'Home' },
    { href:'/downloads', icon:Download,  label:'Downloads' },
    { href:'/watchlist', icon:Bookmark,  label:`Watchlist${watchlist.length ? ` (${watchlist.length})` : ''}` },
    { href:'/apk',       icon:AppWindow, label:'Get App' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="overlay"
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            transition={{ duration:0.3 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            onClick={close}
          />

          {/* Panel — floating pill design from image */}
          <motion.aside
            key="panel"
            initial={{ x:'-100%', opacity:0 }}
            animate={{ x:0, opacity:1 }}
            exit={{ x:'-100%', opacity:0 }}
            transition={{ duration:0.38, ease:[0.16,1,0.3,1] }}
            className="fixed top-4 left-4 bottom-4 z-[70] flex flex-col"
            style={{ width: '72px' }}
          >
            {/* Collapsed icon rail */}
            <div className="h-full flex flex-col items-center gap-3 bg-s1/90 backdrop-blur-2xl border border-white/5 rounded-3xl py-5 px-2 shadow-[0_24px_48px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.04)]">
              
              {/* Logo button at top */}
              <Link href="/" onClick={close}
                className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-white font-black text-lg shadow-[0_4px_14px_rgba(59,130,246,0.4)] mb-2 hover:scale-105 transition-transform">
                A
              </Link>

              {/* Nav icons */}
              {nav.map(({ href, icon: Icon, label }) => {
                const active = path===href || (href!=='/' && path.startsWith(href));
                return (
                  <Link key={href} href={href} onClick={close}
                    className={`relative w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-200 group ${
                      active
                        ? 'bg-accent/20 text-accent scale-105'
                        : 'text-s4 hover:text-white hover:bg-white/5'
                    }`}
                    title={label}>
                    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                    {active && <div className="absolute right-0 w-[3px] h-5 bg-accent rounded-l-full" />}
                  </Link>
                );
              })}

              <div className="flex-1" />

              {/* Auth */}
              {user ? (
                <>
                  <div className="w-10 h-10 rounded-2xl bg-s2 border border-white/10 flex items-center justify-center font-black text-white text-sm cursor-default select-none">
                    {user.username[0].toUpperCase()}
                  </div>
                  <button onClick={handleLogout}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl text-s4 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Logout">
                    <LogOut size={18} />
                  </button>
                </>
              ) : (
                <Link href="/auth" onClick={close}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl text-accent bg-accent/10 hover:bg-accent/20 transition-all"
                  title="Sign In">
                  <LogIn size={18} />
                </Link>
              )}

              {/* Close */}
              <button onClick={close}
                className="w-10 h-10 flex items-center justify-center rounded-2xl text-s4 hover:text-white hover:bg-white/5 transition-all mt-1">
                <X size={18} />
              </button>
            </div>
          </motion.aside>

          {/* Expanded panel (slides in beside icon rail on click) */}
          <motion.aside
            key="expanded"
            initial={{ x:'-100%', opacity:0 }}
            animate={{ x:0, opacity:1 }}
            exit={{ x:'-100%', opacity:0 }}
            transition={{ duration:0.42, ease:[0.16,1,0.3,1], delay:0.05 }}
            className="fixed top-4 bottom-4 z-[69] flex flex-col"
            style={{ left: '88px', width: '220px' }}
          >
            <div className="h-full flex flex-col bg-s1/95 backdrop-blur-2xl border border-white/5 rounded-3xl py-5 px-3 shadow-[0_24px_48px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.04)]"
              onClick={e => e.stopPropagation()}>

              {/* Profile */}
              <div className="px-3 pb-4 mb-2 border-b border-white/5">
                {!editMode ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-s2 border border-white/10 flex items-center justify-center font-black text-white text-base shrink-0">
                      {user ? user.username[0].toUpperCase() : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white truncate">{user?.username || 'Guest'}</p>
                      <p className="text-[11px] text-s4 truncate">{user?.email || 'Not signed in'}</p>
                    </div>
                    {user && (
                      <button onClick={() => { setNewName(user.username); setNameErr(''); setEditMode(true); }}
                        className="p-1.5 rounded-lg text-s4 hover:text-white hover:bg-white/5 transition-all">
                        <Pencil size={13} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input value={newName} onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveUsername()}
                      className="w-full px-3 py-2 rounded-xl bg-s0 border border-white/10 text-sm text-white outline-none focus:border-accent/50 transition-colors"
                      placeholder="New username…" autoFocus />
                    {nameErr && <p className="text-red-400 text-xs">{nameErr}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => setEditMode(false)} className="flex-1 py-1.5 rounded-lg bg-s2 text-s4 text-xs hover:bg-s2/80 transition-colors">Cancel</button>
                      <button onClick={saveUsername} className="flex-1 py-1.5 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent/80 transition-colors">Save</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Nav items */}
              <nav className="flex-1 space-y-0.5 overflow-y-auto">
                {nav.map(({ href, icon: Icon, label }) => {
                  const active = path===href || (href!=='/' && path.startsWith(href));
                  return (
                    <Link key={href} href={href} onClick={close}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'bg-accent/10 text-accent'
                          : 'text-s4 hover:bg-white/5 hover:text-white'
                      }`}>
                      <Icon size={17} />
                      <span className="flex-1">{label}</span>
                      {active && <ChevronRight size={14} className="opacity-50" />}
                    </Link>
                  );
                })}

                {/* Recent history */}
                {recentlyWatched.length > 0 && (
                  <>
                    <div className="px-3 pt-4 pb-1">
                      <div className="flex items-center gap-2 text-s4 text-[10px] font-mono uppercase tracking-widest">
                        <History size={10} /> Continue
                      </div>
                    </div>
                    {recentlyWatched.slice(0, 3).map((r) => (
                      <Link key={r.slug}
                        href={r.lastEpId ? `/watch/${r.slug}/${r.lastEpId}?title=${encodeURIComponent(r.title)}&ep=${r.lastEpNum}` : `/anime/${r.slug}?title=${encodeURIComponent(r.title)}`}
                        onClick={close}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-s4 hover:bg-white/5 hover:text-white transition-all">
                        <div className="w-7 h-9 rounded-lg bg-s2 overflow-hidden shrink-0">
                          <img src={r.cover} alt={r.title} className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).src=`https://picsum.photos/seed/${r.slug}/60/90`; }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate text-white">{r.title}</p>
                          {r.lastEpNum > 0 && <p className="text-[10px] text-s4">EP {r.lastEpNum}</p>}
                        </div>
                      </Link>
                    ))}
                  </>
                )}
              </nav>

              <div className="pt-3 border-t border-white/5">
                <p className="text-[10px] text-s4 font-mono px-3">AniVerse v2.0 · Midnight Edition</p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
