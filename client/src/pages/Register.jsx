import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Field from '../components/Field.jsx';
const schema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name'),
  email: z.string().trim().email('Enter a valid email'),
  enrollmentNo: z.string().trim().min(4, 'Enter your enrollment number'),
  courseId: z.string().min(1, 'Select a course'),
  semester: z.coerce.number().int().min(1, 'Select semester').max(6),
  phone: z.string().trim().regex(/^[0-9+\-\s]{10,15}$/, 'Enter a valid phone number'),
  password: z.string().min(8, 'At least 8 characters').regex(/[A-Z]/, 'Add an uppercase letter').regex(/[a-z]/, 'Add a lowercase letter').regex(/[0-9]/, 'Add a number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
export default function Register() {
  const { register: signUp, isAuthenticated } = useAuth();
  const nav = useNavigate();
  const [courses, setCourses] = useState({ state: 'loading', list: [] });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  useEffect(() => { api.get('/courses/public').then((r) => setCourses({ state: 'ready', list: r.data.data })).catch(() => setCourses({ state: 'error', list: [] })); }, []);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  const onSubmit = async (d) => { try { await signUp(d); toast.success('Registration successful'); nav('/dashboard', { replace: true }); } catch (e) { toast.error(errorMessage(e)); } };
  return (<div className="mx-auto max-w-2xl px-4 py-12"><div className="card">
    <h1 className="text-2xl font-bold">Student Registration</h1>
    {courses.state === 'error' && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">Could not load courses. Make sure the server is running, then refresh.</p>}
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 sm:grid-cols-2" noValidate>
      <Field label="Full name" error={errors.fullName?.message}><input className="input" {...register('fullName')} /></Field>
      <Field label="Email" error={errors.email?.message}><input type="email" className="input" {...register('email')} /></Field>
      <Field label="Enrollment number" error={errors.enrollmentNo?.message}><input className="input" {...register('enrollmentNo')} /></Field>
      <Field label="Phone" error={errors.phone?.message}><input type="tel" className="input" {...register('phone')} /></Field>
      <Field label="Course" error={errors.courseId?.message}><select className="input" defaultValue="" {...register('courseId')}><option value="" disabled>{courses.state === 'loading' ? 'Loading…' : 'Select course'}</option>{courses.list.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label="Semester" error={errors.semester?.message}><select className="input" defaultValue="" {...register('semester')}><option value="" disabled>Select semester</option>{[1, 2, 3, 4, 5, 6].map((s) => <option key={s} value={s}>Semester {s}</option>)}</select></Field>
      <Field label="Password" error={errors.password?.message}><input type="password" autoComplete="new-password" className="input" {...register('password')} /></Field>
      <Field label="Confirm password" error={errors.confirmPassword?.message}><input type="password" autoComplete="new-password" className="input" {...register('confirmPassword')} /></Field>
      <button className="btn-primary sm:col-span-2" disabled={isSubmitting || courses.state !== 'ready'}>{isSubmitting ? 'Creating account…' : 'Register'}</button>
    </form>
    <p className="mt-4 text-center text-sm text-slate-500">Already registered? <Link to="/login" className="font-semibold text-brand-600">Login</Link></p></div></div>);
}
