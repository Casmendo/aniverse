import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// ── Anime API client (direct to animapi.ayohost.site — works WITHOUT backend) ──
const ANIMAPI = axios.create({
  baseURL: 'https://animapi.ayohost.site',
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

ANIMAPI.interceptors.response.use(
  (r) => r,
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
  return config;
});

BACKEND.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg =
      err?.response?.data?.error ||
      err?.message ||
      'Something went wrong';
    return Promise.reject(new Error(msg));
  }
);

// ── Anime endpoints (direct to animapi — no backend needed) ────────────────
export const animeAPI = {
  getAiring:    (page = 1) => ANIMAPI.get('/api/airing', { params: { page } }),
  search:       (q: string) => ANIMAPI.get('/api/search', { params: { q } }),
  // anime_name is REQUIRED for /info to work — without it the backend returns 404
  getDetail:    (slug: string, animeName?: string) =>
    ANIMAPI.get(`/api/anime/${slug}/info`, animeName ? { params: { anime_name: animeName } } : {}),
  getEpisodes:  (slug: string, animeName?: string) =>
    ANIMAPI.get(`/api/anime/${slug}/episodes`, animeName ? { params: { anime_name: animeName } } : {}),
  getStream:    (episodeSession: string, animeSlug: string, quality = 'best', audio = 'jpn') =>
    ANIMAPI.get('/api/stream', { params: { episode_session: episodeSession, anime_slug: animeSlug, quality, audio } }),
  getStreamQualities: (episodeSession: string, animeSlug: string) =>
    ANIMAPI.get('/api/stream/qualities', { params: { episode_session: episodeSession, anime_slug: animeSlug } }),
  getTrending:  () => ANIMAPI.get('/api/top-anime'),
  getRecommended: () => ANIMAPI.get('/api/latest-release'),
  getGenres:    () => ANIMAPI.get('/api/genres'),
  getGenre:     (genre: string, page = 1) => ANIMAPI.get('/api/genre', { params: { genre, page } }),
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
  updateAvatar: (avatar_url: string) =>
    BACKEND.post('/api/auth/update-avatar', { avatar_url }),
  checkForUpdate: (version: string) =>
    BACKEND.get('/api/app-update', { params: { version } }),
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

// ── Downloads (animapi for jobs, backend for library) ───────────────────────
export const downloadAPI = {
  // Library management (backend)
  getAll:        ()  => BACKEND.get('/api/downloads'),
  add:           (data: Record<string,unknown>) => BACKEND.post('/api/downloads', data),
  remove:        (id: number)    => BACKEND.delete(`/api/downloads/${id}`),
  removeAnime:   (slug: string)  => BACKEND.delete(`/api/downloads/anime/${slug}`),
  // Download jobs (animapi — direct, no backend needed)
  createJob:     (data: Record<string,unknown>) => ANIMAPI.post('/api/download', data),
  getJobStatus:  (id: string) => ANIMAPI.get(`/api/download/${id}/status`),
  getJobFile:    (id: string) => `https://animapi.ayohost.site/api/download/${id}/file`,
};

// ── Watchlist (backend) ────────────────────────────────────────────────────
export const watchlistAPI = {
  getAll: ()  => BACKEND.get('/api/watchlist'),
  toggle: (data: Record<string,unknown>) => BACKEND.post('/api/watchlist', data),
};

// ── History (backend) ──────────────────────────────────────────────────────
export const historyAPI = {
  getAll: () => BACKEND.get('/api/history'),
  update: (data: Record<string,unknown>) => BACKEND.post('/api/history', data),
  remove: (slug: string) => BACKEND.delete(`/api/history/${slug}`),
};

export default BACKEND;
