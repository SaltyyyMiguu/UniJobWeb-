import axios from 'axios';

// ─── Multi-tab localStorage auth ──────────────────────────────────────────────
// Tokens stored in localStorage by role, so two different roles can coexist.
// Each tab tracks its own active role in sessionStorage (survives refresh, not
// shared across tabs), so Tab1=student and Tab2=company never collide.

const ROLE_KEY = 'ujl_tab_role';
const tokenKey = (role) => `ujl_${role.toLowerCase()}_token`;

export const getActiveRole = () => sessionStorage.getItem(ROLE_KEY);
export const setActiveRole = (role) => sessionStorage.setItem(ROLE_KEY, role.toLowerCase());
export const removeActiveRole = () => sessionStorage.removeItem(ROLE_KEY);

export const getToken = () => {
  const role = getActiveRole();
  if (!role) return null;
  return localStorage.getItem(tokenKey(role));
};

export const setToken = (token, role) => {
  const r = role.toLowerCase();
  setActiveRole(r);
  localStorage.setItem(tokenKey(r), token);
};

export const removeToken = () => {
  const role = getActiveRole();
  if (role) localStorage.removeItem(tokenKey(role));
  removeActiveRole();
};

// ─── Axios instance ───────────────────────────────────────────────────────────
// Single source of truth for the backend origin — used both for the axios
// baseURL below and for building direct asset URLs (avatars, resumes, offer
// letters, cover images) everywhere else in the app that isn't a plain
// api.get/post call.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const msg = error.response.data?.message || '';
      if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('unauthorized')) {
        removeToken();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
