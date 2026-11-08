import { useCallback, useEffect, useState } from 'react';
import { Briefcase, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../services/api.js';
import Modal from '../components/Modal.jsx';
import { Badge } from '../utils/format.jsx';
const TYPE = { FULL_TIME: 'Full time', INTERNSHIP: 'Internship', PART_TIME: 'Part time', CONTRACT: 'Contract' };
export default function JobsStudent() {
  const [d, setD] = useState(null); const [err, setErr] = useState(false); const [q, setQ] = useState(''); const [type, setType] = useState(''); const [open, setOpen] = useState(null); const [apply, setApply] = useState(null); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false);
  const load = useCallback(() => { setErr(false); api.get('/jobs/mine', { params: { q: q || undefined, jobType: type || undefined } }).then((r) => setD(r.data.data)).catch(() => setErr(true)); }, [q, type]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);
  const submit = async () => { setBusy(true); try { await api.post(`/jobs/${apply.id}/apply`, { coverNote: note }); toast.success('Application submitted'); setApply(null); setNote(''); load(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); } };
  return (<div><h1 className="text-2xl font-bold">Placement Opportunities</h1>{d && <p className="mt-1 text-sm text-slate-500">Your academic percentage: {d.percentage === null ? 'no results recorded yet' : `${d.percentage}%`}</p>}
    <div className="mt-4 flex flex-wrap gap-3"><input className="input min-w-[200px] flex-1" placeholder="Search job, company or location…" value={q} onChange={(e) => setQ(e.target.value)} />
      <select className="input w-auto" value={type} onChange={(e) => setType(e.target.value)}><option value="">All types</option>{Object.entries(TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
    <div className="mt-4 space-y-4">{err ? <p className="py-10 text-center text-sm">Could not load jobs. <button className="font-semibold text-brand-600" onClick={load}>Retry</button></p> : !d ? <div className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      : !d.items.length ? <p className="py-10 text-center text-sm text-slate-500">No jobs found.</p> : d.items.map((j) => (
      <div key={j.id} className="card"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="flex items-center gap-2 font-semibold"><Briefcase size={16} className="text-brand-600" />{j.title}</h3><p className="text-sm text-slate-500">{j.companyName}</p></div>
        {j.applicationStatus ? <Badge tone="blue">{j.applicationStatus.replace('_', ' ')}</Badge> : <Badge tone={j.eligible ? 'green' : 'red'}>{j.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}</Badge>}</div>
        <p className="mt-2 flex flex-wrap gap-x-4 text-xs text-slate-500"><span className="flex items-center gap-1"><MapPin size={12} />{j.location}</span><span>{TYPE[j.jobType]}</span>{j.package && <span>{j.package}</span>}<span>Min {j.minPercentage}%</span><span>Deadline {new Date(j.deadline).toLocaleDateString('en-IN')}</span><span>{j.openings} opening{j.openings > 1 ? 's' : ''}</span></p>
        {open === j.id && <div className="mt-3 text-sm"><p className="whitespace-pre-line">{j.description}</p>{!!j.skills.length && <p className="mt-2">Skills: {j.skills.join(', ')}</p>}<p className="mt-2 text-slate-500">Courses: {j.courseNames.join(', ') || 'All'} · Semesters: {j.eligibleSemesters.join(', ') || 'All'}</p></div>}
        {!j.eligible && !j.applicationStatus && <ul className="mt-3 list-disc pl-5 text-sm text-red-600">{j.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
        <div className="mt-4 flex gap-2"><button className="btn-outline" onClick={() => setOpen(open === j.id ? null : j.id)}>{open === j.id ? 'Hide details' : 'View details'}</button>
          {!j.applicationStatus && <button className="btn-primary" disabled={!j.eligible} onClick={() => setApply(j)}>Apply</button>}</div></div>))}</div>
    {apply && <Modal title={`Apply: ${apply.title}`} onClose={() => setApply(null)}><label className="block"><span className="mb-1.5 block text-sm font-medium">Cover note (optional)</span><textarea rows={4} maxLength={1000} className="input" value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <div className="mt-5 flex justify-end gap-2"><button className="btn-outline" onClick={() => setApply(null)}>Cancel</button><button className="btn-primary" disabled={busy} onClick={submit}>{busy ? 'Submitting…' : 'Submit application'}</button></div></Modal>}</div>);
}
