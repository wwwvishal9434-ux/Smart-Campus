import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
export default function PublicLayout() {
  return (<div className="flex min-h-screen flex-col"><Navbar /><main className="flex-1"><Outlet /></main>
    <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-slate-800">
      Smart Campus · BCA Final Year Project · DPBS College, Anupshahr · Developed by Vishal Sharma</footer></div>);
}
