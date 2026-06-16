// ── MangaPill Client (via Consumet) ──────────────────────────────────────────
// Fetches chapters & pages from MangaPill through our internal /api/consumet proxy.
// This means the browser NEVER calls Consumet directly — no CORS issues.

const PROXY_BASE = '/api/consumet';   // Our Next.js proxy → consumet-api.onrender.com
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
  const res = await fetch(`${PROXY_BASE}/manga/${PROVIDER}${path}`);
  if (!res.ok) throw new Error(`MangaPill proxy ${res.status}: ${path}`);
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
      
      // Find all results that contain the cleaned title
      const matches = data.results.filter(r => {
        const t = r.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
        return t === cleaned || t.includes(cleaned) || cleaned.includes(t);
      });

      if (matches.length > 0) {
        // Sort by length to prefer the main series over spin-offs/artbooks (which usually have longer titles)
        matches.sort((a, b) => a.title.length - b.title.length);
        return matches[0].id;
      }

      return data.results[0]?.id ?? null;
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

  /** Get page image URLs for a MangaPill chapter ID.
   *  Images are routed through /api/pill-image proxy to bypass CDN hotlink protection.
   */
  async getPages(chapterId: string): Promise<string[]> {
    const data = await pillFetch<PillPage[]>(`/read?chapterId=${encodeURIComponent(chapterId)}`);
    return (Array.isArray(data) ? data : [])
      .sort((a, b) => a.page - b.page)
      .map(p => `/api/pill-image?url=${encodeURIComponent(p.img)}`);
  },
};
