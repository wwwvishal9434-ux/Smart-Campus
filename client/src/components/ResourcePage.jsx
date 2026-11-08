import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../services/api.js';
import Modal from './Modal.jsx';
import Field from './Field.jsx';

function EditForm({ fields, row, opts, endpoint, singular, onSaved, onCancel, toForm, transform }) {
  const isEdit = !!row.id;
  const visible = fields.filter((f) => (isEdit ? !f.createOnly : !f.editOnly));
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: Object.fromEntries(visible.map((f) => [f.name, (toForm && row.id ? toForm(row) : row)[f.name] ?? (f.type === 'multicheck' ? [] : '')])) });
  const submit = async (d) => {
    const body = transform ? transform(d) : d;
    try { if (isEdit) await api.put(`${endpoint}/${row.id}`, body); else await api.post(endpoint, body); toast.success(`${singular} ${isEdit ? 'updated' : 'created'}`); onSaved(); }
    catch (e) { toast.error(errorMessage(e)); }
  };
  return (<form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
    {visible.map((f) => { const rules = { required: f.required && `${f.label} is required`, ...(f.type === 'password' && { minLength: { value: 8, message: 'At least 8 characters' } }), ...(f.type === 'email' && { pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } }) };
      const list = f.options || opts[f.name] || [];
      if (f.type === 'multicheck') return (<fieldset key={f.name}><legend className="mb-1.5 text-sm font-medium">{f.label}</legend><div className="flex flex-wrap gap-x-4 gap-y-2">{list.map((o) => <label key={o.value} className="flex items-center gap-1.5 text-sm"><input type="checkbox" value={o.value} {...register(f.name)} />{o.label}</label>)}</div><p className="mt-1 text-xs text-slate-500">Leave all unchecked to allow everyone.</p></fieldset>);
      return (<Field key={f.name} label={f.label + (f.required ? ' *' : '')} error={errors[f.name]?.message}>
        {f.type === 'select' ? (<select className="input" {...register(f.name, rules)}>{!f.required || !isEdit ? <option value="">{f.required ? 'Select…' : '— None —'}</option> : null}{list.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>)
          : f.type === 'textarea' ? <textarea rows={3} className="input" {...register(f.name, rules)} /> : <input type={f.type || 'text'} className="input" {...register(f.name, rules)} />}</Field>); })}
    <div className="flex justify-end gap-2 pt-2"><button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>
      <button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save'}</button></div></form>);
}

export default function ResourcePage({ title, singular, endpoint, columns, fields, filters = [], paged = false, toForm, transform }) {
  const [rows, setRows] = useState([]); const [meta, setMeta] = useState({ total: 0, pages: 1 }); const [state, setState] = useState('loading');
  const [q, setQ] = useState(''); const [query, setQuery] = useState(''); const [page, setPage] = useState(1); const [filt, setFilt] = useState({});
  const [opts, setOpts] = useState({}); const [editing, setEditing] = useState(null); const [del, setDel] = useState(null);
  useEffect(() => { const t = setTimeout(() => { setQuery(q); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);
  useEffect(() => { [...fields, ...filters].filter((f) => f.optionsFrom).forEach((f) => api.get(f.optionsFrom.url).then((r) => setOpts((o) => ({ ...o, [f.name]: r.data.data.map((x) => ({ value: x.id, label: x[f.optionsFrom.label] })) }))).catch(() => {})); }, []); // eslint-disable-line
  const load = useCallback(async () => {
    setState('loading');
    try { const r = await api.get(endpoint, { params: paged ? { q: query || undefined, page, ...filt } : filt }); const d = r.data.data;
      if (Array.isArray(d)) setRows(d); else { setRows(d.items); setMeta({ total: d.total, pages: d.pages }); } setState('ready'); }
    catch (e) { setState('error'); toast.error(errorMessage(e)); }
  }, [endpoint, paged, query, page, filt]);
  useEffect(() => { load(); }, [load]);
  const shown = paged || !q ? rows : rows.filter((r) => Object.values(r).join(' ').toLowerCase().includes(q.toLowerCase()));
  const remove = async () => { try { await api.delete(`${endpoint}/${del.id}`); toast.success(`${singular} deleted`); setDel(null); load(); } catch (e) { toast.error(errorMessage(e)); setDel(null); } };
  return (<div>
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">{title}</h1><button className="btn-primary" onClick={() => setEditing({})}><Plus size={16} /> Add {singular}</button></div>
    <div className="mt-4 flex flex-wrap gap-3">
      <div className="relative min-w-[200px] flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input className="input pl-9" placeholder={`Search ${title.toLowerCase()}…`} value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {filters.map((f) => (<select key={f.name} className="input w-auto" value={filt[f.name] || ''} onChange={(e) => { setFilt({ ...filt, [f.name]: e.target.value || undefined }); setPage(1); }}>
        <option value="">{f.label}: All</option>{(f.options || opts[f.name] || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>))}</div>
    <div className="card mt-4 overflow-x-auto p-0">
      {state === 'loading' ? <div className="space-y-3 p-6">{[0, 1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />)}</div>
        : state === 'error' ? <div className="p-10 text-center text-sm">Could not load data. <button className="font-semibold text-brand-600" onClick={load}>Retry</button></div>
        : shown.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No {title.toLowerCase()} found.</div>
        : (<table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><tr>{columns.map((c) => <th key={c.label} className="px-4 py-3">{c.label}</th>)}<th className="px-4 py-3 text-right">Actions</th></tr></thead>
          <tbody>{shown.map((r) => (<tr key={r.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">{columns.map((c) => <td key={c.label} className="px-4 py-3">{c.render ? c.render(r) : r[c.key] ?? '—'}</td>)}
            <td className="whitespace-nowrap px-4 py-3 text-right"><button aria-label="Edit" className="p-1.5 text-slate-500 hover:text-brand-600" onClick={() => setEditing(r)}><Pencil size={16} /></button>
              <button aria-label="Delete" className="p-1.5 text-slate-500 hover:text-red-600" onClick={() => setDel(r)}><Trash2 size={16} /></button></td></tr>))}</tbody></table>)}</div>
    {paged && state === 'ready' && (<div className="mt-3 flex items-center justify-between text-sm"><span className="text-slate-500">{meta.total} total</span>
      <div className="flex items-center gap-2"><button className="btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button><span>Page {page} of {meta.pages}</span><button className="btn-outline" disabled={page >= meta.pages} onClick={() => setPage(page + 1)}>Next</button></div></div>)}
    {editing && <Modal title={`${editing.id ? 'Edit' : 'Add'} ${singular}`} onClose={() => setEditing(null)}><EditForm toForm={toForm} transform={transform} fields={fields} row={editing} opts={opts} endpoint={endpoint} singular={singular} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} /></Modal>}
    {del && <Modal title={`Delete ${singular}?`} onClose={() => setDel(null)}><p className="text-sm">This will permanently delete this {singular.toLowerCase()} and cannot be undone.</p>
      <div className="mt-5 flex justify-end gap-2"><button className="btn-outline" onClick={() => setDel(null)}>Cancel</button><button className="btn bg-red-600 text-white hover:bg-red-700" onClick={remove}>Delete</button></div></Modal>}
  </div>);
}
