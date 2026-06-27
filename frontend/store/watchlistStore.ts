/**
 * LOCAL + SERVER WATCHLIST + CONTINUE WATCHING
 * Tracks every anime page visited and episode progress.
 * Mirrors progress server-side if authenticated.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';
import { watchlistAPI, historyAPI } from '../lib/api';

export interface WatchedAnime {
  slug:       string;
  title:      string;
  cover:      string;
  lastEpId:   string;
  lastEpNum:  number;
  lastEpTitle:string;
  progress:   number; // 0-100
  visitedAt:  number; // timestamp
}

export interface WatchlistItem {
  slug:     string;
  title:    string;
  cover:    string;
  addedAt:  number;
}

interface WatchlistState {
  watchlist:   WatchlistItem[];
  recentlyWatched: WatchedAnime[];

  // Syncing
  syncWithBackend: () => Promise<void>;

  // Watchlist
  toggleWatchlist: (item: Omit<WatchlistItem, 'addedAt'>) => boolean; // returns new in_watchlist
  isInWatchlist:   (slug: string) => boolean;

  // Track watching
  trackVisit:   (slug: string, title: string, cover: string) => void;
  trackEpisode: (slug: string, title: string, cover: string, epId: string, epNum: number, epTitle: string, progress: number) => void;
  getLastEp:    (slug: string) => WatchedAnime | null;
  clearHistory: () => void;
  removeFromHistory: (slug: string) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watchlist:        [],
      recentlyWatched:  [],

      syncWithBackend: async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;
        try {
          // 1. Fetch watchlist from backend
          const wlRes = await watchlistAPI.getAll();
          const wl = wlRes.data.watchlist.map((w: any) => ({
            slug: w.anime_slug,
            title: w.anime_title || '',
            cover: w.anime_cover || '',
            addedAt: w.added_at ? new Date(w.added_at).getTime() : Date.now(),
          }));

          // 2. Fetch history from backend
          const histRes = await historyAPI.getAll();
          const hist = histRes.data.history.map((h: any) => ({
            slug: h.slug,
            title: h.title || '',
            cover: h.cover || '',
            lastEpId: h.lastEpId || '',
            lastEpNum: h.lastEpNum || 0,
            lastEpTitle: h.lastEpTitle || '',
            progress: h.progress || 0,
            visitedAt: h.updated_at ? new Date(h.updated_at).getTime() : Date.now(),
          }));

          set({ watchlist: wl, recentlyWatched: hist });
        } catch (err) {
          console.error('Failed to sync watchlist/history with backend:', err);
        }
      },

      toggleWatchlist: (item) => {
        const { watchlist } = get();
        const token = useAuthStore.getState().token;
        const exists = watchlist.find(w => w.slug === item.slug);
        
        if (exists) {
          set({ watchlist: watchlist.filter(w => w.slug !== item.slug) });
          if (token) {
            watchlistAPI.toggle({ anime_slug: item.slug }).catch(console.error);
          }
          return false;
        } else {
          set({ watchlist: [{ ...item, addedAt: Date.now() }, ...watchlist] });
          if (token) {
            watchlistAPI.toggle({ anime_slug: item.slug, anime_title: item.title, anime_cover: item.cover }).catch(console.error);
          }
          return true;
        }
      },

      isInWatchlist: (slug) => {
        return get().watchlist.some(w => w.slug === slug);
      },

      trackVisit: (slug, title, cover) => {
        const { recentlyWatched } = get();
        const token = useAuthStore.getState().token;
        const existing = recentlyWatched.find(r => r.slug === slug);
        
        if (!existing) {
          const entry = { slug, title, cover, lastEpId: '', lastEpNum: 0, lastEpTitle: '', progress: 0, visitedAt: Date.now() };
          set({
            recentlyWatched: [entry, ...recentlyWatched.slice(0, 29)],
          });
          if (token) {
            historyAPI.update({ slug, title, cover }).catch(console.error);
          }
        } else {
          set({
            recentlyWatched: recentlyWatched.map(r =>
              r.slug === slug ? { ...r, visitedAt: Date.now() } : r
            ),
          });
          if (token) {
            historyAPI.update({ slug, title, cover }).catch(console.error);
          }
        }
      },

      trackEpisode: (slug, title, cover, epId, epNum, epTitle, progress) => {
        const { recentlyWatched } = get();
        const token = useAuthStore.getState().token;
        const entry: WatchedAnime = {
          slug, title, cover, lastEpId: epId, lastEpNum: epNum,
          lastEpTitle: epTitle, progress, visitedAt: Date.now(),
        };
        const without = recentlyWatched.filter(r => r.slug !== slug);
        set({ recentlyWatched: [entry, ...without.slice(0, 29)] });

        if (token) {
          historyAPI.update({
            slug,
            title,
            cover,
            lastEpId: epId,
            lastEpNum: epNum,
            lastEpTitle: epTitle,
            progress
          }).catch(console.error);
        }
      },

      getLastEp: (slug) => {
        return get().recentlyWatched.find(r => r.slug === slug) ?? null;
      },

      clearHistory: () => {
        const token = useAuthStore.getState().token;
        set({ recentlyWatched: [] });
        if (token) {
          historyAPI.remove('clear').catch(console.error);
        }
      },

      removeFromHistory: (slug) => {
        const token = useAuthStore.getState().token;
        set(state => ({
          recentlyWatched: state.recentlyWatched.filter(r => r.slug !== slug)
        }));
        if (token) {
          historyAPI.remove(slug).catch(console.error);
        }
      },
    }),
    { name: 'aniverse-watchlist-v3' }
  )
);
