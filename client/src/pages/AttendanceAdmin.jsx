import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../services/api.js';
const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
const today = () => new Date().toISOString().slice(0, 10);
export default function AttendanceAdmin() {
  const [subjects, setSubjects] = useState([]); const [subjectId, setSubjectId] = useState(''); const [date, setDate] = useState(today());
  const [tab, setTab] = useState('mark'); const [rows, setRows] = useState(null); const [busy, setBusy] = useState(false);
  useEffect(() => { api.get('/subjects').then((r) => setSubjects(r.data.data)).catch((e) => toast.error(errorMessage(e))); }, []);
  useEffect(() => setRows(null), [tab, subjectId, date]);
  const load = async () => { if (!subjectId) return toast.error('Select a subject first'); setBusy(true);
    try { const r = await api.get(tab === 'mark' ? '/attendance/sheet' : '/attendance/report', { params: { subjectId, date } }); setRows(r.data.data.map((s) => ({ ...s, status: s.status || 'PRESENT' }))); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); } };
  const save = async () => { setBusy(true);
    try { await api.post('/attendance/mark', { subjectId, date, records: rows.map((r) => ({ studentId: r.id, status: r.status })) }); toast.success('Attendance saved'); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); } };
  const set = (id, status) => setRows(rows.map((r) => (r.id === id ? { ...r, status } : r)));
  return (<div><h1 className="text-2xl font-bold">Attendance</h1>
    <div className="mt-4 flex gap-2">{[['mark', 'Mark attendance'], ['report', 'Report']].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={tab === k ? 'btn-primary' : 'btn-outline'}>{l}</button>)}</div>
    <div className="card mt-4 flex flex-wrap items-end gap-3">
      <label className="min-w-[220px] flex-1"><span className="mb-1.5 block text-sm font-medium">Subject</span><select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}><option value="">Select subject…</option>
        {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name} (Sem {s.semester})</option>)}</select></label>
      {tab === 'mark' && <label><span className="mb-1.5 block text-sm font-medium">Date</span><input type="date" max={today()} className="input" value={date} onChange={(e) => setDate(e.target.value)} /></label>}
      <button className="btn-primary" onClick={load} disabled={busy}>{busy && !rows ? 'Loading…' : tab === 'mark' ? 'Load students' : 'Show report'}</button></div>
    {rows && (rows.length === 0 ? <p className="mt-6 text-center text-sm text-slate-500">No active students enrolled for this subject's course and semester.</p> : (
      <div className="card mt-4 overflow-x-auto p-0"><table className="w-full min-w-[520px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
        <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Enrollment</th><th className="px-4 py-3">{tab === 'mark' ? 'Status' : 'Attended / Total'}</th>{tab === 'report' && <th className="px-4 py-3">%</th>}</tr></thead>
        <tbody>{rows.map((r) => (<tr key={r.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800"><td className="px-4 py-3">{r.fullName}</td><td className="px-4 py-3">{r.enrollmentNo}</td>
          {tab === 'mark' ? <td className="px-4 py-3"><select className="input w-auto py-1.5" value={r.status} onChange={(e) => set(r.id, e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td>
            : <><td className="px-4 py-3">{r.attended} / {r.total}</td><td className={`px-4 py-3 font-semibold ${r.total && r.percentage < 75 ? 'text-red-600' : ''}`}>{r.percentage}%</td></>}</tr>))}</tbody></table>
        {tab === 'mark' && <div className="flex justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800"><button className="btn-outline" onClick={() => setRows(rows.map((r) => ({ ...r, status: 'PRESENT' })))}>Mark all present</button>
          <button className="btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save attendance'}</button></div>}</div>))}</div>);
}
