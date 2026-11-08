import axios from 'axios';
export const TOKEN_KEY = 'sc_token';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 15000 });
api.interceptors.request.use((cfg) => { const t = localStorage.getItem(TOKEN_KEY); if (t) cfg.headers.Authorization = `Bearer ${t}`; return cfg; });
api.interceptors.response.use((r) => r, (err) => {
  const isAuthCall = /\/auth\/(login|register)/.test(err.config?.url || '');
  if (err.response?.status === 401 && !isAuthCall) { localStorage.removeItem(TOKEN_KEY); if (location.pathname !== '/login') location.assign('/login'); }
  return Promise.reject(err);
});
export const errorMessage = (err) =>
  err.response?.data?.errors?.[0]?.message || err.response?.data?.message ||
  (err.code === 'ERR_NETWORK' ? 'Cannot reach the server. Check your connection.' : 'Something went wrong. Please try again.');
export default api;
