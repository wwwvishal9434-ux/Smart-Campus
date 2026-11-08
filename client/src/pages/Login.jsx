import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errorMessage } from '../services/api.js';
import Field from '../components/Field.jsx';
const schema = z.object({ email: z.string().trim().email('Enter a valid email'), password: z.string().min(1, 'Password is required') });
export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const nav = useNavigate(); const loc = useLocation();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  const onSubmit = async (d) => { try { const u = await login(d); toast.success('Welcome back!'); nav(loc.state?.from?.pathname || '/dashboard', { replace: true }); return u; } catch (e) { toast.error(errorMessage(e)); } };
  return (<div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-12"><div className="card w-full">
    <h1 className="text-2xl font-bold">Login</h1><p className="mt-1 text-sm text-slate-500">Students and administrators sign in here.</p>
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
      <Field label="Email" error={errors.email?.message}><input type="email" autoComplete="email" className="input" {...register('email')} /></Field>
      <Field label="Password" error={errors.password?.message}><input type="password" autoComplete="current-password" className="input" {...register('password')} /></Field>
      <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Login'}</button>
      <p className="text-center text-sm"><Link to="/forgot-password" className="text-brand-600">Forgot password?</Link></p>
    </form>
    <p className="mt-4 text-center text-sm text-slate-500">New student? <Link to="/register" className="font-semibold text-brand-600">Register</Link></p></div></div>);
}
