import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../services/api.js';
import Modal from '../components/Modal.jsx';
import { Badge, fmt, toInput } from '../utils/format.jsx';
const Lbl = ({ t, children }) => <label className="block"><span className="mb-1.5 block text-sm font-medium">{t}</span>{children}</label>;
function ExamForm({ exam, subjects, onDone }) {
  const [f, setF] = useState(exam ? { ...exam, examDate: toInput(exam.examDate), instructions: exam.instructions || '' } : { subjectId: '', title: '', instructions: '', examDate: '', durationMinutes: 30, totalMarks: 10, passingMarks: 4, maxAttempts: 1, showAnswers: false });
  const [busy, setBusy] = useState(false); const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const submit = async (e) => { e.preventDefault();
    if (!f.subjectId) return toast.error('Select a subject'); if (f.title.trim().length < 3) return toast.error('Title is too short'); if (!f.examDate) return toast.error('Choose date and time');
    if (!(+f.durationMinutes >= 1) || !(+f.totalMarks >= 1) || +f.passingMarks < 0) return toast.error('Check duration and marks'); if (+f.passingMarks > +f.totalMarks) return toast.error('Passing marks cannot exceed total marks');
    const body = { subjectId: f.subjectId, title: f.title, instructions: f.instructions, examDate: new Date(f.examDate).toISOString(), durationMinutes: +f.durationMinutes, totalMarks: +f.totalMarks, passingMarks: +f.passingMarks, maxAttempts: +f.maxAttempts, showAnswers: !!f.showAnswers }; setBusy(true);
    try { if (exam) await api.put(`/exams/${exam.id}`, body); else await api.post('/exams', body); toast.success(exam ? 'Examination updated' : 'Examination created'); onDone(); } catch (er) { toast.error(errorMessage(er)); } finally { setBusy(false); } };
  return (<form onSubmit={submit} className="space-y-4"><Lbl t="Subject *"><select className="input" value={f.subjectId} onChange={set('subjectId')}><option value="">Select…</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name} (Sem {s.semester})</option>)}</select></Lbl>
    <Lbl t="Title *"><input className="input" value={f.title} onChange={set('title')} /></Lbl><Lbl t="Instructions"><textarea rows={2} className="input" value={f.instructions} onChange={set('instructions')} /></Lbl>
    <Lbl t="Available from *"><input type="datetime-local" className="input" value={f.examDate} onChange={set('examDate')} /></Lbl>
    <div className="grid grid-cols-2 gap-4"><Lbl t="Duration (min) *"><input type="number" min="1" className="input" value={f.durationMinutes} onChange={set('durationMinutes')} /></Lbl><Lbl t="Max attempts"><input type="number" min="1" max="5" className="input" value={f.maxAttempts} onChange={set('maxAttempts')} /></Lbl>
      <Lbl t="Total marks *"><input type="number" min="1" className="input" value={f.totalMarks} onChange={set('totalMarks')} /></Lbl><Lbl t="Passing marks *"><input type="number" min="0" className="input" value={f.passingMarks} onChange={set('passingMarks')} /></Lbl></div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.showAnswers} onChange={set('showAnswers')} /> Show correct/incorrect counts after submission</label>
    <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save examination'}</button></form>);
}
function Questions({ exam }) {
  const blank = { text: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', marks: 1 };
  const [qs, setQs] = useState(null); const [f, setF] = useState(blank); const [busy, setBusy] = useState(false);
  const load = useCallback(() => api.get(`/exams/${exam.id}/questions`).then((r) => setQs(r.data.data)).catch((e) => toast.error(errorMessage(e))), [exam.id]); useEffect(() => { load(); }, [load]);
  const add = async (e) => { e.preventDefault(); if (f.text.trim().length < 5 || ['optionA', 'optionB', 'optionC', 'optionD'].some((k) => !f[k].trim())) return toast.error('Fill the question and all four options'); setBusy(true);
    try { await api.post(`/exams/${exam.id}/questions`, { ...f, marks: +f.marks }); toast.success('Question added'); setF(blank); load(); } catch (er) { toast.error(errorMessage(er)); } finally { setBusy(false); } };
  const del = async (id) => { try { await api.delete(`/exams/questions/${id}`); load(); } catch (er) { toast.error(errorMessage(er)); } };
  return (<div className="max-h-[70vh] space-y-4 overflow-y-auto"><p className="text-sm text-slate-500">Question marks must add up to {exam.totalMarks} before you can publish. Current: {qs ? qs.reduce((a, q) => a + q.marks, 0) : '…'}</p>
    {qs?.map((q, i) => <div key={q.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800"><div className="flex justify-between gap-2"><p className="font-medium">{i + 1}. {q.text} <span className="text-slate-500">({q.marks})</span></p><button aria-label="Remove question" onClick={() => del(q.id)} className="text-slate-500 hover:text-red-600"><Trash2 size={15} /></button></div>
      <ul className="mt-1 grid gap-x-4 sm:grid-cols-2">{['A', 'B', 'C', 'D'].map((o) => <li key={o} className={q.correctOption === o ? 'font-semibold text-green-600' : ''}>{o}. {q['option' + o]}</li>)}</ul></div>)}
    <form onSubmit={add} className="space-y-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50"><textarea rows={2} placeholder="Question *" className="input" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} />
      <div className="grid gap-2 sm:grid-cols-2">{['A', 'B', 'C', 'D'].map((o) => <input key={o} placeholder={`Option ${o} *`} className="input" value={f['option' + o]} onChange={(e) => setF({ ...f, ['option' + o]: e.target.value })} />)}</div>
      <div className="flex flex-wrap items-center gap-2"><select className="input w-auto" value={f.correctOption} onChange={(e) => setF({ ...f, correctOption: e.target.value })}>{['A', 'B', 'C', 'D'].map((o) => <option key={o} value={o}>Correct: {o}</option>)}</select>
        <input type="number" min="1" className="input w-24" value={f.marks} onChange={(e) => setF({ ...f, marks: e.target.value })} aria-label="Marks" /><button className="btn-primary" disabled={busy}>Add question</button></div></form></div>);
}
export default function ExamsAdmin() {
  const [rows, setRows] = useState(null); const [err, setErr] = useState(false); const [subjects, setSubjects] = useState([]); const [form, setForm] = useState(null); const [qm, setQm] = useState(null); const [del, setDel] = useState(null);
  const load = useCallback(() => { setErr(false); api.get('/exams').then((r) => setRows(r.data.data)).catch(() => setErr(true)); }, []);
  useEffect(() => { load(); api.get('/subjects').then((r) => setSubjects(r.data.data)).catch(() => {}); }, [load]);
  const toggle = async (e) => { try { await api.put(`/exams/${e.id}`, { isPublished: !e.isPublished }); toast.success(e.isPublished ? 'Unpublished' : 'Published'); load(); } catch (er) { toast.error(errorMessage(er)); } };
  const remove = async () => { try { await api.delete(`/exams/${del.id}`); toast.success('Examination deleted'); setDel(null); load(); } catch (e) { toast.error(errorMessage(e)); setDel(null); } };
  return (<div><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Examinations</h1><button className="btn-primary" onClick={() => setForm({})}>Create examination</button></div>
    <div className="card mt-4 overflow-x-auto p-0">{err ? <p className="p-10 text-center text-sm">Could not load. <button className="font-semibold text-brand-600" onClick={load}>Retry</button></p> : !rows ? <div className="h-32 animate-pulse" /> : !rows.length ? <p className="p-10 text-center text-sm text-slate-500">No examinations yet.</p> : (
      <table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Available from</th><th className="px-4 py-3">Min / Marks</th><th className="px-4 py-3">Qs</th><th className="px-4 py-3">Attempts</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
        <tbody>{rows.map((e) => <tr key={e.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800"><td className="px-4 py-3 font-medium">{e.title}</td><td className="px-4 py-3">{e.subjectCode}</td><td className="px-4 py-3">{fmt(e.examDate)}</td><td className="px-4 py-3">{e.durationMinutes} / {e.totalMarks}</td><td className="px-4 py-3">{e.questionCount}</td><td className="px-4 py-3">{e.attemptCount}</td>
          <td className="px-4 py-3"><Badge tone={e.isPublished ? 'green' : 'slate'}>{e.isPublished ? 'PUBLISHED' : 'DRAFT'}</Badge></td>
          <td className="whitespace-nowrap px-4 py-3 text-right"><button className="btn-outline mr-1 px-2.5 py-1.5" onClick={() => setQm(e)}>Questions</button><button className="btn-outline mr-1 px-2.5 py-1.5" onClick={() => toggle(e)}>{e.isPublished ? 'Unpublish' : 'Publish'}</button>
            <button className="btn-outline mr-1 px-2.5 py-1.5" onClick={() => setForm(e)}>Edit</button><button aria-label="Delete" className="p-1.5 text-slate-500 hover:text-red-600" onClick={() => setDel(e)}><Trash2 size={16} /></button></td></tr>)}</tbody></table>)}</div>
    {form && <Modal title={form.id ? 'Edit examination' : 'Create examination'} onClose={() => setForm(null)}><ExamForm exam={form.id ? form : null} subjects={subjects} onDone={() => { setForm(null); load(); }} /></Modal>}
    {qm && <Modal title={`Questions: ${qm.title}`} onClose={() => { setQm(null); load(); }}><Questions exam={qm} /></Modal>}
    {del && <Modal title="Delete examination?" onClose={() => setDel(null)}><p className="text-sm">"{del.title}", its questions and all student attempts will be deleted.</p><div className="mt-5 flex justify-end gap-2"><button className="btn-outline" onClick={() => setDel(null)}>Cancel</button><button className="btn bg-red-600 text-white hover:bg-red-700" onClick={remove}>Delete</button></div></Modal>}</div>);
}
