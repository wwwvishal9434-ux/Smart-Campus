import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Menu, Moon, Sun, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
const links = [['Home', '/#top'], ['Features', '/#features'], ['About', '/#about'], ['Contact', '/contact']];
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useTheme();
  const { isAuthenticated } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold"><GraduationCap className="text-brand-600" /> Smart Campus</Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {links.map(([l, h]) => <a key={l} href={h} className="hover:text-brand-600">{l}</a>)}
          <button onClick={toggle} aria-label="Toggle dark mode" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          <Link to={isAuthenticated ? '/dashboard' : '/login'} className="btn-primary">{isAuthenticated ? 'Dashboard' : 'Login'}</Link>
        </nav>
        <button className="md:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && (<div className="space-y-1 border-t border-slate-200 px-4 py-3 text-sm font-medium dark:border-slate-800 md:hidden" onClick={() => setOpen(false)}>
        {links.map(([l, h]) => <a key={l} href={h} className="block rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">{l}</a>)}
        <button onClick={toggle} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">{dark ? <Sun size={16} /> : <Moon size={16} />} {dark ? 'Light' : 'Dark'} mode</button>
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="btn-primary w-full">{isAuthenticated ? 'Dashboard' : 'Login'}</Link></div>)}
    </header>
  );
}
