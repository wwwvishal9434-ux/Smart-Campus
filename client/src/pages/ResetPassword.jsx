import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../services/api.js';
import Field from '../components/Field.jsx';
const schema = z.object({ password: z.string().min(8, 'At least 8 characters').regex(/[A-Z]/, 'Add an uppercase letter').regex(/[a-z]/, 'Add a lowercase letter').regex(/[0-9]/, 'Add a number'), confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
export default function ResetPassword() {
  const [params] = useSearchParams(); const token = params.get('token'); const nav = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  const onSubmit = async (d) => { try { await api.post('/auth/reset-password', { token, password: d.password }); toast.success('Password updated. Please log in.'); nav('/login'); } catch (e) { toast.error(errorMessage(e)); } };
  if (!token) return <p className="py-24 text-center">Invalid reset link. <Link to="/forgot-password" className="font-semibold text-brand-600">Request a new one</Link></p>;
  return (<div className="mx-auto max-w-md px-4 py-12"><div className="card"><h1 className="text-2xl font-bold">Set a new password</h1>
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
      <Field label="New password" error={errors.password?.message}><input type="password" autoComplete="new-password" className="input" {...register('password')} /></Field>
      <Field label="Confirm password" error={errors.confirmPassword?.message}><input type="password" autoComplete="new-password" className="input" {...register('confirmPassword')} /></Field>
      <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Reset password'}</button></form></div></div>);
}
