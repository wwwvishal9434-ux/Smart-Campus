import { useEffect, useState } from 'react';
import { CalendarDays, MapPin } from 'lucide-react';
import api from '../services/api.js';
import { Badge, fmt } from '../utils/format.jsx';
import { Empty } from '../components/Stat.jsx';
const CATS = ['GENERAL', 'ACADEMIC', 'EXAMINATION', 'PLACEMENT', 'ASSIGNMENT', 'EVENT'];
export function NotificationsStudent() {
  const [rows, setRows] = useState(null); const [err, setErr] = useState(false); const [cat, setCat] = useState('');
  useEffect(() => { setRows(null); api.get('/notifications/mine', { params: { category: cat || undefined } }).then((r) => setRows(r.data.data)).catch(() => setErr(true)); }, [cat]);
  return (<div><h1 className="text-2xl font-bold">Notifications</h1>
    <div className="mt-4 flex flex-wrap gap-2">{['', ...CATS].map((c) => <button key={c} onClick={() => setCat(c)} className={cat === c ? 'btn-primary px-3 py-1.5' : 'btn-outline px-3 py-1.5'}>{c || 'ALL'}</button>)}</div>
    <div className="mt-4 space-y-3">{err ? <Empty>Could not load notifications. Please refresh.</Empty> : !rows ? <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" /> : !rows.length ? <Empty>No notifications.</Empty>
      : rows.map((n) => <div key={n.id} className="card"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Badge tone="blue">{n.category}</Badge><h3 className="font-semibold">{n.title}</h3></div><span className="text-xs text-slate-500">{fmt(n.createdAt)}</span></div><p className="mt-2 whitespace-pre-line text-sm text-slate-600 dark:text-slate-400">{n.message}</p></div>)}</div></div>);
}
export function EventsStudent() {
  const [rows, setRows] = useState(null); const [err, setErr] = useState(false);
  useEffect(() => { api.get('/events', { params: { upcoming: 1 } }).then((r) => setRows(r.data.data)).catch(() => setErr(true)); }, []);
  return (<div><h1 className="text-2xl font-bold">Upcoming Events</h1><div className="mt-4 grid gap-4 md:grid-cols-2">
    {err ? <Empty>Could not load events. Please refresh.</Empty> : !rows ? <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" /> : !rows.length ? <Empty>No upcoming events.</Empty>
      : rows.map((e) => <div key={e.id} className="card"><h3 className="flex items-center gap-2 font-semibold"><CalendarDays size={16} className="text-brand-600" />{e.title}</h3>
        <p className="mt-1 text-sm text-slate-500">{new Date(e.eventDate).toLocaleDateString('en-IN', { dateStyle: 'full', timeZone: 'UTC' })}{e.eventTime && ` · ${e.eventTime}`}</p>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin size={14} />{e.location} · {e.organizer}</p>{e.description && <p className="mt-2 text-sm">{e.description}</p>}</div>)}</div></div>);
}
