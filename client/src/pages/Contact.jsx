import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { MapPin } from 'lucide-react';
import api, { errorMessage } from '../services/api.js';
import Field from '../components/Field.jsx';
const schema = z.object({ name: z.string().trim().min(2, 'Enter your name'), email: z.string().trim().email('Enter a valid email'),
  subject: z.string().trim().min(3, 'Enter a subject'), message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000) });
export default function Contact() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  const onSubmit = async (d) => { try { const r = await api.post('/contact', d); toast.success(r.data.message); reset(); } catch (e) { toast.error(errorMessage(e)); } };
  return (<div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-5">
    <div className="md:col-span-2"><h1 className="text-3xl font-bold">Contact us</h1><p className="mt-2 text-slate-600 dark:text-slate-400">Questions about Smart Campus? Send a message and the administrator will see it in the admin console.</p>
      <div className="card mt-6 flex gap-3"><MapPin className="shrink-0 text-brand-600" /><p className="text-sm">DPBS College<br />Anupshahr, Bulandshahr<br />Uttar Pradesh - 203390</p></div></div>
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-4 md:col-span-3">
      <Field label="Name" error={errors.name?.message}><input className="input" {...register('name')} /></Field>
      <Field label="Email" error={errors.email?.message}><input type="email" className="input" {...register('email')} /></Field>
      <Field label="Subject" error={errors.subject?.message}><input className="input" {...register('subject')} /></Field>
      <Field label="Message" error={errors.message?.message}><textarea rows={5} className="input" {...register('message')} /></Field>
      <button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Sending…' : 'Send message'}</button></form></div>);
}
