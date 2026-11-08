import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import api from '../services/api.js';
import { Badge } from '../utils/format.jsx';
const ET = { INTERNAL: 'Internal', PRACTICAL: 'Practical', MID_SEMESTER: 'Mid Semester', END_SEMESTER: 'End Semester' };
export default function ResultsStudent() {
  const [d, setD] = useState(null); const [err, setErr] = useState(false);
  useEffect(() => { api.get('/results/me').then((r) => setD(r.data.data)).catch(() => setErr(true)); }, []);
  if (err) return <p className="py-10 text-center text-sm">Could not load results. Please refresh.</p>;
  if (!d) return <div className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />;
  return (<div><div className="hidden print:block"><h1 className="text-center text-xl font-bold">DPBS College, Anupshahr — Result Report</h1><p className="text-center text-sm">{d.student.fullName} · {d.student.enrollmentNo} · {d.student.course}</p></div>
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden"><h1 className="text-2xl font-bold">My Results</h1>{!!d.semesters.length && <button className="btn-outline no-print" onClick={() => window.print()}><Printer size={16} /> Print report</button>}</div>
    {!d.semesters.length ? <p className="py-10 text-center text-sm text-slate-500">No results have been published for you yet.</p> : d.semesters.map((s) => (
      <div key={s.semester} className="card mt-4 overflow-x-auto p-0"><div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4"><h2 className="font-semibold">Semester {s.semester}</h2>
        <p className="text-sm">Total {s.totalObtained}/{s.totalMax} · {s.percentage}% · Grade <b>{s.grade}</b> · <Badge tone={s.result === 'PASS' ? 'green' : 'red'}>{s.result}</Badge></p></div>
        <table className="mt-2 w-full min-w-[520px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><tr><th className="px-4 py-2">Subject</th><th className="px-4 py-2">Exam</th><th className="px-4 py-2">Marks</th><th className="px-4 py-2">%</th><th className="px-4 py-2">Grade</th><th className="px-4 py-2">Result</th></tr></thead>
          <tbody>{s.items.map((r) => <tr key={r.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800"><td className="px-4 py-2">{r.subjectCode} - {r.subjectName}</td><td className="px-4 py-2">{ET[r.examType]}</td><td className="px-4 py-2">{r.obtainedMarks}/{r.maxMarks}</td><td className="px-4 py-2">{r.percentage}%</td><td className="px-4 py-2 font-semibold">{r.grade}</td><td className="px-4 py-2">{r.status}</td></tr>)}</tbody></table></div>))}
    <p className="mt-4 text-xs text-slate-500">Grade scale: {d.gradeScale.map((g) => `${g.grade} (${g.min}+)`).join(' · ')}. Pass mark: 40%.</p></div>);
}
