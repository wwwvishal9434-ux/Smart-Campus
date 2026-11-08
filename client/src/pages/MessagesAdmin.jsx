import { useCallback, useEffect, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../services/api.js';
import Modal from '../components/Modal.jsx';
import { Empty } from '../components/Stat.jsx';
import { Badge, fmt } from '../utils/format.jsx';
export default function MessagesAdmin() {
  const [rows, setRows] = useState(null); const [err, setErr] = useState(false); const [del, setDel] = useState(null);
  const load = useCallback(() => { setErr(false); api.get('/contact').then((r) => setRows(r.data.data)).catch(() => setErr(true)); }, []); useEffect(() => { load(); }, [load]);
  const read = async (m) => { try { await api.patch(`/contact/${m.id}/read`); load(); } catch (e) { toast.error(errorMessage(e)); } };
  const remove = async () => { try { await api.delete(`/contact/${del.id}`); toast.success('Message deleted'); setDel(null); load(); } catch (e) { toast.error(errorMessage(e)); setDel(null); } };
  return (<div><h1 className="text-2xl font-bold">Contact Messages</h1><div className="mt-4 space-y-3">
    {err ? <Empty>Could not load messages. <button className="font-semibold text-brand-600" onClick={load}>Retry</button></Empty> : !rows ? <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" /> : !rows.length ? <Empty>No messages yet.</Empty>
      : rows.map((m) => <div key={m.id} className={`card ${m.isRead ? '' : 'border-brand-500'}`}><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold">{m.subject} {!m.isRead && <Badge tone="blue">NEW</Badge>}</h3><p className="text-xs text-slate-500">{m.name} · <a className="text-brand-600" href={`mailto:${m.email}`}>{m.email}</a> · {fmt(m.createdAt)}</p></div>
        <div className="flex gap-2">{!m.isRead && <button className="btn-outline px-2.5 py-1.5" onClick={() => read(m)}><Check size={14} /> Mark read</button>}<button aria-label="Delete message" className="btn-outline px-2.5 py-1.5 text-red-600" onClick={() => setDel(m)}><Trash2 size={14} /></button></div></div>
        <p className="mt-2 whitespace-pre-line text-sm">{m.message}</p></div>)}</div>
    {del && <Modal title="Delete message?" onClose={() => setDel(null)}><p className="text-sm">This message from {del.name} will be permanently deleted.</p><div className="mt-5 flex justify-end gap-2"><button className="btn-outline" onClick={() => setDel(null)}>Cancel</button><button className="btn bg-red-600 text-white hover:bg-red-700" onClick={remove}>Delete</button></div></Modal>}</div>);
}
