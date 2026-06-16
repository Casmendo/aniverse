// ── Unified Manga Service ─────────────────────────────────────────────────
// Merges AniList (metadata) + MangaDex (chapters) transparently.
// Consumers never need to know two APIs are involved.

import anilistFetch from './anilistClient';
import { mangaDexClient } from './mangaDexClient';
import { mangaPillClient } from './mangaPillClient';
import { mangaCache } from './mangaCache';
import type { UnifiedManga, MangaCard, MangaCharacter, MangaRecommendation, MangaRelation, MangaStatusType } from './unifiedTypes';

// ── GraphQL Fragments ─────────────────────────────────────────────────────

const CARD_QUERY = `
  query($page: Int, $perPage: Int, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      media(type: MANGA, sort: $sort, isAdult: false, countryOfOrigin: "JP") {
        id
        title { romaji english }
        coverImage { extraLarge large color }
        genres
        status
        averageScore
        popularity
        chapters
        format
        startDate { year }
      }
    }
  }
`;

const SEARCH_QUERY = `
  query($search: String, $genre_in: [String], $status: MediaStatus, $page: Int, $perPage: Int, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      media(type: MANGA, search: $search, genre_in: $genre_in, status: $status, sort: $sort, isAdult: false) {
        id
        title { romaji english }
        coverImage { extraLarge large color }
        genres
        status
        averageScore
        popularity
        chapters
        format
        startDate { year }
      }
    }
  }
`;

const DETAIL_QUERY = `
  query($id: Int) {
    Media(id: $id, type: MANGA) {
      id
      title { romaji english native }
      description(asHtml: false)
      coverImage { extraLarge large color }
      bannerImage
      genres
      tags { name category isAdult }
      status
      format
      source
      countryOfOrigin
      startDate { year }
      averageScore
      meanScore
      popularity
      favourites
      chapters
      volumes
      relations {
        edges {
          relationType
          node {
            id
            title { romaji english }
            coverImage { large }
            type
          }
        }
      }
      recommendations(sort: RATING_DESC, perPage: 10) {
        nodes {
          mediaRecommendation {
            id
            title { romaji english }
            coverImage { large }
            averageScore
            genres
            status
          }
        }
      }
      characters(sort: [ROLE, RELEVANCE], perPage: 16) {
        edges {
          role
          node { id name { full } image { large } }
          voiceActors(language: JAPANESE) {
            id name { full } image { large }
          }
        }
      }
      externalLinks { site url }
    }
  }
`;

// ── Normalizers ───────────────────────────────────────────────────────────

function toTitle(t: any): string {
  return t?.english || t?.romaji || t?.native || 'Unknown';
}

function normaliseCard(m: any): MangaCard {
  return {
    anilistId: m.id,
    title: toTitle(m.title),
    coverImage: m.coverImage?.extraLarge || m.coverImage?.large || '',
    genres: m.genres || [],
    status: (m.status || 'UNKNOWN') as MangaStatusType,
    rating: m.averageScore || 0,
    popularity: m.popularity || 0,
    totalChapters: m.chapters || null,
    format: m.format || 'MANGA',
    releaseYear: m.startDate?.year || null,
  };
}

function normaliseDetail(m: any): Omit<UnifiedManga, 'mangaDexId' | 'availableChapters' | 'lastFetchedChapters'> {
  const characters: MangaCharacter[] = (m.characters?.edges || []).map((e: any) => ({
    id: e.node?.id,
    name: e.node?.name?.full || '',
    image: e.node?.image?.large || '',
    role: e.role || 'SUPPORTING',
    voiceActor: e.voiceActors?.[0] ? {
      id: e.voiceActors[0].id,
      name: e.voiceActors[0].name?.full || '',
      image: e.voiceActors[0].image?.large || '',
      language: 'JAPANESE',
    } : undefined,
  }));

  const recommendations: MangaRecommendation[] = (m.recommendations?.nodes || [])
    .filter((n: any) => n?.mediaRecommendation)
    .map((n: any) => ({
      id: n.mediaRecommendation.id,
      title: toTitle(n.mediaRecommendation.title),
      coverImage: n.mediaRecommendation.coverImage?.large || '',
      score: n.mediaRecommendation.averageScore || 0,
      genres: n.mediaRecommendation.genres || [],
      status: n.mediaRecommendation.status || 'UNKNOWN',
    }));

  const relations: MangaRelation[] = (m.relations?.edges || [])
    .filter((e: any) => e?.node?.type === 'MANGA')
    .map((e: any) => ({
      id: e.node.id,
      title: toTitle(e.node.title),
      coverImage: e.node.coverImage?.large || '',
      type: e.relationType,
    }));

  return {
    anilistId: m.id,
    mangaPillId: null,   // resolved later in getDetail
    title: toTitle(m.title),
    titleNative: m.title?.native || '',
    titleRomaji: m.title?.romaji || '',
    coverImage: m.coverImage?.extraLarge || m.coverImage?.large || '',
    bannerImage: m.bannerImage || null,
    color: m.coverImage?.color || null,
    description: m.description || '',
    genres: m.genres || [],
    tags: (m.tags || []).filter((t: any) => !t.isAdult).map((t: any) => ({ name: t.name, category: t.category })),
    status: (m.status || 'UNKNOWN') as MangaStatusType,
    format: m.format || 'MANGA',
    releaseYear: m.startDate?.year || null,
    volumes: m.volumes || null,
    totalChapters: m.chapters || null,
    countryOfOrigin: m.countryOfOrigin || 'JP',
    source: m.source || '',
    rating: m.averageScore || 0,
    meanScore: m.meanScore || 0,
    popularity: m.popularity || 0,
    favourites: m.favourites || 0,
    characters,
    recommendations,
    relations,
  };
}

