// ── Unified Manga Types ────────────────────────────────────────────────────
// Single source of truth — combines AniList metadata + MangaDex chapters.

import type { MDXChapter } from './mangaDexClient';

export interface MangaCharacter {
  id: number;
  name: string;
  image: string;
  role: 'MAIN' | 'SUPPORTING' | 'BACKGROUND';
  voiceActor?: {
    id: number;
    name: string;
    image: string;
    language: string;
  };
}

export interface MangaRecommendation {
  id: number;
  title: string;
  coverImage: string;
  score: number;
  genres: string[];
  status: string;
}

export interface MangaRelation {
  id: number;
  title: string;
  coverImage: string;
  type: string;  // SEQUEL, PREQUEL, SIDE_STORY, etc.
}

export interface MangaTag {
  name: string;
  category: string;
}

/** Fully unified object — every consumer uses this */
export interface UnifiedManga {
  // ── Identity ─────────────────────────────────────────
  anilistId: number;
  mangaDexId: string | null;   // Set after cross-reference
  mangaPillId: string | null;  // MangaPill fallback (Consumet)
  title: string;
  titleNative: string;
  titleRomaji: string;

  // ── Visuals ───────────────────────────────────────────
  coverImage: string;
  bannerImage: string | null;
  color: string | null;

  // ── Metadata ──────────────────────────────────────────
  description: string;
  genres: string[];
  tags: MangaTag[];
  status: MangaStatusType;
  format: string;
  releaseYear: number | null;
  volumes: number | null;
  totalChapters: number | null;
  countryOfOrigin: string;
  source: string;
  externalLinks?: { site: string; url: string }[];

  // ── Ratings ───────────────────────────────────────────
  rating: number;        // 0–100
  meanScore: number;
  popularity: number;
  favourites: number;

  // ── Relations ─────────────────────────────────────────
  characters: MangaCharacter[];
  recommendations: MangaRecommendation[];
  relations: MangaRelation[];

  // ── MangaDex Chapters (populated lazily) ─────────────
  availableChapters: MDXChapter[];
  lastFetchedChapters: number | null;  // timestamp
}

export type MangaStatusType =
  | 'RELEASING'
  | 'FINISHED'
  | 'NOT_YET_RELEASED'
  | 'CANCELLED'
  | 'HIATUS'
  | 'UNKNOWN';

export const STATUS_LABELS: Record<MangaStatusType, string> = {
  RELEASING: 'Ongoing',
  FINISHED: 'Completed',
  NOT_YET_RELEASED: 'Upcoming',
  CANCELLED: 'Cancelled',
  HIATUS: 'On Hiatus',
  UNKNOWN: 'Unknown',
};

export const STATUS_COLORS: Record<MangaStatusType, string> = {
  RELEASING: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  FINISHED: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  NOT_YET_RELEASED: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  CANCELLED: 'text-red-400 bg-red-500/10 border-red-500/20',
  HIATUS: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  UNKNOWN: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

/** Lightweight card version for lists/grids */
export interface MangaCard {
  anilistId: number;
  title: string;
  coverImage: string;
  genres: string[];
  status: MangaStatusType;
  rating: number;
  popularity: number;
  totalChapters: number | null;
  format: string;
  releaseYear: number | null;
}
