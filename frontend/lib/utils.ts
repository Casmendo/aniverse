import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(secs: number): string {
  if (!secs || isNaN(secs)) return '0:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

/** Detect session IDs, UUIDs, and hex hashes — these are NEVER valid titles */
function isSessionOrHash(s: string): boolean {
  if (!s) return true;
  // Titles with spaces are almost certainly real titles
  if (s.includes(' ') && s.length > 3) return false;
  // UUID pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(s)) return true;
  // Long hex hashes (20+ hex chars, possibly with dashes)
  if (/^[a-f0-9\-]{20,}$/i.test(s) && !s.includes(' ')) return true;
  // Pure hex string 32+ chars
  if (/^[a-f0-9]{32,}$/i.test(s)) return true;
  return false;
}

export function extractAnimeData(raw: Record<string, unknown>) {
  if (!raw) {
    return {
      slug: '', title: 'Unknown Anime', cover: '', banner: '',
      description: '', score: 0, status: '', type: '',
      year: '', episodes: 0, genres: [], in_watchlist: false,
    };
  }

  // Title priority: anime_title > name > title > anime_name
  // anime_title is the field the API uses for human-readable names
  const candidates = [
    raw.anime_title,
    raw.name,
    raw.title,
    raw.anime_name,
  ];

  let title = '';
  for (const c of candidates) {
    const val = String(c || '').trim();
    if (val && !isSessionOrHash(val)) {
      title = val;
      break;
    }
  }

  // Deduplicate title (e.g. "Black CloverBlack Clover" -> "Black Clover")
  if (title && title.length > 4) {
    const half = Math.floor(title.length / 2);
    if (title.length % 2 === 0 && title.slice(0, half) === title.slice(half)) {
      title = title.slice(0, half);
    }
  }

  // Final fallback
  if (!title) {
    title = 'Unknown Anime';
  }

  // Slug priority: anime_session > session > slug > id
  const slug = String(raw.anime_session || raw.session || raw.slug || raw.anime_id || raw.id || '');

  return {
    slug,
    title,
    cover:       String(raw.cover || raw.image || raw.poster || raw.thumbnail || raw.snapshot || ''),
    banner:      String(raw.banner || raw.cover || raw.image || raw.snapshot || ''),
    description: String(raw.description || raw.synopsis || raw.overview || ''),
    score:       parseFloat(String(raw.score || raw.rating || 0)) || 0,
    status:      String(raw.status || ''),
    type:        String(raw.type || raw.format || ''),
    year:        String(raw.year || (String(raw.aired || raw.start_date || raw.created_at || '')).split('-')[0] || ''),
    episodes:    Number(raw.total_episodes || raw.episodes_count || raw.episode_count || raw.episode || 0) || 0,
    genres:      (Array.isArray(raw.genres) ? raw.genres : Array.isArray(raw.genre) ? raw.genre : [])
                  .map((g: unknown) => typeof g === 'string' ? g : (g as {name:string}).name || ''),
    in_watchlist: Boolean(raw.in_watchlist),
  };
}

export function extractEpisode(raw: Record<string, unknown>, index: number) {
  const num = Number(raw.episode || raw.number || raw.ep_number || index + 1);
  let title = String(raw.title || raw.name || `Episode ${num}`);

  // If title is just a number, empty, or a session hash, use default
  if (!title || /^\d+$/.test(title.trim()) || isSessionOrHash(title)) {
    title = `Episode ${num}`;
  }

  return {
    id:        String(raw.session || raw.episode_session || raw.id || raw.slug || num),
    num,
    title,
    thumbnail: String(raw.snapshot || raw.thumbnail || raw.image || raw.cover || ''),
  };
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Returns initials from a name, e.g. "John Doe" → "JD" */
export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
