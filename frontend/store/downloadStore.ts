import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { downloadAPI } from '@/lib/api';

export interface DownloadEpisode {
  id?:           number;
  episode_num:   number;
  episode_id:    string;
  episode_title: string;
  saved_at?:     string;
  localPath?:    string; // native device file path for offline playback
}

export interface DownloadGroup {
  anime_slug:  string;
  anime_title: string;
  anime_cover: string;
  episodes:    DownloadEpisode[];
}

interface DownloadState {
  groups:   DownloadGroup[];
  loading:  boolean;
  fetch:    (isLoggedIn: boolean) => Promise<void>;
  add:      (params: {
    anime_slug: string; anime_title: string; anime_cover: string;
    episode_num: number; episode_id: string; episode_title: string;
    localPath?: string;
  }, isLoggedIn: boolean) => Promise<{ success: boolean; duplicate: boolean }>;
  remove:   (slug: string, epId: number | undefined, isLoggedIn: boolean) => Promise<void>;
  removeAnime: (slug: string, isLoggedIn: boolean) => Promise<void>;
}

// Merge server groups with any that might be local-only
function mergeGroups(server: DownloadGroup[], local: DownloadGroup[]): DownloadGroup[] {
  const map = new Map<string, DownloadGroup>();
  [...local, ...server].forEach((g) => {
    if (map.has(g.anime_slug)) {
      const existing = map.get(g.anime_slug)!;
      const allEps   = [...existing.episodes, ...g.episodes];
      const unique   = allEps.filter(
        (ep, i, arr) => arr.findIndex((e) => e.episode_num === ep.episode_num) === i
      );
      map.set(g.anime_slug, { ...g, episodes: unique });
    } else {
      map.set(g.anime_slug, g);
    }
  });
  return Array.from(map.values());
}

export const useDownloadStore = create<DownloadState>()(
  persist(
    (set, get) => ({
      groups:  [],
      loading: false,

      fetch: async (isLoggedIn = false) => {
        set({ loading: true });
        try {
          if (!isLoggedIn) return;
          const { data } = await downloadAPI.getAll();
          const serverGroups: DownloadGroup[] = data.downloads || [];
          const localGroups  = get().groups;
          set({ groups: mergeGroups(serverGroups, localGroups) });
        } catch {
          // server unavailable – keep local
        } finally {
          set({ loading: false });
        }
      },

      add: async (params, isLoggedIn) => {
        // duplicate check
        const existing = get().groups.find((g) => g.anime_slug === params.anime_slug);
        if (existing?.episodes.find((e) => e.episode_num === params.episode_num)) {
          return { success: false, duplicate: true };
        }

        if (isLoggedIn) {
          try {
            await downloadAPI.add(params);
            await get().fetch(true);
            return { success: true, duplicate: false };
          } catch (e: any) {
            if (e?.message?.includes('already')) return { success: false, duplicate: true };
          }
        }

        // Local fallback
        set((state) => {
          const groups = [...state.groups];
          const idx    = groups.findIndex((g) => g.anime_slug === params.anime_slug);
          const newEp: DownloadEpisode = {
            episode_num:   params.episode_num,
            episode_id:    params.episode_id,
            episode_title: params.episode_title,
            localPath:     params.localPath,
          };
          if (idx >= 0) {
            groups[idx] = { ...groups[idx], episodes: [...groups[idx].episodes, newEp] };
          } else {
            groups.push({
              anime_slug:  params.anime_slug,
              anime_title: params.anime_title,
              anime_cover: params.anime_cover,
              episodes:    [newEp],
            });
          }
          return { groups };
        });
        return { success: true, duplicate: false };
      },

      remove: async (slug, epId, isLoggedIn) => {
        if (isLoggedIn && epId !== undefined) {
          try { await downloadAPI.remove(epId); } catch {}
        }
        set((state) => ({
          groups: state.groups
            .map((g) =>
              g.anime_slug === slug
                ? { ...g, episodes: g.episodes.filter((e) => e.id !== epId) }
                : g
            )
            .filter((g) => g.episodes.length > 0),
        }));
      },

      removeAnime: async (slug, isLoggedIn) => {
        if (isLoggedIn) {
          try { await downloadAPI.removeAnime(slug); } catch {}
        }
        set((state) => ({ groups: state.groups.filter((g) => g.anime_slug !== slug) }));
      },
    }),
    { name: 'aniverse-downloads' }
  )
);