// ── Cross-reference Cache (AniList ID → MangaDex ID) ─────────────────────

const mdxIdCache = new Map<number, string | null>();

async function resolveMangaDexId(anilistId: number, title: string, externalLinks?: any[]): Promise<string | null> {
  if (mdxIdCache.has(anilistId)) return mdxIdCache.get(anilistId)!;

  // 1. Try external links from AniList
  const mdxLink = externalLinks?.find((l: any) => l.site?.toLowerCase().includes('mangadex'));
  if (mdxLink?.url) {
    const match = mdxLink.url.match(/mangadex\.org\/title\/([a-f0-9-]+)/i);
    if (match?.[1]) {
      mdxIdCache.set(anilistId, match[1]);
      return match[1];
    }
  }

  // 2. Search by title
  const found = await mangaDexClient.searchId(title);
  mdxIdCache.set(anilistId, found);
  return found;
}

// ── Cross-reference Cache (AniList ID → MangaPill ID) ─────────────────────

const pillIdCache = new Map<number, string | null>();

async function resolveMangaPillId(anilistId: number, title: string): Promise<string | null> {
  if (pillIdCache.has(anilistId)) return pillIdCache.get(anilistId)!;
  const found = await mangaPillClient.searchId(title);
  pillIdCache.set(anilistId, found);
  return found;
}

// ── Service ────────────────────────────────────────────────────────────────

