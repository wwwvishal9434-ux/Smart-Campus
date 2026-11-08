import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, CalendarDays, CheckCircle2, ClipboardCheck, FileText, GraduationCap, LineChart, PenSquare, ShieldCheck, UserCheck } from 'lucide-react';
const features = [
  [UserCheck, 'Attendance', 'Subject-wise marking with automatic percentage and monthly history.'],
  [FileText, 'Study Material', 'Upload and download PDF notes, organised by subject and semester.'],
  [ClipboardCheck, 'Assignments', 'Publish tasks, accept submissions before deadlines, review with marks and feedback.'],
  [PenSquare, 'Online Exams', 'Timed MCQ tests with server-side scoring and auto-submit.'],
  [LineChart, 'Results', 'Marks, percentage and grade calculation with printable reports.'],
  [Briefcase, 'Placements', 'Companies, jobs, eligibility checks and application status tracking.'],
  [CalendarDays, 'Notices & Events', 'Targeted notifications and an upcoming-events calendar.'],
  [ShieldCheck, 'Secure Access', 'JWT login with separate Student and Admin permissions.'],
];
const stages = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected'];
const stack = ['React + Vite', 'Tailwind CSS', 'Node.js + Express', 'PostgreSQL', 'Prisma ORM', 'JWT + bcrypt'];
const fade = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.4 } };
const Section = ({ id, title, sub, children }) => (
  <section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
    <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>{sub && <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">{sub}</p>}<div className="mt-8">{children}</div>
  </section>);
export default function Landing() {
  return (<div id="top">
    <div className="bg-gradient-to-b from-brand-50 to-slate-50 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2">
        <motion.div {...fade}>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"><GraduationCap size={14} /> BCA Final Year Project</span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Smart Campus</h1>
          <p className="mt-2 text-xl font-semibold text-brand-600">Student Placement &amp; College Management System</p>
          <p className="mt-4 text-slate-600 dark:text-slate-400">One platform for attendance, study material, assignments, online exams, results and campus placements — for students and administrators.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/register" className="btn-primary">Student Registration</Link><Link to="/login" className="btn-outline">Login</Link></div>
        </motion.div>
        <motion.div {...fade} className="card">
          <h3 className="font-semibold">Placement workflow</h3><p className="mt-1 text-sm text-slate-500">Every application moves through clear stages students can track.</p>
          <ol className="mt-5 space-y-3">{stages.map((s, i) => (<li key={s} className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span><span className="text-sm font-medium">{s}</span></li>))}</ol>
        </motion.div>
      </div></div>
    <Section id="features" title="Everything a college needs" sub="Twelve connected modules, split between a Student portal and an Admin console.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{features.map(([Icon, t, d]) => (
        <motion.div key={t} {...fade} className="card"><Icon className="text-brand-600" /><h3 className="mt-3 font-semibold">{t}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{d}</p></motion.div>))}</div>
    </Section>
    <Section id="about" title="About the project" sub="Colleges often track attendance, notes, exams and placements on paper or scattered tools. Smart Campus brings them into one secure, database-backed system.">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card"><h3 className="font-semibold">Objectives</h3><ul className="mt-3 space-y-2 text-sm">{['Digitise academic record keeping', 'Give students self-service access to their own data', 'Streamline campus recruitment and application tracking', 'Enforce role-based security on every request'].map((x) => (<li key={x} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-600" />{x}</li>))}</ul></div>
        <div className="card"><h3 className="font-semibold">Technology</h3><div className="mt-3 flex flex-wrap gap-2">{stack.map((s) => <span key={s} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium dark:bg-slate-800">{s}</span>)}</div></div>
      </div>
    </Section>
  </div>);
}
