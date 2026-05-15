import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// ── Backend client (for auth/comments/watchlist) ────────────────────────────
const BACKEND = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
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

// ── Remote API client (direct to apis.ayohost.site) ────────────────────────
const REMOTE = axios.create({
  baseURL: 'https://apis.ayohost.site',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

REMOTE.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg =
      err?.response?.data?.error ||
      err?.message ||
      'Something went wrong';
    return Promise.reject(new Error(msg));
  }
);

// ── Anime endpoints (direct to remote API) ─────────────────────────────────
export const animeAPI = {
  getAiring:    (page = 1) => REMOTE.get('/api/airing', { params: { page } }),
  search:       (q: string) => REMOTE.get('/api/search', { params: { q } }),
  getDetail:    (slug: string) => REMOTE.get(`/api/anime/${slug}/info`),
  getEpisodes:  (slug: string, animeName?: string) => REMOTE.get(`/api/anime/${slug}/episodes`, animeName ? { params: { anime_name: animeName } } : {}),
  getStream:    (episodeSession: string, animeSlug: string, quality = 'best', audio = 'jpn') =>
    REMOTE.get('/api/stream', { params: { episode_session: episodeSession, anime_slug: animeSlug, quality, audio } }),
  getStreamQualities: (episodeSession: string, animeSlug: string) =>
    REMOTE.get('/api/stream/qualities', { params: { episode_session: episodeSession, anime_slug: animeSlug } }),
  createJob:    (payload: Record<string, unknown>) => REMOTE.post('/api/download', payload),
  getTrending:  () => REMOTE.get('/api/top-anime'),
  getRecommended: () => REMOTE.get('/api/latest-release'),
  getGenres:    () => REMOTE.get('/api/genres'),
  getGenre:     (genre: string, page = 1) => REMOTE.get('/api/genre', { params: { genre, page } }),
};

// ── Auth endpoints (backend for local authentication) ────────────────────────
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
};

// ── Comments ───────────────────────────────────────────────────────────────
export const commentAPI = {
  get:    (slug: string, page = 1) => BACKEND.get(`/api/comments/${slug}`, { params: { page } }),
  post:   (slug: string, text: string) => BACKEND.post(`/api/comments/${slug}`, { text }),
  delete: (id: number)               => BACKEND.delete(`/api/comments/delete/${id}`),
};

// ── Downloads ──────────────────────────────────────────────────────────────
export const downloadAPI = {
  getAll:        ()  => BACKEND.get('/api/downloads'),
  add:           (data: Record<string,unknown>) => BACKEND.post('/api/downloads', data),
  remove:        (id: number)    => BACKEND.delete(`/api/downloads/${id}`),
  removeAnime:   (slug: string)  => BACKEND.delete(`/api/downloads/anime/${slug}`),
  createJob:     (data: Record<string,unknown>) => REMOTE.post('/api/download', data),
  getJobStatus:  (id: string) => REMOTE.get(`/api/download/${id}/status`),
  getJobFile:    (id: string) => `https://apis.ayohost.site/api/download/${id}/file`,
};

// ── Watchlist ──────────────────────────────────────────────────────────────
export const watchlistAPI = {
  getAll: ()  => BACKEND.get('/api/watchlist'),
  toggle: (data: Record<string,unknown>) => BACKEND.post('/api/watchlist', data),
};

// ── History ────────────────────────────────────────────────────────────────
export const historyAPI = {
  getAll: () => BACKEND.get('/api/history'),
  update: (data: Record<string,unknown>) => BACKEND.post('/api/history', data),
  remove: (slug: string) => BACKEND.delete(`/api/history/${slug}`),
};

export default BACKEND;
