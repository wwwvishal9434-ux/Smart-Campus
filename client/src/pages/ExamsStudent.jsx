import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { Badge, fmt } from '../utils/format.jsx';
export default function ExamsStudent() {
  const [rows, setRows] = useState(null); const [err, setErr] = useState(false);
  useEffect(() => { api.get('/exams/mine').then((r) => setRows(r.data.data)).catch(() => setErr(true)); }, []);
  return (<div><h1 className="text-2xl font-bold">Examinations</h1><div className="mt-4 grid gap-4 md:grid-cols-2">
    {err ? <p className="col-span-full py-10 text-center text-sm">Could not load examinations. Please refresh.</p> : !rows ? <div className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      : !rows.length ? <p className="col-span-full py-10 text-center text-sm text-slate-500">No examinations available for you right now.</p> : rows.map((e) => (
      <div key={e.id} className="card flex flex-col"><div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold">{e.title}</h3><p className="text-xs text-slate-500">{e.subjectCode} · {e.durationMinutes} min · {e.totalMarks} marks · {e.questionCount} questions</p></div>
        <Badge tone={e.inProgress ? 'amber' : e.started ? 'green' : 'blue'}>{e.inProgress ? 'IN PROGRESS' : e.started ? 'AVAILABLE' : 'UPCOMING'}</Badge></div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{e.started ? 'Open since' : 'Opens'} {fmt(e.examDate)} · Attempts {e.attemptsUsed}/{e.maxAttempts}</p>
        {e.last && <p className="mt-2 text-sm">Last result: <b>{e.last.score}/{e.totalMarks}</b> ({e.last.percentage}%) <Badge tone={e.last.passed ? 'green' : 'red'}>{e.last.passed ? 'PASS' : 'FAIL'}</Badge></p>}
        <div className="mt-auto pt-4">{e.canStart ? <Link to={`/student/exams/${e.id}/take`} className="btn-primary w-full">{e.inProgress ? 'Resume exam' : 'Start exam'}</Link> : <button className="btn-outline w-full" disabled>{e.started ? 'No attempts left' : 'Not open yet'}</button>}</div></div>))}</div></div>);
}
