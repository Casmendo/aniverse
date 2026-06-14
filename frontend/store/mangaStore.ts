import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

      // ── Progress ────────────────────────────────────────────────────────────
      saveProgress: (p) => set(state => ({
        progress: { ...state.progress, [p.mangaId]: { ...p, lastRead: new Date().toISOString() } },
      })),

      getProgress: (mangaId) => get().progress[mangaId] || null,

      getAllProgress: () =>
        Object.values(get().progress).sort((a, b) =>
          new Date(b.lastRead).getTime() - new Date(a.lastRead).getTime()
        ),

      removeProgress: (mangaId) => set(state => {
        const next = { ...state.progress };
        delete next[mangaId];
        return { progress: next };
      }),

      // ── Bookmarks ───────────────────────────────────────────────────────────
      toggleBookmark: (m) => set(state => {
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
      }),

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
