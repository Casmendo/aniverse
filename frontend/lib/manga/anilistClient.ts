// ── AniList GraphQL Client ─────────────────────────────────────────────────
// Completely isolated from the existing anime API (lib/api.ts)
// Uses AniList's public GraphQL endpoint — no API key required.

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

interface AniListResponse<T> {
  data: T;
  errors?: { message: string; status: number }[];
}

async function anilistFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  retries = 2
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(ANILIST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables }),
      });

      if (res.status === 429) {
        // Rate-limited — wait before retry
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      if (!res.ok) {
        throw new Error(`AniList HTTP ${res.status}`);
      }

      const json: AniListResponse<T> = await res.json();

      if (json.errors?.length) {
        throw new Error(json.errors[0].message);
      }

      return json.data;
    } catch (err) {
      lastError = err as Error;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  throw lastError ?? new Error('AniList request failed');
}

export default anilistFetch;
