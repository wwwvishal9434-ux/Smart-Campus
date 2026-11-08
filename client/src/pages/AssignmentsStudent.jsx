import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../services/api.js';
import { downloadFile } from '../utils/download.js';
import { Badge, fmt, STATUS_TONE } from '../utils/format.jsx';
const EXT = ['pdf', 'doc', 'docx', 'zip', 'txt'];
function Card({ a, onDone }) {
  const [file, setFile] = useState(null); const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!file) return toast.error('Choose a file first'); if (!EXT.includes(file.name.split('.').pop().toLowerCase())) return toast.error(`Allowed types: ${EXT.join(', ')}`); if (file.size > 10485760) return toast.error('File must be 10 MB or smaller');
    const fd = new FormData(); fd.append('file', file); setBusy(true);
    try { const r = await api.post(`/assignments/${a.id}/submit`, fd); toast.success(r.data.message); setFile(null); onDone(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); } };
  return (<div className="card"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold">{a.title}</h3><p className="text-xs text-slate-500">{a.subjectCode} · Due {fmt(a.deadline)} · {a.maxMarks} marks</p></div>
    <Badge tone={a.overdue ? 'red' : STATUS_TONE[a.status]}>{a.overdue ? 'OVERDUE' : a.status}</Badge></div>
    <p className="mt-3 whitespace-pre-line text-sm text-slate-600 dark:text-slate-400">{a.instructions}</p>
    {a.referenceName && <button className="mt-2 text-sm font-semibold text-brand-600" onClick={() => downloadFile(`/assignments/${a.id}/reference`, a.referenceName)}>Download reference: {a.referenceName}</button>}
    {a.submission && <p className="mt-3 text-sm">Submitted <b>{a.submission.fileName}</b> on {fmt(a.submission.submittedAt)}</p>}
    {a.status === 'REVIEWED' && <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm dark:bg-green-950"><p className="font-semibold">Marks: {a.submission.marks} / {a.maxMarks}</p>{a.submission.feedback && <p className="mt-1">Feedback: {a.submission.feedback}</p>}</div>}
    {a.canSubmit ? (<div className="mt-4 flex flex-wrap gap-2"><input type="file" className="input min-w-[200px] flex-1" accept=".pdf,.doc,.docx,.zip,.txt" onChange={(e) => setFile(e.target.files[0])} />
      <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? 'Uploading…' : a.submission ? 'Resubmit' : 'Submit'}</button></div>)
      : a.status !== 'REVIEWED' && <p className="mt-3 text-sm text-red-600">Submissions are closed for this assignment.</p>}</div>);
}
export default function AssignmentsStudent() {
  const [rows, setRows] = useState(null); const [err, setErr] = useState(false);
  const load = useCallback(() => { setErr(false); api.get('/assignments/mine').then((r) => setRows(r.data.data)).catch(() => setErr(true)); }, []);
  useEffect(() => { load(); }, [load]);
  return (<div><h1 className="text-2xl font-bold">Assignments</h1><div className="mt-4 space-y-4">
    {err ? <p className="py-10 text-center text-sm">Could not load assignments. <button className="font-semibold text-brand-600" onClick={load}>Retry</button></p> : !rows ? <div className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      : !rows.length ? <p className="py-10 text-center text-sm text-slate-500">No assignments for your course and semester yet.</p> : rows.map((a) => <Card key={a.id} a={a} onDone={load} />)}</div></div>);
}
