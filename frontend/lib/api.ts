import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// ── Anime API client (direct to apis.ayohost.site — works WITHOUT backend) ──
const ANIMAPI = axios.create({
  baseURL: 'https://leo-aniverse-ca5adf1fd1b9.herokuapp.com/api/v1',
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

// Simple in-memory cache for GET requests (5 minute TTL)
const apiCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

ANIMAPI.interceptors.request.use((config) => {
  if (config.method?.toLowerCase() === 'get') {
    const key = config.url + JSON.stringify(config.params || {});
    const cached = apiCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      config.adapter = () => Promise.resolve({
        data: cached.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {}
      });
    }
  }
  return config;
});

ANIMAPI.interceptors.response.use(
  (r) => {
    if (r.config.method?.toLowerCase() === 'get') {
      const key = r.config.url + JSON.stringify(r.config.params || {});
      apiCache.set(key, { data: r.data, timestamp: Date.now() });
    }
    return r;
  },
  (err) => {
    const msg =
      err?.response?.data?.error ||
      err?.message ||
      'Something went wrong';
    return Promise.reject(new Error(msg));
  }
);

// ── Backend client (for auth/comments/watchlist — needs Pterodactyl backend) ──
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const BACKEND = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

BACKEND.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Attach secret API key for backend verification
  config.headers['X-Aniverse-Key'] = process.env.NEXT_PUBLIC_ANIVERSE_KEY || 'aniverse_secure_api_key_2026_xyz';
  
  if (config.method?.toLowerCase() === 'get') {
    const key = 'BACKEND_' + config.url + JSON.stringify(config.params || {});
    const cached = apiCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      config.adapter = () => Promise.resolve({
        data: cached.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {}
      });
    }
  }
  
  return config;
});

BACKEND.interceptors.response.use(
  (r) => {
    if (r.config.method?.toLowerCase() === 'get') {
      const key = 'BACKEND_' + r.config.url + JSON.stringify(r.config.params || {});
      apiCache.set(key, { data: r.data, timestamp: Date.now() });
    }
    return r;
  },
  (err) => {
    if (err?.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    const msg =
      err?.response?.data?.error ||
      err?.message ||
      'Something went wrong';
    return Promise.reject(new Error(msg));
  }
);

// ── Anime endpoints (direct to animapi — no backend needed) ────────────────
export const animeAPI = {
  getAiring:    (page = 1) => ANIMAPI.get('/recent', { params: { page } }),
  search:       (q: string) => ANIMAPI.get('/search', { params: { q } }),
  getDetail:    (slug: string, animeName?: string) => ANIMAPI.get(`/anime/${slug}/info`),
  getEpisodes:  (slug: string, animeName?: string) => ANIMAPI.get(`/anime/${slug}/info`),
  getStream:    (episodeSession: string, animeSlug: string, quality = 'best', audio = 'sub') =>
    ANIMAPI.get(`/anime/${animeSlug}/episodes/${episodeSession}/streams`, { params: { type: audio } }),
  getStreamQualities: (episodeSession: string, animeSlug: string) =>
    ANIMAPI.get(`/anime/${animeSlug}/episodes/${episodeSession}/qualities`),
  getTrending:  () => ANIMAPI.get('/trending'),
  getRecommended: () => ANIMAPI.get('/popular'),
  getGenres:    () => ANIMAPI.get('/genres'),
  getGenre:     (genre: string, page = 1) => ANIMAPI.get(`/genres/${genre}`, { params: { page } }),
};

// ── Auth endpoints (backend — needs Pterodactyl) ────────────────────────────
export const authAPI = {
  signup:         (data: { username:string; email:string; password:string }) =>
    BACKEND.post('/api/auth/signup', data),
  verifyOtp:      (email: string, otp: string) => BACKEND.post('/api/auth/verify-otp', { email, otp }),
  resendOtp:      (email: string) => BACKEND.post('/api/auth/resend-otp', { email }),
  login:          (data: { email:string; password:string }) =>
    BACKEND.post('/api/auth/login', data),
  logout:         ()            => BACKEND.post('/api/auth/logout'),
  getUser:        ()            => BACKEND.get('/api/user'),
  updateUsername: (username: string) =>
    BACKEND.post('/api/auth/update-username', { username }),
  changePassword: (old_password: string, new_password: string) =>
    BACKEND.post('/api/auth/change-password', { old_password, new_password }),
  updateAvatar: (avatarUrl: string) =>
    BACKEND.post('/api/user/avatar', { avatarUrl }),
  forgotPassword: (email: string) =>
    BACKEND.post('/api/auth/forgot-password', { email }),
  resetPassword:  (email: string, otp: string, new_password: string) =>
    BACKEND.post('/api/auth/reset-password', { email, otp, new_password }),
};

// ── Comments (backend) ─────────────────────────────────────────────────────
export const commentAPI = {
  get:    (slug: string, page = 1) => BACKEND.get(`/api/comments/${slug}`, { params: { page } }),
  post:   (slug: string, text: string, parent_id?: number) => BACKEND.post(`/api/comments/${slug}`, { text, parent_id }),
  delete: (id: number)               => BACKEND.delete(`/api/comments/delete/${id}`),
};

// ── Notifications (backend) ────────────────────────────────────────────────
export const notificationAPI = {
  getAll:  () => BACKEND.get('/api/notifications'),
  markRead: (id: number) => BACKEND.post('/api/notifications/read', { id }),
};

// ── Admin (backend) ────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => BACKEND.get('/api/admin/stats'),
};

// ── Downloads (animapi for jobs, backend for library) ───────────────────────
export const downloadAPI = {
  // Library management (backend)
  getAll:        ()  => BACKEND.get('/api/downloads'),
  add:           (data: Record<string,unknown>) => BACKEND.post('/api/downloads', data),
  remove:        (id: number)    => BACKEND.delete(`/api/downloads/${id}`),
  removeAnime:   (slug: string)  => BACKEND.delete(`/api/downloads/anime/${slug}`),
  // Download jobs (animapi — direct, no backend needed)
  createJob:     (data: Record<string,unknown>) => Promise.resolve({ data: { id: 'done', status: 'completed' } }),
  getJobStatus:  (id: string) => Promise.resolve({ data: { status: 'completed', progress: 100 } }),
  getJobFile:    (id: string, animeId?: string) => `https://leo-aniverse-ca5adf1fd1b9.herokuapp.com/api/v1/anime/${animeId}/episodes/${id}/download`,
};

// ── Watchlist (backend) ────────────────────────────────────────────────────
export const watchlistAPI = {
  getAll: ()  => BACKEND.get('/api/watchlist'),
  toggle: (data: Record<string,unknown>) => BACKEND.post('/api/watchlist', data),
};

export const historyAPI = {
  getAll: () => BACKEND.get('/api/history'),
  update: (data: Record<string,unknown>) => BACKEND.post('/api/history', data),
  remove: (slug: string) => BACKEND.delete(`/api/history/${slug}`),
};

// ── Manga Watchlist (backend) ────────────────────────────────────────────────
export const mangaWatchlistAPI = {
  getAll: () => BACKEND.get('/api/manga/bookmarks'),
  toggle: (data: Record<string,unknown>) => BACKEND.post('/api/manga/bookmarks', data),
};

// ── Manga History (backend) ──────────────────────────────────────────────────
export const mangaHistoryAPI = {
  getAll: () => BACKEND.get('/api/manga/history'),
  update: (data: Record<string,unknown>) => BACKEND.post('/api/manga/history', data),
  remove: (mangaId: string) => BACKEND.delete(`/api/manga/history/${mangaId}`),
};

export default BACKEND;
