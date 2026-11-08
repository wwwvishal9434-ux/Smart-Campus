import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { TOKEN_KEY } from '../services/api.js';
const Ctx = createContext(null);
export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null); // { user, profile }
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    api.get('/auth/me').then((r) => setSession(r.data.data)).catch(() => localStorage.removeItem(TOKEN_KEY)).finally(() => setLoading(false));
  }, []);
  const start = (data) => { localStorage.setItem(TOKEN_KEY, data.token); setSession({ user: data.user, profile: data.profile }); return data.user; };
  const login = useCallback(async (body) => start((await api.post('/auth/login', body)).data.data), []);
  const register = useCallback(async (body) => start((await api.post('/auth/register', body)).data.data), []);
  const logout = useCallback(async () => { try { await api.post('/auth/logout'); } catch { /* token may already be invalid */ } localStorage.removeItem(TOKEN_KEY); setSession(null); }, []);
  return <Ctx.Provider value={{ ...session, isAuthenticated: !!session, loading, login, register, logout }}>{children}</Ctx.Provider>;
};
export const useAuth = () => useContext(Ctx);
