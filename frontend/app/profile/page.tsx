'use client';
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Camera, Pencil, Check, X, LogOut, Smartphone, RefreshCw,
  Download, ChevronRight, Play, History, Trash2, User, Shield,
  ArrowDownToLine
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useWatchlistStore } from '@/store/watchlistStore';
import { useToast } from '@/components/Toast';
import { authAPI } from '@/lib/api';

const APP_VERSION = '1.0.0';

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const { user, logout, update, updateAvatar } = useAuthStore();
  const { recentlyWatched, clearHistory, removeFromHistory } = useWatchlistStore();

  const [editName, setEditName]   = useState(false);
  const [newName,  setNewName]    = useState(user?.username || '');
  const [savingName, setSavingName] = useState(false);

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo]         = useState<null | {
    has_update: boolean; latest_version: string;
    download_url: string; release_notes: string;
  }>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Avatar ────────────────────────────────────────────────────────────────
  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast('Image must be < 2 MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      updateAvatar(dataUrl);
      // Best-effort sync to backend (non-blocking)
      authAPI.updateAvatar(dataUrl).catch(() => {});
      toast('Profile picture updated!', 'success');
    };
    reader.readAsDataURL(file);
  }, [updateAvatar, toast]);

  // ── Username ──────────────────────────────────────────────────────────────
  const saveUsername = async () => {
    if (newName.trim().length < 3) { toast('At least 3 characters', 'error'); return; }
    setSavingName(true);
    try {
      await authAPI.updateUsername(newName.trim());
      update(newName.trim());
      setEditName(false);
      toast('Username updated!', 'success');
    } catch {
      // Backend might be offline — update locally anyway
      update(newName.trim());
      setEditName(false);
      toast('Username saved locally', 'info');
    } finally { setSavingName(false); }
  };

  // ── Check for Updates ─────────────────────────────────────────────────────
  const checkForUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateInfo(null);
    try {
      const { data } = await authAPI.checkForUpdate(APP_VERSION);
      setUpdateInfo(data);
      if (data.has_update) {
        toast(`Update ${data.latest_version} available!`, 'success');
      } else {
        toast('You are on the latest version!', 'info');
      }
    } catch {
      toast('Could not check for updates', 'error');
    } finally { setCheckingUpdate(false); }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    toast('Logged out', 'info');
    router.replace('/auth');
  };

  if (!user) return null;

  const avatarSrc = user.avatarUrl || null;
  const initials = user.username?.[0]?.toUpperCase() || '?';

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">

      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden mb-6"
        style={{ background: 'linear-gradient(135deg, rgba(37,55,69,0.8) 0%, rgba(6,20,27,0.95) 100%)', border: '1px solid var(--border)' }}>
        {/* BG glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%,rgba(83,198,193,0.08) 0%,transparent 70%)' }} />

        <div className="relative flex flex-col items-center pt-8 pb-6 px-6 gap-3">
          {/* Avatar */}
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-s5/40 shadow-lg">
              {avatarSrc
                ? <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center bg-s2 font-display font-black text-3xl text-s5">{initials}</div>
              }
            </div>
            <div className="absolute inset-0 rounded-full bg-s0/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={22} className="text-s5" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

          {/* Username */}
          <div className="flex items-center gap-2">
            {editName ? (
              <div className="flex items-center gap-2">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveUsername(); if (e.key === 'Escape') setEditName(false); }}
                  className="bg-s1 border border-s5/40 rounded-xl px-4 py-2 text-s5 font-bold text-lg text-center outline-none w-44"
                  autoFocus
                />
                <button onClick={saveUsername} disabled={savingName}
                  className="w-9 h-9 rounded-xl bg-s5 text-s0 flex items-center justify-center hover:bg-s4 transition-colors disabled:opacity-50">
                  {savingName ? <div className="w-4 h-4 border-2 border-s0 border-t-transparent rounded-full animate-spin" />
                    : <Check size={16} />}
                </button>
                <button onClick={() => setEditName(false)}
                  className="w-9 h-9 rounded-xl bg-s2 text-s4 flex items-center justify-center hover:bg-s1 transition-colors">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <h1 className="font-display font-black text-2xl text-s5">{user.username}</h1>
                <button onClick={() => { setNewName(user.username); setEditName(true); }}
                  className="text-s3 hover:text-s5 transition-colors">
                  <Pencil size={15} />
                </button>
              </>
            )}
          </div>

          <p className="text-s3 text-xs font-mono">{user.email}</p>
        </div>
      </div>

      {/* ── Continue Watching ────────────────────────────────────────────── */}
      {recentlyWatched.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-base text-s5 flex items-center gap-2">
              <History size={16} className="text-s5" />
              Continue Watching
            </h2>
            <button onClick={clearHistory} className="text-xs text-s3 hover:text-red-400 transition-colors flex items-center gap-1">
              <Trash2 size={11} />
              Clear all
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {recentlyWatched.slice(0, 10).map(r => (
              <div key={r.slug} className="shrink-0 w-28 group relative">
                <Link href={r.lastEpId
                  ? `/watch/${r.slug}/${r.lastEpId}?title=${encodeURIComponent(r.title)}&ep=${r.lastEpNum}`
                  : `/anime/${r.slug}?title=${encodeURIComponent(r.title)}`}>
                  <div className="w-28 h-40 rounded-xl overflow-hidden bg-s2 border border-[var(--border)] group-hover:border-s5/60 transition-all relative mb-2">
                    {r.cover
                      ? <img src={r.cover} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${r.slug}/200/300`; }} />
                      : <div className="w-full h-full flex items-center justify-center"><Play size={20} className="text-s3" /></div>}
                    {/* Progress bar */}
                    {r.progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-s0/60">
                        <div className="h-full bg-s5 rounded-full" style={{ width: `${Math.min(100, r.progress)}%` }} />
                      </div>
                    )}
                    {r.lastEpNum > 0 && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-s5/90 text-s0">EP {r.lastEpNum}</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-s4 group-hover:text-s5 transition-colors line-clamp-2 leading-tight">{r.title}</p>
                </Link>
                <button onClick={() => removeFromHistory(r.slug)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-s0/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80">
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div className="space-y-3 mb-6">

        {/* Check for Updates */}
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden" style={{ background: 'var(--glass)' }}>
          <button onClick={checkForUpdate} disabled={checkingUpdate}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-s1/50 transition-colors disabled:opacity-70">
            <div className="w-10 h-10 rounded-xl bg-s2 flex items-center justify-center">
              <Smartphone size={18} className="text-s4" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-s5">Check for Updates</p>
              <p className="text-xs text-s3">Current: v{APP_VERSION}</p>
            </div>
            {checkingUpdate
              ? <div className="w-4 h-4 border-2 border-s3 border-t-s5 rounded-full animate-spin" />
              : <RefreshCw size={16} className="text-s3" />}
          </button>

          {/* Update result */}
          <AnimatePresence>
            {updateInfo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-[var(--border)]">
                <div className="px-5 py-4">
                  {updateInfo.has_update ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <p className="text-sm font-bold text-emerald-400">Update v{updateInfo.latest_version} available!</p>
                      </div>
                      <p className="text-xs text-s3 leading-relaxed">{updateInfo.release_notes}</p>
                      {updateInfo.download_url && (
                        <a href={updateInfo.download_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-s5 text-s0 font-bold text-sm hover:bg-s4 transition-colors">
                          <ArrowDownToLine size={14} />
                          Download APK
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-s4" />
                      <p className="text-sm text-s4">You are up to date — v{updateInfo.latest_version}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Get App */}
        <Link href="/apk"
          className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-[var(--border)] hover:bg-s1/50 transition-colors"
          style={{ background: 'var(--glass)' }}>
          <div className="w-10 h-10 rounded-xl bg-s2 flex items-center justify-center">
            <Download size={18} className="text-s4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-s5">Get the App</p>
            <p className="text-xs text-s3">Download AniVerse APK</p>
          </div>
          <ChevronRight size={16} className="text-s3" />
        </Link>

        {/* My Watchlist */}
        <Link href="/watchlist"
          className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-[var(--border)] hover:bg-s1/50 transition-colors"
          style={{ background: 'var(--glass)' }}>
          <div className="w-10 h-10 rounded-xl bg-s2 flex items-center justify-center">
            <Shield size={18} className="text-s4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-s5">My Watchlist</p>
            <p className="text-xs text-s3">Manage your saved anime</p>
          </div>
          <ChevronRight size={16} className="text-s3" />
        </Link>

        {/* Downloads */}
        <Link href="/downloads"
          className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-[var(--border)] hover:bg-s1/50 transition-colors"
          style={{ background: 'var(--glass)' }}>
          <div className="w-10 h-10 rounded-xl bg-s2 flex items-center justify-center">
            <Download size={18} className="text-s4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-s5">Downloads</p>
            <p className="text-xs text-s3">View your saved episodes</p>
          </div>
          <ChevronRight size={16} className="text-s3" />
        </Link>
      </div>

      {/* ── Logout ──────────────────────────────────────────────────────── */}
      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors text-red-400 font-semibold text-sm">
        <LogOut size={16} />
        Sign Out
      </button>

      <p className="text-center text-s2 text-[10px] font-mono mt-6 uppercase tracking-widest">
        AniVerse v{APP_VERSION} · Built with ❤ by Leo
      </p>
    </div>
  );
}
