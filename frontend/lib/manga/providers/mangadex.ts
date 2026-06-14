import axios from 'axios';
import type {
  MangaProvider, MangaResult, MangaDetail, Chapter,
  ChapterPages, SearchOptions, ChapterOptions, MangaStatus,
  ContentRating,
} from '../types';

const BASE = 'https://api.mangadex.org';
const COVER_CDN = 'https://uploads.mangadex.org/covers';
const STATIC_CDN = 'https://api.mangadex.org';

const client = axios.create({ baseURL: BASE, timeout: 15000 });

// ── Helpers ────────────────────────────────────────────────────────────────

function coverUrl(mangaId: string, fileName?: string, size: 256 | 512 = 512): string {
  if (!fileName) return '';
  return `${COVER_CDN}/${mangaId}/${fileName}.${size}.jpg`;
}

function extractTitle(titles: Record<string, string>): string {
  return (
    titles['en'] ||
    titles['ja-ro'] ||
    Object.values(titles)[0] ||
    'Unknown Title'
  );
}

function extractDesc(descs: Record<string, string>): string {
  return descs['en'] || Object.values(descs)[0] || '';
}

function normaliseManga(raw: any): MangaResult {
  const { id, attributes: a, relationships: rels = [] } = raw;

  const coverRel = rels.find((r: any) => r.type === 'cover_art');
  const fileName  = coverRel?.attributes?.fileName as string | undefined;

  const authors = rels
    .filter((r: any) => r.type === 'author' || r.type === 'artist')
    .map((r: any) => ({
      id:   r.id,
      name: r.attributes?.name || '',
      role: r.type as 'author' | 'artist',
    }));

  const tags = (a.tags || []).map((t: any) => ({
    id:    t.id,
    name:  extractTitle(t.attributes?.name || {}),
    group: t.attributes?.group || 'genre',
  }));

  return {
    id,
    title:        extractTitle(a.title || {}),
    altTitles:    (a.altTitles || []).map((t: any) => Object.values(t)[0] as string),
    description:  extractDesc(a.description || {}),
    status:       (a.status as MangaStatus) || 'unknown',
    year:         a.year,
    contentRating: (a.contentRating as ContentRating) || 'safe',
    tags,
    authors,
    coverArt:     coverUrl(id, fileName),
    coverFileName: fileName,
    lastChapter:   a.lastChapter,
    latestUploadedChapter: a.latestUploadedChapter,
  };
}

// ── MangaDex Provider ──────────────────────────────────────────────────────

export const MangaDexProvider: MangaProvider = {
  id:          'mangadex',
  name:        'MangaDex',
  isLicensed:  false,
  supportedLanguages: ['en', 'ja', 'ko', 'zh'],

  async search(query: string, options: SearchOptions = {}): Promise<MangaResult[]> {
    const { data } = await client.get('/manga', {
      params: {
        title:             query,
        limit:             options.limit ?? 20,
        offset:            ((options.page ?? 1) - 1) * (options.limit ?? 20),
        'includes[]':      ['cover_art', 'author', 'artist'],
        'contentRating[]': options.contentRating ?? ['safe', 'suggestive'],
        'order[relevance]':'desc',
        ...(options.status ? { status: [options.status] } : {}),
        ...(options.genres?.length ? { 'includedTags[]': options.genres } : {}),
      },
    });
    return (data.data || []).map(normaliseManga);
  },

  async getDetail(id: string): Promise<MangaDetail> {
    const { data } = await client.get(`/manga/${id}`, {
      params: { 'includes[]': ['cover_art', 'author', 'artist', 'manga'] },
    });
    const base = normaliseManga(data.data);

    const relatedRels = (data.data.relationships || []).filter((r: any) => r.type === 'manga');
    const relatedManga = relatedRels.map((r: any) => ({
      id:       r.id,
      title:    extractTitle(r.attributes?.title || {}),
      relation: r.related || 'related',
      coverArt: '',
    }));

    return {
      ...base,
      relatedManga,
      links:                    data.data.attributes?.links || {},
      availableTranslatedLangs: data.data.attributes?.availableTranslatedLanguages || [],
    };
  },

  async getChapters(id: string, options: ChapterOptions = {}): Promise<Chapter[]> {
    const limit = options.limit ?? 500;
    const { data } = await client.get('/chapter', {
      params: {
        manga:                 id,
        limit,
        offset:                ((options.page ?? 1) - 1) * limit,
        'translatedLanguage[]': [options.language ?? 'en'],
        'order[chapter]':      options.sortOrder ?? 'asc',
        'includes[]':          ['scanlation_group'],
        'contentRating[]':     ['safe', 'suggestive', 'erotica'],
      },
    });

    return (data.data || []).map((ch: any) => {
      const group = ch.relationships?.find((r: any) => r.type === 'scanlation_group');
      return {
        id:                  ch.id,
        title:               ch.attributes?.title || '',
        volume:              ch.attributes?.volume,
        chapter:             ch.attributes?.chapter,
        pages:               ch.attributes?.pages || 0,
        translatedLanguage:  ch.attributes?.translatedLanguage || 'en',
        scanlationGroup:     group?.attributes?.name,
        publishAt:           ch.attributes?.publishAt || '',
        readableAt:          ch.attributes?.readableAt || '',
        externalUrl:         ch.attributes?.externalUrl,
      } as Chapter;
    });
  },

  async getPages(chapterId: string, dataSaver = false): Promise<ChapterPages> {
    const { data } = await client.get(`/at-home/server/${chapterId}`);
    return {
      chapterId,
      baseUrl:   data.baseUrl,
      hash:      dataSaver ? data.chapter.hashSaver : data.chapter.hash,
      data:      data.chapter.data,
      dataSaver: data.chapter.dataSaver,
    };
  },

  async getTrending(): Promise<MangaResult[]> {
    const { data } = await client.get('/manga', {
      params: {
        limit:             20,
        'includes[]':      ['cover_art', 'author'],
        'contentRating[]': ['safe', 'suggestive'],
        'order[followedCount]': 'desc',
        'availableTranslatedLanguage[]': ['en'],
      },
    });
    return (data.data || []).map(normaliseManga);
  },

  async getLatest(): Promise<MangaResult[]> {
    const { data } = await client.get('/manga', {
      params: {
        limit:             20,
        'includes[]':      ['cover_art', 'author'],
        'contentRating[]': ['safe', 'suggestive'],
        'order[latestUploadedChapter]': 'desc',
        'availableTranslatedLanguage[]': ['en'],
      },
    });
    return (data.data || []).map(normaliseManga);
  },

  async getByGenre(genreTagId: string, page = 1): Promise<MangaResult[]> {
    const { data } = await client.get('/manga', {
      params: {
        limit:             20,
        offset:            (page - 1) * 20,
        'includes[]':      ['cover_art', 'author'],
        'contentRating[]': ['safe', 'suggestive'],
        'includedTags[]':  [genreTagId],
        'order[followedCount]': 'desc',
        'availableTranslatedLanguage[]': ['en'],
      },
    });
    return (data.data || []).map(normaliseManga);
  },
};

// ── Page URL builders ──────────────────────────────────────────────────────

export function buildPageUrl(
  baseUrl: string,
  hash: string,
  fileName: string,
  dataSaver = false,
): string {
  const quality = dataSaver ? 'data-saver' : 'data';
  return `${baseUrl}/${quality}/${hash}/${fileName}`;
}

export function getMangaDexCover(mangaId: string, fileName: string, size: 256 | 512 = 512) {
  return coverUrl(mangaId, fileName, size);
}
