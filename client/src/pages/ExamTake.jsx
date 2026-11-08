import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../services/api.js';
import Modal from '../components/Modal.jsx';
import { Badge } from '../utils/format.jsx';
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
export default function ExamTake() {
  const { id } = useParams(); const [phase, setPhase] = useState('loading'); const [info, setInfo] = useState(null); const [run, setRun] = useState(null);
  const [idx, setIdx] = useState(0); const [answers, setAnswers] = useState({}); const [left, setLeft] = useState(0); const [confirm, setConfirm] = useState(false); const [result, setResult] = useState(null);
  const endAt = useRef(0); const sent = useRef(false); const ans = useRef({}); ans.current = answers;
  useEffect(() => { api.get('/exams/mine').then((r) => { const e = r.data.data.find((x) => x.id === id); if (!e) setPhase('missing'); else { setInfo(e); setPhase('intro'); } }).catch(() => setPhase('missing')); }, [id]);
  const start = async () => { try { const r = await api.post(`/exams/${id}/start`); setRun(r.data.data); endAt.current = Date.now() + r.data.data.remainingSeconds * 1000; setLeft(r.data.data.remainingSeconds); setPhase('run'); } catch (e) { toast.error(errorMessage(e)); } };
  const submit = useCallback(async (auto = false) => { if (sent.current || !run) return; sent.current = true; setConfirm(false);
    try { const r = await api.post(`/exams/attempts/${run.attemptId}/submit`, { answers: ans.current }); setResult(r.data.data); setPhase('done'); if (auto) toast('Time is up. Your exam was submitted automatically.'); }
    catch (e) { sent.current = false; toast.error(errorMessage(e)); } }, [run]);
  useEffect(() => { if (phase !== 'run') return; const t = setInterval(() => { const s = Math.max(0, Math.round((endAt.current - Date.now()) / 1000)); setLeft(s); if (s <= 0) submit(true); }, 1000); return () => clearInterval(t); }, [phase, submit]);
  useEffect(() => { if (phase !== 'run') return; const h = (e) => { e.preventDefault(); e.returnValue = ''; }; window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h); }, [phase]);
  if (phase === 'loading') return <div className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />;
  if (phase === 'missing') return <p className="py-10 text-center text-sm">Examination not found. <Link to="/student/exams" className="font-semibold text-brand-600">Back</Link></p>;
  if (phase === 'intro') return (<div className="card mx-auto max-w-xl"><h1 className="text-2xl font-bold">{info.title}</h1><p className="mt-1 text-sm text-slate-500">{info.durationMinutes} minutes · {info.totalMarks} marks · {info.questionCount} questions</p>
    <p className="mt-4 whitespace-pre-line text-sm">{info.instructions || 'Answer all questions. The exam is submitted automatically when the timer reaches zero.'}</p>
    <p className="mt-3 text-sm text-amber-600">Once you start, the timer keeps running even if you leave this page.</p><div className="mt-6 flex gap-2"><button className="btn-primary" onClick={start}>{info.inProgress ? 'Resume exam' : 'Start exam'}</button><Link to="/student/exams" className="btn-outline">Cancel</Link></div></div>);
  if (phase === 'done') return (<div className="card mx-auto max-w-md text-center"><h1 className="text-2xl font-bold">Exam submitted</h1>{result.timedOut && <p className="mt-1 text-sm text-red-600">Submitted after the time limit; answers were not counted.</p>}
    <p className="mt-4 text-4xl font-extrabold">{result.score} / {result.totalMarks}</p><p className="mt-1 text-slate-500">{result.percentage}%</p><div className="mt-3"><Badge tone={result.passed ? 'green' : 'red'}>{result.passed ? 'PASS' : 'FAIL'}</Badge></div>
    {result.correct !== undefined && <p className="mt-4 text-sm">Correct {result.correct} · Incorrect {result.incorrect} · Unanswered {result.unanswered}</p>}<Link to="/student/exams" className="btn-primary mt-6">Back to examinations</Link></div>);
  const q = run.questions[idx]; const answered = Object.keys(answers).length;
  return (<div className="mx-auto max-w-3xl"><div className="sticky top-0 z-10 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><span className="font-semibold">{run.title}</span>
    <span className={`font-mono text-lg font-bold ${left < 60 ? 'text-red-600' : ''}`} aria-live="off">{mmss(left)}</span></div>
    <div className="card mt-4"><p className="text-xs text-slate-500">Question {idx + 1} of {run.questions.length} · {q.marks} mark{q.marks > 1 ? 's' : ''}</p><h2 className="mt-2 text-lg font-semibold">{q.text}</h2>
      <div className="mt-4 space-y-2">{['A', 'B', 'C', 'D'].map((o) => (<label key={o} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${answers[q.id] === o ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30' : 'border-slate-200 dark:border-slate-700'}`}>
        <input type="radio" name={q.id} checked={answers[q.id] === o} onChange={() => setAnswers({ ...answers, [q.id]: o })} /><span><b>{o}.</b> {q['option' + o]}</span></label>))}</div>
      <div className="mt-5 flex justify-between"><button className="btn-outline" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>Previous</button>
        {idx < run.questions.length - 1 ? <button className="btn-primary" onClick={() => setIdx(idx + 1)}>Next</button> : <button className="btn-primary" onClick={() => setConfirm(true)}>Submit exam</button>}</div></div>
    <div className="card mt-4"><div className="flex flex-wrap gap-2">{run.questions.map((x, i) => <button key={x.id} onClick={() => setIdx(i)} aria-label={`Question ${i + 1}`} className={`h-9 w-9 rounded-lg border text-sm font-semibold ${i === idx ? 'border-brand-600 bg-brand-600 text-white' : answers[x.id] ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'border-slate-300 dark:border-slate-700'}`}>{i + 1}</button>)}</div>
      <button className="btn-outline mt-4" onClick={() => setConfirm(true)}>Submit exam</button></div>
    {confirm && <Modal title="Submit exam?" onClose={() => setConfirm(false)}><p className="text-sm">You answered {answered} of {run.questions.length} questions. You cannot change answers after submitting.</p><div className="mt-5 flex justify-end gap-2"><button className="btn-outline" onClick={() => setConfirm(false)}>Keep working</button><button className="btn-primary" onClick={() => submit(false)}>Submit</button></div></Modal>}</div>);
}
