import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAuthStore } from './authStore';
import { mangaWatchlistAPI, mangaHistoryAPI } from '../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReadingProgress {
  mangaId: string;
  mangaTitle: string;
  coverArt?: string;
  chapterId: string;
  chapterNum: string;
  page: number;
  totalPages: number;
  lastRead: string;
}

export interface MangaBookmark {
  mangaId: string;
  title: string;
  coverArt?: string;
  status: string;
  addedAt: string;
}

export interface ReaderSettings {
  mode: 'vertical' | 'horizontal' | 'webtoon';
  dataSaver: boolean;
  zoom?: number;
}

// ── Store Interface ───────────────────────────────────────────────────────────

interface MangaState {
  // Sync
  syncWithBackend: () => Promise<void>;

  // Reading Progress
  progress: Record<string, ReadingProgress>;
  saveProgress: (p: ReadingProgress) => void;
  getProgress: (mangaId: string) => ReadingProgress | null;
  getAllProgress: () => ReadingProgress[];
  removeProgress: (mangaId: string) => void;

  // Bookmarks
  bookmarks: Record<string, MangaBookmark>;
  toggleBookmark: (m: { id: string; title: string; coverArt?: string; status: string }) => void;
  isBookmarked: (mangaId: string) => boolean;
  getAllBookmarks: () => MangaBookmark[];

  // Reader Settings (persisted)
  readerSettings: ReaderSettings;
  saveReaderSettings: (s: Partial<ReaderSettings>) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useMangaStore = create<MangaState>()(
  persist(
    (set, get) => ({
      progress: {},
      bookmarks: {},
      readerSettings: { mode: 'webtoon', dataSaver: false, zoom: 1 },

      // ── Sync ────────────────────────────────────────────────────────────────
      syncWithBackend: async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;
        try {
          const wlRes = await mangaWatchlistAPI.getAll();
          const wlData = wlRes.data.bookmarks || [];
          const newBookmarks: Record<string, MangaBookmark> = {};
          for (const b of wlData) {
            newBookmarks[b.mangaId] = b;
          }

          const histRes = await mangaHistoryAPI.getAll();
          const histData = histRes.data.history || [];
          const newProgress: Record<string, ReadingProgress> = {};
          for (const h of histData) {
            newProgress[h.mangaId] = h;
          }

          set({ bookmarks: newBookmarks, progress: newProgress });
        } catch (err) {
          console.error('Failed to sync manga store with backend:', err);
        }
      },

      // ── Progress ────────────────────────────────────────────────────────────
      saveProgress: (p) => {
        const token = useAuthStore.getState().token;
        set(state => ({
          progress: { ...state.progress, [p.mangaId]: { ...p, lastRead: new Date().toISOString() } },
        }));
        if (token) {
          mangaHistoryAPI.update(p as any).catch(console.error);
        }
      },

      getProgress: (mangaId) => get().progress[mangaId] || null,

      getAllProgress: () =>
        Object.values(get().progress).sort((a, b) =>
          new Date(b.lastRead).getTime() - new Date(a.lastRead).getTime()
        ),

      removeProgress: (mangaId) => {
        const token = useAuthStore.getState().token;
        set(state => {
          const next = { ...state.progress };
          delete next[mangaId];
          return { progress: next };
        });
        if (token) {
          mangaHistoryAPI.remove(mangaId).catch(console.error);
        }
      },

      // ── Bookmarks ───────────────────────────────────────────────────────────
      toggleBookmark: (m) => {
        const token = useAuthStore.getState().token;
        set(state => {
          const next = { ...state.bookmarks };
          if (next[m.id]) {
            delete next[m.id];
          } else {
            next[m.id] = {
              mangaId: m.id,
              title: m.title,
              coverArt: m.coverArt,
              status: m.status,
              addedAt: new Date().toISOString(),
            };
          }
          return { bookmarks: next };
        });
        if (token) {
          mangaWatchlistAPI.toggle({ mangaId: m.id, title: m.title, coverArt: m.coverArt, status: m.status }).catch(console.error);
        }
      },

      isBookmarked: (mangaId) => !!get().bookmarks[mangaId],

      getAllBookmarks: () =>
        Object.values(get().bookmarks).sort((a, b) =>
          new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        ),

      // ── Reader Settings ─────────────────────────────────────────────────────
      saveReaderSettings: (s) => set(state => ({
        readerSettings: { ...state.readerSettings, ...s },
      })),
    }),
    {
      name: 'mangaverse-v2-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
