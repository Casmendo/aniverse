// ── MangaPill Client (via Consumet) ──────────────────────────────────────────
// Fetches chapters & pages from MangaPill through Consumet API.
// Used as a fallback when MangaDex only has partial chapters (e.g. Shueisha titles).

const CONSUMET = 'https://consumet-api.onrender.com';
const PROVIDER = 'mangapill';

export interface PillChapter {
  id: string;           // e.g. "5460-10001000/dandadan-chapter-1"
  chapter: string;      // e.g. "1"
  title: string;        // e.g. "Chapter 1"
}

export interface PillPage {
  img: string;
  page: number;
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function pillFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${CONSUMET}/manga/${PROVIDER}${path}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`MangaPill ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// ── Client ─────────────────────────────────────────────────────────────────────

export const mangaPillClient = {

  /** Search MangaPill by title and return the best-match internal ID */
  async searchId(title: string): Promise<string | null> {
    try {
      const query = encodeURIComponent(title.toLowerCase().trim());
      const data = await pillFetch<{ results?: { id: string; title: string }[] }>(`/${query}`);
      if (!data?.results?.length) return null;

      const cleaned = title.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
      const exact = data.results.find(r => {
        const t = r.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
        return t === cleaned;
      });
      return (exact ?? data.results[0])?.id ?? null;
    } catch {
      return null;
    }
  },

  /** Get all chapters for a MangaPill manga ID */
  async getChapters(pillId: string): Promise<PillChapter[]> {
    try {
      const data = await pillFetch<{ chapters?: PillChapter[] }>(`/info?id=${encodeURIComponent(pillId)}`);
      return data?.chapters ?? [];
    } catch {
      return [];
    }
  },

  /** Get page image URLs for a MangaPill chapter ID */
  async getPages(chapterId: string): Promise<string[]> {
    const data = await pillFetch<PillPage[]>(`/read?chapterId=${encodeURIComponent(chapterId)}`);
    return (Array.isArray(data) ? data : [])
      .sort((a, b) => a.page - b.page)
      .map(p => p.img);
  },
};
