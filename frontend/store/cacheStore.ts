import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CacheState {
  airing: any[];
  popular: any[];
  latestReleases: any[];
  mostWatched: any[];
  setAiring: (data: any[]) => void;
  setPopular: (data: any[]) => void;
  setLatestReleases: (data: any[]) => void;
  setMostWatched: (data: any[]) => void;
}

export const useCacheStore = create<CacheState>()(
  persist(
    (set) => ({
      airing: [],
      popular: [],
      latestReleases: [],
      mostWatched: [],
      setAiring: (data) => set({ airing: data }),
      setPopular: (data) => set({ popular: data }),
      setLatestReleases: (data) => set({ latestReleases: data }),
      setMostWatched: (data) => set({ mostWatched: data }),
    }),
    { name: 'aniverse-api-cache' }
  )
);
