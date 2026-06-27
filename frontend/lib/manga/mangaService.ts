// ── AniList Manga Service ──────────────────────────────────────────────────
// All manga data flows through here. Zero contact with lib/api.ts.

import anilistFetch from './anilistClient';
import { mangaCache } from './mangaCache';

// ── Shared fragments ─────────────────────────────────────────────────────────

const MEDIA_FIELDS = `
  id
  title { romaji english native }
  description(asHtml: false)
  coverImage { extraLarge large medium color }
  bannerImage
  genres
  tags { name category isAdult }
  status
  startDate { year month day }
  endDate { year month day }
  averageScore
  meanScore
  popularity
  favourites
  chapters
  volumes
  format
  source
  countryOfOrigin
  isAdult
  nextAiringEpisode { episode timeUntilAiring }
  relations {
    edges {
      relationType
      node { id title { romaji english } coverImage { large } }
    }
  }
  recommendations(sort: RATING_DESC, perPage: 6) {
    nodes {
      mediaRecommendation {
        id title { romaji english } coverImage { large } averageScore genres
      }
    }
  }
  characters(sort: [ROLE, RELEVANCE], perPage: 12) {
    edges {
      role
      node {
        id name { full } image { large }
      }
      voiceActors(language: JAPANESE) {
        id name { full } image { large }
      }
    }
  }
`;

const CARD_FIELDS = `
  id
  title { romaji english }
  coverImage { extraLarge large }
  genres
  status
  averageScore
  popularity
  chapters
  format
  startDate { year }
  isAdult
`;

// ── Types returned by this service ───────────────────────────────────────────

export interface AniMangaCard {
  id: number;
  title: string;
  coverImage: string;
  genres: string[];
  status: string;
  score: number;
  popularity: number;
  chapters: number | null;
  format: string;
  year: number | null;
  isAdult: boolean;
}

export interface AniMangaDetail extends AniMangaCard {
  titleNative: string;
  description: string;
  bannerImage: string | null;
  volumes: number | null;
  averageScore: number;
  meanScore: number;
  favourites: number;
  tags: { name: string; category: string }[];
  startDate: string;
  source: string;
  countryOfOrigin: string;
  relations: { type: string; id: number; title: string; cover: string }[];
  recommendations: { id: number; title: string; cover: string; score: number; genres: string[] }[];
  characters: {
    role: string;
    character: { id: number; name: string; image: string };
    voiceActors: { id: number; name: string; image: string }[];
  }[];
}

// ── Normalizers ──────────────────────────────────────────────────────────────

function toTitle(t: { romaji?: string; english?: string; native?: string }): string {
  return t.english || t.romaji || t.native || 'Unknown';
}

function normaliseCard(m: any): AniMangaCard {
  return {
    id: m.id,
    title: toTitle(m.title),
    coverImage: m.coverImage?.extraLarge || m.coverImage?.large || '',
    genres: m.genres || [],
    status: m.status || 'UNKNOWN',
    score: m.averageScore || 0,
    popularity: m.popularity || 0,
    chapters: m.chapters || null,
    format: m.format || 'MANGA',
    year: m.startDate?.year || null,
    isAdult: m.isAdult || false,
  };
}

function normaliseDetail(m: any): AniMangaDetail {
  const card = normaliseCard(m);
  return {
    ...card,
    titleNative: m.title?.native || '',
    description: m.description || '',
    bannerImage: m.bannerImage || null,
    volumes: m.volumes || null,
    averageScore: m.averageScore || 0,
    meanScore: m.meanScore || 0,
    favourites: m.favourites || 0,
    tags: (m.tags || []).filter((t: any) => !t.isAdult).map((t: any) => ({ name: t.name, category: t.category })),
    startDate: m.startDate ? `${m.startDate.year || ''}` : '',
    source: m.source || '',
    countryOfOrigin: m.countryOfOrigin || '',
    relations: (m.relations?.edges || []).map((e: any) => ({
      type: e.relationType,
      id: e.node?.id,
      title: toTitle(e.node?.title || {}),
      cover: e.node?.coverImage?.large || '',
    })),
    recommendations: (m.recommendations?.nodes || [])
      .filter((n: any) => n?.mediaRecommendation)
      .map((n: any) => ({
        id: n.mediaRecommendation.id,
        title: toTitle(n.mediaRecommendation.title || {}),
        cover: n.mediaRecommendation.coverImage?.large || '',
        score: n.mediaRecommendation.averageScore || 0,
        genres: n.mediaRecommendation.genres || [],
      })),
    characters: (m.characters?.edges || []).map((e: any) => ({
      role: e.role,
      character: {
        id: e.node?.id,
        name: e.node?.name?.full || '',
        image: e.node?.image?.large || '',
      },
      voiceActors: (e.voiceActors || []).map((va: any) => ({
        id: va.id,
        name: va.name?.full || '',
        image: va.image?.large || '',
      })),
    })),
  };
}

