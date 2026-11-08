import { useCallback, useEffect, useState } from 'react';
import { Download, FileText, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { downloadFile, fmtSize } from '../utils/download.js';
import Modal from '../components/Modal.jsx';
const OK_EXT = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'];
function UploadForm({ subjects, onDone }) {
  const [f, setF] = useState({ title: '', description: '', subjectId: '' }); const [file, setFile] = useState(null); const [busy, setBusy] = useState(false);
  const submit = async (e) => { e.preventDefault();
    if (f.title.trim().length < 3) return toast.error('Title must be at least 3 characters'); if (!f.subjectId) return toast.error('Select a subject');
    if (!file) return toast.error('Choose a file'); if (!OK_EXT.includes(file.name.split('.').pop().toLowerCase())) return toast.error(`Allowed types: ${OK_EXT.join(', ')}`);
    if (file.size > 10 * 1024 * 1024) return toast.error('File must be 10 MB or smaller');
    const fd = new FormData(); Object.entries(f).forEach(([k, v]) => v && fd.append(k, v)); fd.append('file', file); setBusy(true);
    try { await api.post('/notes', fd); toast.success('Note uploaded'); onDone(); } catch (er) { toast.error(errorMessage(er)); } finally { setBusy(false); } };
  return (<form onSubmit={submit} className="space-y-4">
    <label className="block"><span className="mb-1.5 block text-sm font-medium">Title *</span><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
    <label className="block"><span className="mb-1.5 block text-sm font-medium">Subject *</span><select className="input" value={f.subjectId} onChange={(e) => setF({ ...f, subjectId: e.target.value })}><option value="">Select…</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}</select></label>
    <label className="block"><span className="mb-1.5 block text-sm font-medium">Description</span><textarea rows={2} className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
    <label className="block"><span className="mb-1.5 block text-sm font-medium">File * (PDF, DOC, DOCX, PPT, PPTX, TXT, max 10 MB)</span><input type="file" className="input" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" onChange={(e) => setFile(e.target.files[0])} /></label>
    <button className="btn-primary w-full" disabled={busy}>{busy ? 'Uploading…' : 'Upload'}</button></form>);
}
export default function Notes() {
  const { user } = useAuth(); const admin = user.role === 'ADMIN';
  const [notes, setNotes] = useState(null); const [err, setErr] = useState(false); const [subjects, setSubjects] = useState([]);
  const [q, setQ] = useState(''); const [subjectId, setSubjectId] = useState(''); const [up, setUp] = useState(false); const [del, setDel] = useState(null);
  const load = useCallback(() => { setErr(false); api.get('/notes', { params: { q: q || undefined, subjectId: subjectId || undefined } }).then((r) => setNotes(r.data.data)).catch(() => setErr(true)); }, [q, subjectId]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);
  useEffect(() => { api.get('/subjects').then((r) => setSubjects(r.data.data)).catch(() => {}); }, []);
  const remove = async () => { try { await api.delete(`/notes/${del.id}`); toast.success('Note deleted'); setDel(null); load(); } catch (e) { toast.error(errorMessage(e)); setDel(null); } };
  return (<div><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Study Material</h1>{admin && <button className="btn-primary" onClick={() => setUp(true)}>Upload note</button>}</div>
    <div className="mt-4 flex flex-wrap gap-3"><input className="input min-w-[200px] flex-1" placeholder="Search by title…" value={q} onChange={(e) => setQ(e.target.value)} />
      <select className="input w-auto" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}><option value="">All subjects</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}</select></div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {err ? <p className="col-span-full py-10 text-center text-sm">Could not load notes. <button className="font-semibold text-brand-600" onClick={load}>Retry</button></p>
        : !notes ? [0, 1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)
        : !notes.length ? <p className="col-span-full py-10 text-center text-sm text-slate-500">No study material found.</p>
        : notes.map((n) => (<div key={n.id} className="card flex flex-col"><div className="flex gap-3"><FileText className="shrink-0 text-brand-600" /><div className="min-w-0"><h3 className="font-semibold">{n.title}</h3><p className="text-xs text-slate-500">{n.subjectCode} · Sem {n.semester} · {fmtSize(n.fileSize)}</p></div></div>
          {n.description && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{n.description}</p>}
          <div className="mt-auto flex gap-2 pt-4"><button className="btn-outline flex-1" onClick={() => downloadFile(`/notes/${n.id}/download`, n.fileName)}><Download size={16} /> Download</button>
            {admin && <button aria-label="Delete note" className="btn-outline text-red-600" onClick={() => setDel(n)}><Trash2 size={16} /></button>}</div></div>))}</div>
    {up && <Modal title="Upload study material" onClose={() => setUp(false)}><UploadForm subjects={subjects} onDone={() => { setUp(false); load(); }} /></Modal>}
    {del && <Modal title="Delete note?" onClose={() => setDel(null)}><p className="text-sm">"{del.title}" and its file will be permanently removed.</p><div className="mt-5 flex justify-end gap-2"><button className="btn-outline" onClick={() => setDel(null)}>Cancel</button><button className="btn bg-red-600 text-white hover:bg-red-700" onClick={remove}>Delete</button></div></Modal>}</div>);
}
