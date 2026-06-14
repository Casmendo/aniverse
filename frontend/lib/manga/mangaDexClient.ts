// ── MangaDex API Client ───────────────────────────────────────────────────
// Handles all direct MangaDex API communication.
// Isolated from AniList — purely for chapters and pages.

const BASE = 'https://api.mangadex.org';
const COVER_CDN = 'https://uploads.mangadex.org/covers';

// ── Raw fetch helper with retry ─────────────────────────────────────────────
async function mdxFetch<T>(path: string, params: Record<string, any> = {}, retries = 2): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      v.forEach(item => url.searchParams.append(k, String(item)));
    } else if (v !== undefined && v !== null) {
      url.searchParams.set(k, String(v));
    }
  });

  let lastErr: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url.toString(), {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 1500 * (i + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`MangaDex ${res.status}: ${path}`);
      return await res.json() as T;
    } catch (err) {
      lastErr = err as Error;
      if (i < retries) await new Promise(r => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw lastErr ?? new Error('MangaDex request failed');
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface MDXChapter {
  id: string;
  chapter: string | null;
  title: string | null;
  volume: string | null;
  pages: number;
  translatedLanguage: string;
  publishAt: string;
  readableAt: string;
  scanlationGroup?: string;
  externalUrl?: string | null;
}

export interface MDXPages {
  chapterId: string;
  baseUrl: string;
  hash: string;
  data: string[];       // High quality
  dataSaver: string[];  // Compressed
}

// ── MangaDex Client ────────────────────────────────────────────────────────

export const mangaDexClient = {

  /** Search MangaDex by title and return the best-match ID */
  async searchId(title: string): Promise<string | null> {
    try {
      const data = await mdxFetch<any>('/manga', {
        title,
        limit: 5,
        'contentRating[]': ['safe', 'suggestive'],
        'availableTranslatedLanguage[]': ['en'],
        'includes[]': ['cover_art'],
      });
      if (!data?.data?.length) return null;

      // Find best match — prefer exact title hit
      const cleaned = title.toLowerCase().trim();
      const sorted = data.data.sort((a: any, b: any) => {
        const titleA = Object.values(a.attributes?.title || {}).join(' ').toLowerCase();
        const titleB = Object.values(b.attributes?.title || {}).join(' ').toLowerCase();
        const matchA = titleA.includes(cleaned) ? 0 : 1;
        const matchB = titleB.includes(cleaned) ? 0 : 1;
        return matchA - matchB;
      });
      return sorted[0]?.id ?? null;
    } catch {
      return null;
    }
  },

  /** Fetch all available English chapters for a manga */
  async getChapters(mangaDexId: string, lang = 'en'): Promise<MDXChapter[]> {
    const all: MDXChapter[] = [];
    let offset = 0;
    const limit = 500;

    while (true) {
      const data = await mdxFetch<any>('/chapter', {
        manga: mangaDexId,
        limit,
        offset,
        'translatedLanguage[]': [lang],
        'order[chapter]': 'asc',
        'includes[]': ['scanlation_group'],
        'contentRating[]': ['safe', 'suggestive', 'erotica'],
      });

      const items = data?.data || [];
      for (const ch of items) {
        const group = ch.relationships?.find((r: any) => r.type === 'scanlation_group');
        all.push({
          id: ch.id,
          chapter: ch.attributes?.chapter || null,
          title: ch.attributes?.title || null,
          volume: ch.attributes?.volume || null,
          pages: ch.attributes?.pages || 0,
          translatedLanguage: ch.attributes?.translatedLanguage || lang,
          publishAt: ch.attributes?.publishAt || '',
          readableAt: ch.attributes?.readableAt || '',
          scanlationGroup: group?.attributes?.name,
          externalUrl: ch.attributes?.externalUrl || null,
        });
      }

      if (items.length < limit) break;
      offset += limit;
      if (offset > 3000) break; // Safety cap
    }

    return all;
  },

  /** Fetch page URLs for a chapter */
  async getPages(chapterId: string): Promise<MDXPages> {
    const data = await mdxFetch<any>(`/at-home/server/${chapterId}`);
    return {
      chapterId,
      baseUrl: data.baseUrl,
      hash: data.chapter.hash,
      data: data.chapter.data,
      dataSaver: data.chapter.dataSaver,
    };
  },

  /** Build a full-quality page URL */
  buildPageUrl(baseUrl: string, hash: string, fileName: string, dataSaver = false): string {
    const quality = dataSaver ? 'data-saver' : 'data';
    return `${baseUrl}/${quality}/${hash}/${fileName}`;
  },
};
