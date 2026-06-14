import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ReadingProgress, MangaBookmark, MangaStatus } from '../lib/manga/types';

interface MangaState {
  // Reading Progress
  progress: Record<string, ReadingProgress>; // Key: mangaId
  updateProgress: (mangaId: string, progressData: Partial<ReadingProgress>) => void;
  getProgress: (mangaId: string) => ReadingProgress | null;
  getAllProgress: () => ReadingProgress[];
  removeProgress: (mangaId: string) => void;

  // Bookmarks / Library
  bookmarks: Record<string, MangaBookmark>; // Key: mangaId
  toggleBookmark: (manga: { id: string; title: string; coverArt?: string; status: MangaStatus }) => void;
  isBookmarked: (mangaId: string) => boolean;
  getAllBookmarks: () => MangaBookmark[];

  // Reader Settings
  settings: {
    mode: 'vertical' | 'horizontal' | 'webtoon';
    direction: 'ltr' | 'rtl';
    fit: 'width' | 'height' | 'contain';
    background: 'dark' | 'light' | 'oled';
    dataSaver: boolean;
  };
  updateSettings: (newSettings: Partial<MangaState['settings']>) => void;
}

export const useMangaStore = create<MangaState>()(
  persist(
    (set, get) => ({
      progress: {},
      bookmarks: {},
      settings: {
        mode: 'webtoon',
        direction: 'ltr',
        fit: 'width',
        background: 'dark',
        dataSaver: false,
      },

      updateProgress: (mangaId, data) => set((state) => {
        const existing = state.progress[mangaId] || {
          mangaId,
          mangaTitle: '',
          chapterId: '',
          chapterNum: '0',
          page: 1,
          totalPages: 1,
          lastRead: new Date().toISOString(),
        };
        return {
          progress: {
            ...state.progress,
            [mangaId]: {
              ...existing,
              ...data,
              lastRead: new Date().toISOString(),
            },
          },
        };
      }),

      getProgress: (mangaId) => get().progress[mangaId] || null,

      getAllProgress: () => {
        return Object.values(get().progress).sort((a, b) => 
          new Date(b.lastRead).getTime() - new Date(a.lastRead).getTime()
        );
      },

      removeProgress: (mangaId) => set((state) => {
        const next = { ...state.progress };
        delete next[mangaId];
        return { progress: next };
      }),

      toggleBookmark: (manga) => set((state) => {
        const next = { ...state.bookmarks };
        if (next[manga.id]) {
          delete next[manga.id];
        } else {
          next[manga.id] = {
            mangaId: manga.id,
            title: manga.title,
            coverArt: manga.coverArt,
            status: manga.status,
            addedAt: new Date().toISOString(),
          };
        }
        return { bookmarks: next };
      }),

      isBookmarked: (mangaId) => !!get().bookmarks[mangaId],

      getAllBookmarks: () => {
        return Object.values(get().bookmarks).sort((a, b) => 
          new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        );
      },

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),
    }),
    {
      name: 'mangaverse-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
