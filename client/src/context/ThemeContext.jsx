import { createContext, useContext, useEffect, useState } from 'react';
const Ctx = createContext(null);
export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); try { localStorage.setItem('sc_theme', dark ? 'dark' : 'light'); } catch { /* storage unavailable */ } }, [dark]);
  return <Ctx.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>{children}</Ctx.Provider>;
};
export const useTheme = () => useContext(Ctx);
