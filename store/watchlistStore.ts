/**
 * LOCAL WATCHLIST + CONTINUE WATCHING
 * Tracks every anime page visited and episode progress.
 * No backend endpoint needed.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

      toggleWatchlist: (item) => {
        const { watchlist } = get();
        const exists = watchlist.find(w => w.slug === item.slug);
        if (exists) {
          set({ watchlist: watchlist.filter(w => w.slug !== item.slug) });
          return false;
        } else {
          set({ watchlist: [{ ...item, addedAt: Date.now() }, ...watchlist] });
          return true;
        }
      },

      isInWatchlist: (slug) => {
        return get().watchlist.some(w => w.slug === slug);
      },

      trackVisit: (slug, title, cover) => {
        const { recentlyWatched } = get();
        const existing = recentlyWatched.find(r => r.slug === slug);
        if (!existing) {
          set({
            recentlyWatched: [
              { slug, title, cover, lastEpId: '', lastEpNum: 0, lastEpTitle: '', progress: 0, visitedAt: Date.now() },
              ...recentlyWatched.slice(0, 29),
            ],
          });
        } else {
          set({
            recentlyWatched: recentlyWatched.map(r =>
              r.slug === slug ? { ...r, visitedAt: Date.now() } : r
            ),
          });
        }
      },

      trackEpisode: (slug, title, cover, epId, epNum, epTitle, progress) => {
        const { recentlyWatched } = get();
        const entry: WatchedAnime = {
          slug, title, cover, lastEpId: epId, lastEpNum: epNum,
          lastEpTitle: epTitle, progress, visitedAt: Date.now(),
        };
        const without = recentlyWatched.filter(r => r.slug !== slug);
        set({ recentlyWatched: [entry, ...without.slice(0, 29)] });
      },

      getLastEp: (slug) => {
        return get().recentlyWatched.find(r => r.slug === slug) ?? null;
      },

      clearHistory: () => set({ recentlyWatched: [] }),

      removeFromHistory: (slug) => {
        set(state => ({
          recentlyWatched: state.recentlyWatched.filter(r => r.slug !== slug)
        }));
      },
    }),
    { name: 'aniverse-watchlist-v2' }
  )
);
