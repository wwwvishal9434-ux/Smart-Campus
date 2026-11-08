import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api.js';
export default function AttendanceStudent() {
  const [d, setD] = useState(null); const [err, setErr] = useState(false);
  useEffect(() => { api.get('/attendance/me').then((r) => setD(r.data.data)).catch(() => setErr(true)); }, []);
  if (err) return <p className="py-10 text-center text-sm">Could not load attendance. Please refresh.</p>;
  if (!d) return <div className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />;
  if (!d.overall.total && !d.history.length) return <p className="py-10 text-center text-sm text-slate-500">No attendance has been recorded for you yet.</p>;
  return (<div className="space-y-6"><h1 className="text-2xl font-bold">My Attendance</h1>
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="card"><p className="text-sm text-slate-500">Overall</p><p className={`text-3xl font-bold ${d.overall.percentage < 75 ? 'text-red-600' : 'text-green-600'}`}>{d.overall.percentage}%</p></div>
      <div className="card"><p className="text-sm text-slate-500">Classes attended</p><p className="text-3xl font-bold">{d.overall.attended}</p></div>
      <div className="card"><p className="text-sm text-slate-500">Total classes</p><p className="text-3xl font-bold">{d.overall.total}</p></div></div>
    <div className="card"><h2 className="font-semibold">Monthly attendance (%)</h2><div className="mt-4 h-64"><ResponsiveContainer><BarChart data={d.monthly}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="month" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="percentage" fill="#2563eb" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
    <div className="card overflow-x-auto p-0"><table className="w-full min-w-[420px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><tr><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Attended / Total</th><th className="px-4 py-3">%</th></tr></thead>
      <tbody>{d.bySubject.map((s) => <tr key={s.code} className="border-b border-slate-100 last:border-0 dark:border-slate-800"><td className="px-4 py-3">{s.code} - {s.name}</td><td className="px-4 py-3">{s.attended} / {s.total}</td><td className={`px-4 py-3 font-semibold ${s.percentage < 75 ? 'text-red-600' : ''}`}>{s.percentage}%</td></tr>)}</tbody></table></div>
    <div className="card overflow-x-auto p-0"><h2 className="px-4 pt-4 font-semibold">Recent history</h2><table className="mt-2 w-full min-w-[420px] text-left text-sm"><tbody>{d.history.map((h) => <tr key={h.id} className="border-t border-slate-100 dark:border-slate-800"><td className="px-4 py-2">{h.date}</td><td className="px-4 py-2">{h.subject}</td><td className="px-4 py-2 font-medium">{h.status}</td></tr>)}</tbody></table></div></div>);
}