// ── Service Methods ──────────────────────────────────────────────────────────

export const mangaService = {

  async getTrending(page = 1, perPage = 20): Promise<AniMangaCard[]> {
    return mangaCache.wrap(`trending:${page}:${perPage}`, async () => {
      const data = await anilistFetch<any>(`
        query($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            media(type: MANGA, sort: TRENDING_DESC, isAdult: false) { ${CARD_FIELDS} }
          }
        }
      `, { page, perPage });
      return (data?.Page?.media || []).map(normaliseCard);
    });
  },

  async getPopular(page = 1, perPage = 20): Promise<AniMangaCard[]> {
    return mangaCache.wrap(`popular:${page}:${perPage}`, async () => {
      const data = await anilistFetch<any>(`
        query($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            media(type: MANGA, sort: POPULARITY_DESC, isAdult: false) { ${CARD_FIELDS} }
          }
        }
      `, { page, perPage });
      return (data?.Page?.media || []).map(normaliseCard);
    });
  },

  async getTopRated(page = 1, perPage = 20): Promise<AniMangaCard[]> {
    return mangaCache.wrap(`toprated:${page}:${perPage}`, async () => {
      const data = await anilistFetch<any>(`
        query($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            media(type: MANGA, sort: SCORE_DESC, isAdult: false) { ${CARD_FIELDS} }
          }
        }
      `, { page, perPage });
      return (data?.Page?.media || []).map(normaliseCard);
    });
  },

  async getNewReleases(page = 1, perPage = 20): Promise<AniMangaCard[]> {
    return mangaCache.wrap(`newreleases:${page}:${perPage}`, async () => {
      const data = await anilistFetch<any>(`
        query($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            media(type: MANGA, sort: START_DATE_DESC, isAdult: false, status: RELEASING) { ${CARD_FIELDS} }
          }
        }
      `, { page, perPage });
      return (data?.Page?.media || []).map(normaliseCard);
    });
  },

  async search(
    query: string,
    options: { genres?: string[]; status?: string; year?: number; page?: number; perPage?: number; sort?: string } = {}
  ): Promise<AniMangaCard[]> {
    const key = `search:${query}:${JSON.stringify(options)}`;
    return mangaCache.wrap(key, async () => {
      const data = await anilistFetch<any>(`
        query($search: String, $genre_in: [String], $status: MediaStatus, $seasonYear: Int, $page: Int, $perPage: Int, $sort: [MediaSort]) {
          Page(page: $page, perPage: $perPage) {
            media(type: MANGA, search: $search, genre_in: $genre_in, status: $status, startDate_like: $seasonYear, sort: $sort, isAdult: false) {
              ${CARD_FIELDS}
            }
          }
        }
      `, {
        search: query || undefined,
        genre_in: options.genres?.length ? options.genres : undefined,
        status: options.status || undefined,
        seasonYear: options.year || undefined,
        page: options.page || 1,
        perPage: options.perPage || 24,
        sort: options.sort ? [options.sort] : ['TRENDING_DESC'],
      }, { ttlMs: 2 * 60 * 1000 } as any);
      return (data?.Page?.media || []).map(normaliseCard);
    }, 2 * 60 * 1000);
  },

  async getByGenre(genre: string, page = 1, perPage = 20): Promise<AniMangaCard[]> {
    return mangaCache.wrap(`genre:${genre}:${page}`, async () => {
      const data = await anilistFetch<any>(`
        query($genre: String, $page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            media(type: MANGA, genre: $genre, sort: POPULARITY_DESC, isAdult: false) { ${CARD_FIELDS} }
          }
        }
      `, { genre, page, perPage });
      return (data?.Page?.media || []).map(normaliseCard);
    });
  },

  async getDetail(id: number): Promise<AniMangaDetail> {
    return mangaCache.wrap(`detail:${id}`, async () => {
      const data = await anilistFetch<any>(`
        query($id: Int) {
          Media(id: $id, type: MANGA) { ${MEDIA_FIELDS} }
        }
      `, { id }, 10 * 60 * 1000 as any);
      return normaliseDetail(data?.Media);
    }, 10 * 60 * 1000);
  },
};
