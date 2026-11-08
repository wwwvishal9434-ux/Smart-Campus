import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../services/api.js';
import Field from '../components/Field.jsx';
export default function ForgotPassword() {
  const [devUrl, setDevUrl] = useState(null); const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const onSubmit = async (d) => { try { const r = await api.post('/auth/forgot-password', d); setDevUrl(r.data.data.resetUrl || null); setSent(true); toast.success(r.data.message); } catch (e) { toast.error(errorMessage(e)); } };
  return (<div className="mx-auto max-w-md px-4 py-12"><div className="card"><h1 className="text-2xl font-bold">Forgot password</h1>
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
      <Field label="Registered email" error={errors.email && 'Enter your email'}><input type="email" className="input" {...register('email', { required: true })} /></Field>
      <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : 'Generate reset link'}</button></form>
    {sent && !devUrl && <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">If that email is registered, a reset link has been issued.</p>}
    {devUrl && <p className="mt-4 break-all rounded-lg bg-amber-50 p-3 text-xs dark:bg-amber-950">Development mode (no email service yet): <a className="font-semibold text-brand-600 underline" href={devUrl}>open reset link</a></p>}
    <p className="mt-4 text-center text-sm"><Link to="/login" className="font-semibold text-brand-600">Back to login</Link></p></div></div>);
}
