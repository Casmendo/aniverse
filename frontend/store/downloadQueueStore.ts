import { create } from 'zustand';

export interface DownloadQueueItem {
  id: string; // jobId
  title: string;
  progress: number;
}

interface DownloadQueueState {
  items: DownloadQueueItem[];
  addOrUpdateItem: (id: string, title: string, progress: number) => void;
  removeItem: (id: string) => void;
}

export const useDownloadQueueStore = create<DownloadQueueState>((set) => ({
  items: [],
  addOrUpdateItem: (id, title, progress) => set((state) => {
    const existing = state.items.find(i => i.id === id);
    if (existing) {
      return { items: state.items.map(i => i.id === id ? { ...i, progress } : i) };
    }
    return { items: [...state.items, { id, title, progress }] };
  }),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
}));
