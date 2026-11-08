import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../services/api.js';
import Field from '../components/Field.jsx';
export default function StudentProfile() {
  const [p, setP] = useState(null); const [err, setErr] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  useEffect(() => { api.get('/students/me').then((r) => { setP(r.data.data); reset({ fullName: r.data.data.fullName, phone: r.data.data.phone || '', address: r.data.data.address || '' }); }).catch(() => setErr(true)); }, [reset]);
  const save = async (d) => { try { const r = await api.patch('/students/me', d); setP(r.data.data); toast.success('Profile updated'); } catch (e) { toast.error(errorMessage(e)); } };
  if (err) return <p className="py-10 text-center text-sm">Could not load your profile. Please refresh.</p>;
  if (!p) return <div className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />;
  return (<div className="max-w-2xl"><h1 className="text-2xl font-bold">My Profile</h1>
    <div className="card mt-4 grid gap-2 text-sm sm:grid-cols-2">{[['Email', p.email], ['Enrollment no', p.enrollmentNo], ['Course', p.courseName], ['Semester', p.semester]].map(([k, v]) => <div key={k}><span className="text-slate-500">{k}: </span><span className="font-medium">{v}</span></div>)}</div>
    <form onSubmit={handleSubmit(save)} noValidate className="card mt-4 space-y-4">
      <Field label="Full name" error={errors.fullName?.message}><input className="input" {...register('fullName', { required: 'Name is required', minLength: { value: 2, message: 'Too short' } })} /></Field>
      <Field label="Phone" error={errors.phone?.message}><input className="input" {...register('phone', { pattern: { value: /^[0-9+\-\s]{10,15}$/, message: 'Enter a valid phone number' } })} /></Field>
      <Field label="Address" error={errors.address?.message}><textarea rows={3} className="input" {...register('address', { maxLength: { value: 200, message: 'Max 200 characters' } })} /></Field>
      <button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save changes'}</button></form></div>);
}
