import { useCallback, useEffect, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../services/api.js';
import Modal from '../components/Modal.jsx';
import { downloadFile } from '../utils/download.js';
import { Badge, fmt, STATUS_TONE } from '../utils/format.jsx';
const EXT = ['pdf', 'doc', 'docx', 'zip', 'txt'];
const Lbl = ({ t, children }) => <label className="block"><span className="mb-1.5 block text-sm font-medium">{t}</span>{children}</label>;
function CreateForm({ subjects, onDone }) {
  const [f, setF] = useState({ subjectId: '', title: '', instructions: '', deadline: '', maxMarks: 10, allowLate: false }); const [file, setFile] = useState(null); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const submit = async (e) => { e.preventDefault();
    if (!f.subjectId) return toast.error('Select a subject'); if (f.title.trim().length < 3) return toast.error('Title is too short'); if (f.instructions.trim().length < 5) return toast.error('Add instructions');
    if (!f.deadline || new Date(f.deadline) <= new Date()) return toast.error('Deadline must be in the future'); if (!(f.maxMarks >= 1)) return toast.error('Enter maximum marks');
    if (file && (!EXT.includes(file.name.split('.').pop().toLowerCase()) || file.size > 10485760)) return toast.error(`Reference file: ${EXT.join(', ')} up to 10 MB`);
    const fd = new FormData(); fd.append('subjectId', f.subjectId); fd.append('title', f.title); fd.append('instructions', f.instructions); fd.append('deadline', new Date(f.deadline).toISOString());
    fd.append('maxMarks', f.maxMarks); fd.append('allowLate', String(f.allowLate)); if (file) fd.append('file', file); setBusy(true);
    try { await api.post('/assignments', fd); toast.success('Assignment published'); onDone(); } catch (er) { toast.error(errorMessage(er)); } finally { setBusy(false); } };
  return (<form onSubmit={submit} className="space-y-4">
    <Lbl t="Subject *"><select className="input" value={f.subjectId} onChange={set('subjectId')}><option value="">Select…</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name} (Sem {s.semester})</option>)}</select></Lbl>
    <Lbl t="Title *"><input className="input" value={f.title} onChange={set('title')} /></Lbl>
    <Lbl t="Instructions *"><textarea rows={3} className="input" value={f.instructions} onChange={set('instructions')} /></Lbl>
    <div className="grid gap-4 sm:grid-cols-2"><Lbl t="Deadline *"><input type="datetime-local" className="input" value={f.deadline} onChange={set('deadline')} /></Lbl><Lbl t="Maximum marks *"><input type="number" min="1" className="input" value={f.maxMarks} onChange={set('maxMarks')} /></Lbl></div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.allowLate} onChange={set('allowLate')} /> Allow late submissions (marked LATE)</label>
    <Lbl t="Reference file (optional)"><input type="file" className="input" accept=".pdf,.doc,.docx,.zip,.txt" onChange={(e) => setFile(e.target.files[0])} /></Lbl>
    <button className="btn-primary w-full" disabled={busy}>{busy ? 'Publishing…' : 'Publish assignment'}</button></form>);
}
function Review({ row, max, onDone }) {
  const [marks, setMarks] = useState(row.submission.marks ?? ''); const [fb, setFb] = useState(row.submission.feedback || ''); const [busy, setBusy] = useState(false);
  const save = async () => { if (marks === '' || +marks < 0 || +marks > max) return toast.error(`Marks must be between 0 and ${max}`); setBusy(true);
    try { await api.patch(`/assignments/submissions/${row.submission.id}/review`, { marks: +marks, feedback: fb }); toast.success('Reviewed'); onDone(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); } };
  return (<div className="flex flex-wrap items-end gap-2"><input type="number" min="0" max={max} placeholder={`/${max}`} className="input w-24" value={marks} onChange={(e) => setMarks(e.target.value)} />
    <input placeholder="Feedback" className="input min-w-[160px] flex-1" value={fb} onChange={(e) => setFb(e.target.value)} /><button className="btn-primary" onClick={save} disabled={busy}>Save</button></div>);
}
function Submissions({ id }) {
  const [d, setD] = useState(null); const load = useCallback(() => api.get(`/assignments/${id}/submissions`).then((r) => setD(r.data.data)).catch((e) => toast.error(errorMessage(e))), [id]);
  useEffect(() => { load(); }, [load]);
  if (!d) return <div className="h-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />;
  if (!d.rows.length) return <p className="text-sm text-slate-500">No eligible students for this assignment.</p>;
  return (<div className="max-h-[60vh] space-y-3 overflow-y-auto">{d.rows.map((r) => (<div key={r.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{r.fullName}</p><p className="text-xs text-slate-500">{r.enrollmentNo}{r.submission && ` · ${fmt(r.submission.submittedAt)}`}</p></div>
      <div className="flex items-center gap-2"><Badge tone={STATUS_TONE[r.submission?.status || 'PENDING']}>{r.submission?.status || 'PENDING'}</Badge>
        {r.submission && <button aria-label="Download submission" className="btn-outline px-2 py-1" onClick={() => downloadFile(`/assignments/submissions/${r.submission.id}/download`, r.submission.fileName)}><Download size={14} /></button>}</div></div>
    {r.submission && <div className="mt-3"><Review row={r} max={d.assignment.maxMarks} onDone={load} /></div>}</div>))}</div>);
}
export default function AssignmentsAdmin() {
  const [rows, setRows] = useState(null); const [err, setErr] = useState(false); const [subjects, setSubjects] = useState([]); const [create, setCreate] = useState(false); const [view, setView] = useState(null); const [del, setDel] = useState(null);
  const load = useCallback(() => { setErr(false); api.get('/assignments').then((r) => setRows(r.data.data)).catch(() => setErr(true)); }, []);
  useEffect(() => { load(); api.get('/subjects').then((r) => setSubjects(r.data.data)).catch(() => {}); }, [load]);
  const remove = async () => { try { await api.delete(`/assignments/${del.id}`); toast.success('Assignment deleted'); setDel(null); load(); } catch (e) { toast.error(errorMessage(e)); setDel(null); } };
  return (<div><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Assignments</h1><button className="btn-primary" onClick={() => setCreate(true)}>Create assignment</button></div>
    <div className="card mt-4 overflow-x-auto p-0">{err ? <p className="p-10 text-center text-sm">Could not load. <button className="font-semibold text-brand-600" onClick={load}>Retry</button></p> : !rows ? <div className="h-32 animate-pulse" />
      : !rows.length ? <p className="p-10 text-center text-sm text-slate-500">No assignments yet.</p> : (<table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Deadline</th><th className="px-4 py-3">Submissions</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
        <tbody>{rows.map((a) => <tr key={a.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800"><td className="px-4 py-3 font-medium">{a.title}</td><td className="px-4 py-3">{a.subjectCode}</td><td className="px-4 py-3">{fmt(a.deadline)}</td><td className="px-4 py-3">{a.submissionCount}</td>
          <td className="whitespace-nowrap px-4 py-3 text-right"><button className="btn-outline mr-2 px-3 py-1.5" onClick={() => setView(a)}>Submissions</button><button aria-label="Delete" className="p-1.5 text-slate-500 hover:text-red-600" onClick={() => setDel(a)}><Trash2 size={16} /></button></td></tr>)}</tbody></table>)}</div>
    {create && <Modal title="Create assignment" onClose={() => setCreate(false)}><CreateForm subjects={subjects} onDone={() => { setCreate(false); load(); }} /></Modal>}
    {view && <Modal title={`Submissions: ${view.title}`} onClose={() => { setView(null); load(); }}><Submissions id={view.id} /></Modal>}
    {del && <Modal title="Delete assignment?" onClose={() => setDel(null)}><p className="text-sm">"{del.title}" and all student submissions will be permanently deleted.</p><div className="mt-5 flex justify-end gap-2"><button className="btn-outline" onClick={() => setDel(null)}>Cancel</button><button className="btn bg-red-600 text-white hover:bg-red-700" onClick={remove}>Delete</button></div></Modal>}</div>);
}
