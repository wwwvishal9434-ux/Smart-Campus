import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { fmt } from '../utils/format.jsx';
const FLOW = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED'];
export default function ApplicationsStudent() {
  const [rows, setRows] = useState(null); const [err, setErr] = useState(false);
  useEffect(() => { api.get('/applications/mine').then((r) => setRows(r.data.data)).catch(() => setErr(true)); }, []);
  return (<div><h1 className="text-2xl font-bold">My Applications</h1><div className="mt-4 space-y-4">
    {err ? <p className="py-10 text-center text-sm">Could not load applications. Please refresh.</p> : !rows ? <div className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      : !rows.length ? <p className="py-10 text-center text-sm text-slate-500">You have not applied to any job yet. <Link to="/student/jobs" className="font-semibold text-brand-600">Browse placements</Link></p> : rows.map((a) => { const i = FLOW.indexOf(a.status); const rejected = a.status === 'REJECTED';
      return (<div key={a.id} className="card"><h3 className="font-semibold">{a.jobTitle}</h3><p className="text-sm text-slate-500">{a.companyName} · Applied {fmt(a.appliedAt)}</p>
        {rejected ? <p className="mt-3 text-sm font-semibold text-red-600">Application not selected (REJECTED)</p> : (<ol className="mt-4 flex gap-1 overflow-x-auto">{FLOW.map((s, k) => <li key={s} className={`min-w-[96px] flex-1 rounded-lg px-2 py-2 text-center text-xs font-semibold ${k <= i ? (k === i ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200') : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>{s.replace('_', ' ')}</li>)}</ol>)}</div>); })}</div></div>);
}
