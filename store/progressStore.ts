import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProgressEntry {
  currentTime: number;
  duration:    number;
  episodeId:   string;
  updatedAt:   number;
}

interface ProgressState {
  progress: Record<string, ProgressEntry>;  // key: `${slug}-${episodeId}`
  setProgress: (slug: string, episodeId: string, currentTime: number, duration: number) => void;
  getProgress: (slug: string, episodeId: string) => ProgressEntry | null;
  clearProgress: (slug: string, episodeId: string) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: {},

      setProgress: (slug, episodeId, currentTime, duration) => {
        const key = `${slug}-${episodeId}`;
        set((state) => ({
          progress: {
            ...state.progress,
            [key]: { currentTime, duration, episodeId, updatedAt: Date.now() },
          },
        }));
      },

      getProgress: (slug, episodeId) => {
        const key = `${slug}-${episodeId}`;
        return get().progress[key] ?? null;
      },

      clearProgress: (slug, episodeId) => {
        const key = `${slug}-${episodeId}`;
        set((state) => {
          const next = { ...state.progress };
          delete next[key];
          return { progress: next };
        });
      },
    }),
    { name: 'aniverse-progress' }
  )
);
