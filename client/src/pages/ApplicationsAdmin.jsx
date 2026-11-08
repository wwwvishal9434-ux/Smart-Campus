import { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../services/api.js';
import { fmt } from '../utils/format.jsx';
export const STAGES = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'];
export default function ApplicationsAdmin() {
  const [stats, setStats] = useState(null); const [rows, setRows] = useState(null); const [err, setErr] = useState(false); const [status, setStatus] = useState(''); const [q, setQ] = useState(''); const [query, setQuery] = useState('');
  useEffect(() => { const t = setTimeout(() => setQuery(q), 350); return () => clearTimeout(t); }, [q]);
  const loadStats = useCallback(() => api.get('/applications/stats').then((r) => setStats(r.data.data)).catch(() => {}), []);
  const load = useCallback(() => { setErr(false); api.get('/applications', { params: { status: status || undefined, q: query || undefined } }).then((r) => setRows(r.data.data)).catch(() => setErr(true)); }, [status, query]);
  useEffect(() => { load(); }, [load]); useEffect(() => { loadStats(); }, [loadStats]);
  const change = async (a, s) => { try { await api.patch(`/applications/${a.id}/status`, { status: s }); toast.success('Status updated'); setRows(rows.map((x) => (x.id === a.id ? { ...x, status: s } : x))); loadStats(); } catch (e) { toast.error(errorMessage(e)); } };
  const cards = stats && [['Companies', stats.companies], ['Jobs', stats.jobs], ['Applications', stats.applications], ['Shortlisted students', stats.shortlisted], ['Selected students', stats.selected], ['Placement rate', `${stats.placementRate}%`]];
  return (<div><h1 className="text-2xl font-bold">Applications &amp; Placement Analytics</h1>
    {stats && (<><div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-6">{cards.map(([k, v]) => <div key={k} className="card p-4"><p className="text-xs text-slate-500">{k}</p><p className="text-2xl font-bold">{v}</p></div>)}</div>
      <div className="card mt-4"><h2 className="font-semibold">Applications by status</h2><div className="mt-3 h-56"><ResponsiveContainer><BarChart data={stats.byStatus}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="status" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div></>)}
    <div className="mt-4 flex flex-wrap gap-3"><input className="input min-w-[200px] flex-1" placeholder="Search student name or enrollment…" value={q} onChange={(e) => setQ(e.target.value)} />
      <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Status: All</option>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></div>
    <div className="card mt-4 overflow-x-auto p-0">{err ? <p className="p-10 text-center text-sm">Could not load. <button className="font-semibold text-brand-600" onClick={load}>Retry</button></p> : !rows ? <div className="h-32 animate-pulse" /> : !rows.length ? <p className="p-10 text-center text-sm text-slate-500">No applications found.</p> : (
      <table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Job</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Applied</th><th className="px-4 py-3">Status</th></tr></thead>
        <tbody>{rows.map((a) => <tr key={a.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800"><td className="px-4 py-3">{a.studentName}<br /><span className="text-xs text-slate-500">{a.enrollmentNo} · Sem {a.semester}</span></td><td className="px-4 py-3">{a.jobTitle}</td><td className="px-4 py-3">{a.companyName}</td><td className="px-4 py-3">{fmt(a.appliedAt)}</td>
          <td className="px-4 py-3"><select aria-label="Application status" className="input w-auto py-1.5" value={a.status} onChange={(e) => change(a, e.target.value)}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table>)}</div></div>);
}
