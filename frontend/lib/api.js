import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('anikai_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('anikai_token');
      localStorage.removeItem('anikai_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register:      (data) => api.post('/auth/register', data),
  login:         (data) => api.post('/auth/login', data),
  me:            ()     => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// ── Anime ─────────────────────────────────────────────────────
export const animeAPI = {
  list:     (params) => api.get('/anime', { params }),
  get:      (id)     => api.get(`/anime/${id}`),
  trending: ()       => api.get('/anime/trending'),
  featured: ()       => api.get('/anime/featured'),
  create:   (data)   => api.post('/anime', data),
  update:   (id, data) => api.put(`/anime/${id}`, data),
  remove:   (id)     => api.delete(`/anime/${id}`),
};

// ── Episodes ──────────────────────────────────────────────────
export const episodeAPI = {
  list:   (animeId) => api.get(`/episodes/anime/${animeId}`),
  get:    (id)      => api.get(`/episodes/${id}`),
  create: (data)    => api.post('/episodes', data),
  update: (id, data) => api.put(`/episodes/${id}`, data),
  remove: (id)      => api.delete(`/episodes/${id}`),
};

// ── Watch History ─────────────────────────────────────────────
export const historyAPI = {
  updateProgress:    (data)    => api.post('/watch-history/progress', data),
  getHistory:        (params)  => api.get('/watch-history', { params }),
  getContinue:       ()        => api.get('/watch-history/continue-watching'),
  deleteEntry:       (id)      => api.delete(`/watch-history/${id}`),
  getFavorites:      ()        => api.get('/watch-history/favorites'),
  addFavorite:       (data)    => api.post('/watch-history/favorites', data),
  removeFavorite:    (animeId) => api.delete(`/watch-history/favorites/${animeId}`),
  rate:              (data)    => api.post('/watch-history/rate', data),
  getComments:       (animeId) => api.get(`/watch-history/comments/${animeId}`),
  addComment:        (data)    => api.post('/watch-history/comments', data),
  deleteComment:     (id)      => api.delete(`/watch-history/comments/${id}`),
};

// ── Genres ────────────────────────────────────────────────────
export const genreAPI = {
  list: () => api.get('/genres'),
};

// ── Recommendations ───────────────────────────────────────────
export const recommendAPI = {
  popular: ()  => api.get('/recommendations/popular'),
  forYou:  ()  => api.get('/recommendations/for-you'),
};

// ── Admin ─────────────────────────────────────────────────────
export const adminAPI = {
  stats:      ()        => api.get('/admin/stats'),
  listUsers:  (params)  => api.get('/admin/users', { params }),
  toggleUser: (id)      => api.patch(`/admin/users/${id}/toggle`),
  setRole:    (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  getLogs:    (params)  => api.get('/admin/logs', { params }),
};

export default api;