export const unifiedMangaService = {

  async getTrending(page = 1, perPage = 20): Promise<MangaCard[]> {
    return mangaCache.wrap(`unified:trending:${page}`, async () => {
      const data = await anilistFetch<any>(CARD_QUERY, { page, perPage, sort: ['TRENDING_DESC'] });
      return (data?.Page?.media || []).map(normaliseCard);
    });
  },

  async getPopular(page = 1, perPage = 20): Promise<MangaCard[]> {
    return mangaCache.wrap(`unified:popular:${page}`, async () => {
      const data = await anilistFetch<any>(CARD_QUERY, { page, perPage, sort: ['POPULARITY_DESC'] });
      return (data?.Page?.media || []).map(normaliseCard);
    });
  },

  async getTopRated(page = 1, perPage = 20): Promise<MangaCard[]> {
    return mangaCache.wrap(`unified:toprated:${page}`, async () => {
      const data = await anilistFetch<any>(CARD_QUERY, { page, perPage, sort: ['SCORE_DESC'] });
      return (data?.Page?.media || []).map(normaliseCard);
    });
  },

  async getNewReleases(page = 1, perPage = 20): Promise<MangaCard[]> {
    return mangaCache.wrap(`unified:new:${page}`, async () => {
      const data = await anilistFetch<any>(`
        query($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            media(type: MANGA, sort: START_DATE_DESC, isAdult: false, status: RELEASING) {
              id title { romaji english } coverImage { extraLarge large color }
              genres status averageScore popularity chapters format startDate { year }
            }
          }
        }
      `, { page, perPage });
      return (data?.Page?.media || []).map(normaliseCard);
    });
  },

  async getByGenre(genre: string, page = 1, perPage = 20): Promise<MangaCard[]> {
    return mangaCache.wrap(`unified:genre:${genre}:${page}`, async () => {
      const data = await anilistFetch<any>(`
        query($genre: String, $page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            media(type: MANGA, genre: $genre, sort: POPULARITY_DESC, isAdult: false) {
              id title { romaji english } coverImage { extraLarge large color }
              genres status averageScore popularity chapters format startDate { year }
            }
          }
        }
      `, { genre, page, perPage });
      return (data?.Page?.media || []).map(normaliseCard);
    });
  },

  async search(query: string, opts: { genres?: string[]; status?: string; sort?: string; page?: number; perPage?: number } = {}): Promise<MangaCard[]> {
    const key = `unified:search:${query}:${JSON.stringify(opts)}`;
    return mangaCache.wrap(key, async () => {
      const data = await anilistFetch<any>(SEARCH_QUERY, {
        search: query || undefined,
        genre_in: opts.genres?.length ? opts.genres : undefined,
        status: opts.status || undefined,
        sort: [opts.sort || 'TRENDING_DESC'],
        page: opts.page || 1,
        perPage: opts.perPage || 24,
      });
      return (data?.Page?.media || []).map(normaliseCard);
    }, 2 * 60 * 1000);
  },

  /** Full detail — AniList metadata merged with MangaDex + MangaPill ID resolution */
  async getDetail(anilistId: number): Promise<UnifiedManga> {
    return mangaCache.wrap(`unified:detail:${anilistId}`, async () => {
      const data = await anilistFetch<any>(DETAIL_QUERY, { id: anilistId });
      const raw = data?.Media;
      if (!raw) throw new Error(`AniList: manga ${anilistId} not found`);

      const base = normaliseDetail(raw);

      // Resolve both sources in parallel
      const [mangaDexId, mangaPillId] = await Promise.all([
        resolveMangaDexId(anilistId, base.title, raw.externalLinks || []),
        resolveMangaPillId(anilistId, base.title),
      ]);

      return {
        ...base,
        mangaDexId,
        mangaPillId,
        availableChapters: [],
        lastFetchedChapters: null,
      };
    }, 10 * 60 * 1000);
  },

  /**
   * Fetch chapters — MangaDex first, then MangaPill as fallback.
   * Pill chapters are marked with source:'pill' so getPages knows which API to use.
   */
  async getChapters(manga: UnifiedManga, lang = 'en') {
    const key = `unified:chapters:${manga.anilistId}:${lang}`;
    return mangaCache.wrap(key, async () => {
      // 1. Try MangaDex
      let mdxChapters: import('./mangaDexClient').MDXChapter[] = [];
      if (manga.mangaDexId) {
        try {
          mdxChapters = await mangaDexClient.getChapters(manga.mangaDexId, lang);
        } catch { /* ignore, fall through to Pill */ }
      }

      // 2. MangaPill fallback if MangaDex has no/few readable chapters
      const readableMdx = mdxChapters.filter(c => !c.externalUrl);
      if (readableMdx.length < 10 && manga.mangaPillId) {
        try {
          const pillChapters = await mangaPillClient.getChapters(manga.mangaPillId);
          // Normalise PillChapters into the MDXChapter shape
          // IMPORTANT: Pill IDs contain '/' which breaks Next.js routing — encode as '__'
          return pillChapters.map(pc => ({
            id: `PILL-${pc.id.replace(/\//g, '__')}`,   // encoded so URL stays one segment
            chapter: pc.chapter,
            title: pc.title,
            volume: null,
            pages: 1,               // non-zero so UI shows them as readable
            translatedLanguage: 'en',
            publishAt: '',
            readableAt: '',
            scanlationGroup: 'MangaPlus',
            externalUrl: null,
          } satisfies import('./mangaDexClient').MDXChapter));
        } catch { /* if Pill also fails, return whatever MangaDex gave us */ }
      }

      return mdxChapters;
    }, 5 * 60 * 1000);
  },

  /** Get readable page URLs for a chapter */
  async getPages(chapterId: string, dataSaver = false) {
    // Pill chapters are prefixed with 'PILL-'; decode __ back to / for the real Pill ID
    if (chapterId.startsWith('PILL-')) {
      const realId = chapterId.slice(5).replace(/__/g, '/');
      const key = `unified:pages:pill:${realId}`;
      return mangaCache.wrap(key, () => mangaPillClient.getPages(realId), 30 * 60 * 1000);
    }

    // MangaDex chapters
    const key = `unified:pages:${chapterId}:${dataSaver}`;
    const pagesData = await mangaCache.wrap(key, () => mangaDexClient.getPages(chapterId), 30 * 60 * 1000);
    const fileList = dataSaver ? pagesData.dataSaver : pagesData.data;
    return fileList.map(f => mangaDexClient.buildPageUrl(pagesData.baseUrl, pagesData.hash, f, dataSaver));
  },
};

export type { UnifiedManga, MangaCard };
