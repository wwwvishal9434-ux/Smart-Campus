import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, Mail, Award, Briefcase, Building2, ListChecks, BookOpen, ClipboardList, PenSquare, CalendarCheck, FileText, GraduationCap, LayoutDashboard, Library, LogOut, Menu, Moon, Presentation, Sun, User, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
const NAV = {
  ADMIN: [[LayoutDashboard, 'Dashboard', '/dashboard'], [Users, 'Students', '/admin/students'], [Presentation, 'Teachers', '/admin/teachers'], [BookOpen, 'Courses', '/admin/courses'], [Library, 'Subjects', '/admin/subjects'], [CalendarCheck, 'Attendance', '/admin/attendance'], [FileText, 'Notes', '/admin/notes'], [ClipboardList, 'Assignments', '/admin/assignments'], [PenSquare, 'Examinations', '/admin/exams'], [Award, 'Results', '/admin/results'], [Building2, 'Companies', '/admin/companies'], [Briefcase, 'Jobs', '/admin/jobs'], [ListChecks, 'Applications', '/admin/applications'], [Bell, 'Notifications', '/admin/notifications'], [CalendarDays, 'Events', '/admin/events'], [Mail, 'Messages', '/admin/messages']],
  STUDENT: [[LayoutDashboard, 'Dashboard', '/dashboard'], [User, 'Profile', '/student/profile'], [CalendarCheck, 'Attendance', '/student/attendance'], [FileText, 'Notes', '/student/notes'], [ClipboardList, 'Assignments', '/student/assignments'], [PenSquare, 'Examinations', '/student/exams'], [Award, 'Results', '/student/results'], [Briefcase, 'Placements', '/student/jobs'], [ListChecks, 'Applications', '/student/applications'], [Bell, 'Notifications', '/student/notifications'], [CalendarDays, 'Events', '/student/events']],
};
export default function AppLayout() {
  const { user, profile, logout } = useAuth(); const { dark, toggle } = useTheme(); const nav = useNavigate(); const [open, setOpen] = useState(false);
  const side = (<div className="flex h-full flex-col">
    <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5 font-bold dark:border-slate-800"><GraduationCap className="text-brand-600" /> Smart Campus</div>
    <nav className="flex-1 space-y-1 p-3">{(NAV[user.role] || NAV.STUDENT).map(([Icon, label, to]) => (
      <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}><Icon size={18} />{label}</NavLink>))}</nav>
    <button onClick={async () => { await logout(); nav('/'); }} className="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"><LogOut size={18} /> Logout</button></div>);
  return (<div className="min-h-screen lg:flex">
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">{side}</aside>
    {open && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} /><aside className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-slate-900">{side}</aside></div>}
    <div className="min-w-0 flex-1"><header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
      <button className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu /></button><span className="hidden text-sm text-slate-500 lg:block">{user.role === 'ADMIN' ? 'Administrator' : 'Student'} portal</span>
      <div className="flex items-center gap-3"><button onClick={toggle} aria-label="Toggle dark mode" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
        <span className="max-w-[40vw] truncate text-sm font-medium">{profile?.fullName || user.email}</span></div></header>
      <main className="p-4 sm:p-6"><Outlet /></main></div></div>);
}
