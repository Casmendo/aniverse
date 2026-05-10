'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Download, Bookmark, AppWindow, Pencil, LogOut, LogIn, X, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebarStore } from '@/store/sidebarStore';
import { useAuthStore } from '@/store/authStore';
import { useWatchlistStore } from '@/store/watchlistStore';
import { useToast } from './Toast';

export default function Sidebar() {
  const router = useRouter();
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
    { href:'/',          icon:Home,     label:'Home' },
    { href:'/downloads', icon:Download, label:'Downloads' },
    { href:'/watchlist', icon:Bookmark, label:`Watchlist${watchlist.length ? ` (${watchlist.length})` : ''}` },
    { href:'/apk',       icon:AppWindow,label:'Get App' },
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
            className="fixed inset-0 z-[60] bg-s0/80 backdrop-blur-sm"
            onClick={close}
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            initial={{ x:'-100%' }}
            animate={{ x:0 }}
            exit={{ x:'-100%' }}
            transition={{ duration:0.38, ease:[0.16,1,0.3,1] }}
            className="fixed top-0 left-0 bottom-0 z-[70] w-72 flex flex-col bg-s1 border-r border-[var(--border)]"
            style={{ boxShadow:'var(--shadow-lg)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <Link href="/" onClick={close} className="flex items-center gap-2 font-display font-black text-lg text-s5">
                <svg viewBox="0 0 34 38" fill="none" className="w-6 h-7">
                  <defs>
                    <linearGradient id="slg2" x1="0" y1="0" x2="34" y2="38" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#CCD0CF"/>
                      <stop offset="100%" stopColor="#4A5C6A"/>
                    </linearGradient>
                  </defs>
                  <path d="M17 2L32 36H24L21 29H13L10 36H2Z" fill="url(#slg2)"/>
                  <path d="M17 10L22 26H12Z" fill="#11212D"/>
                </svg>
                niVerse
              </Link>
              <button onClick={close} className="w-8 h-8 rounded-lg flex items-center justify-center text-s3 hover:text-s5 hover:bg-s2 transition-all">
                <X size={16} />
              </button>
            </div>

            {/* Profile */}
            <div className="px-5 py-5 border-b border-[var(--border)]">
              {!editMode ? (
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-s2 border border-[var(--border-hi)] flex items-center justify-center font-display font-bold text-lg text-s5 shrink-0">
                    {user ? user.username[0].toUpperCase() : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-s5 truncate">{user?.username || 'Guest'}</p>
                    <p className="text-xs text-s3 truncate">{user?.email || 'Not signed in'}</p>
                    {user && (
                      <p className="text-[10px] text-s3 mt-0.5">
                        {watchlist.length} watchlist · {recentlyWatched.length} watched
                      </p>
                    )}
                  </div>
                  {user && (
                    <button onClick={() => { setNewName(user.username); setNameErr(''); setEditMode(true); }}
                      className="p-2 rounded-lg text-s3 hover:text-s5 hover:bg-s2 transition-all">
                      <Pencil size={13} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <input value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveUsername()}
                    className="w-full px-3 py-2 rounded-lg bg-s0 border border-[var(--border)] text-sm text-s5 outline-none focus:border-[var(--border-hi)] transition-colors"
                    placeholder="New username…" autoFocus />
                  {nameErr && <p className="text-red-400 text-xs">{nameErr}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => setEditMode(false)} className="flex-1 py-1.5 rounded-lg bg-s2 text-s4 text-xs hover:bg-s2/80 transition-colors">Cancel</button>
                    <button onClick={saveUsername} className="flex-1 py-1.5 rounded-lg bg-s5 text-s0 text-xs font-bold hover:bg-s4 transition-colors">Save</button>
                  </div>
                </div>
              )}
            </div>

            {/* Nav items */}
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {nav.map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href} onClick={close}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-s4 text-sm font-medium hover:bg-s2 hover:text-s5 transition-all duration-200 hover:translate-x-1">
                  <Icon size={17} />
                  {label}
                </Link>
              ))}

              {/* Recent history */}
              {recentlyWatched.length > 0 && (
                <>
                  <div className="px-4 pt-4 pb-1">
                    <div className="flex items-center gap-2 text-s3 text-[10px] font-mono uppercase tracking-widest">
                      <History size={11} /> Continue Watching
                    </div>
                  </div>
                  {recentlyWatched.slice(0, 4).map((r) => (
                    <Link key={r.slug}
                      href={r.lastEpId ? `/watch/${r.slug}/${r.lastEpId}` : `/anime/${r.slug}`}
                      onClick={close}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-s4 hover:bg-s2 hover:text-s5 transition-all">
                      <div className="w-8 h-10 rounded bg-s2 overflow-hidden shrink-0">
                        <img src={r.cover} alt={r.title} className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).src=`https://picsum.photos/seed/${r.slug}/60/90`; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{r.title}</p>
                        {r.lastEpNum > 0 && <p className="text-[10px] text-s3">EP {r.lastEpNum}</p>}
                      </div>
                    </Link>
                  ))}
                </>
              )}

              <div className="pt-3 border-t border-[var(--border)] mt-3">
                {user ? (
                  <button onClick={handleLogout}
                    className="flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-s3 text-sm font-medium hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 hover:translate-x-1">
                    <LogOut size={17} /> Logout
                  </button>
                ) : (
                  <Link href="/auth" onClick={close}
                    className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-s5 text-sm font-medium bg-s2 hover:bg-s2/80 transition-all duration-200">
                    <LogIn size={17} /> Sign In
                  </Link>
                )}
              </div>
            </nav>

            <div className="px-5 py-3 border-t border-[var(--border)]">
              <p className="text-[10px] text-s3 font-mono">AniVerse v2.0 · Enter the Multiverse</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
