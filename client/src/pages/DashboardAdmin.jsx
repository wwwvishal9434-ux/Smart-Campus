import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Briefcase, Building2, CalendarCheck, ClipboardList, GraduationCap, ListChecks, Mail, PenSquare, Presentation, BookOpen, Trophy, Users } from 'lucide-react';
import api from '../services/api.js';
import { Empty, Panel, Stat } from '../components/Stat.jsx';
import { Badge, fmt } from '../utils/format.jsx';
const Chart = ({ data, x, y, line, color = '#2563eb' }) => data.length ? (<div className="h-56"><ResponsiveContainer>{line ? <LineChart data={data}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey={x} /><YAxis domain={[0, 100]} /><Tooltip /><Line type="monotone" dataKey={y} stroke={color} strokeWidth={2} /></LineChart>
  : <BarChart data={data}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey={x} tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey={y} fill={color} radius={[4, 4, 0, 0]} /></BarChart>}</ResponsiveContainer></div>) : <Empty>No data yet.</Empty>;
export default function DashboardAdmin() {
  const [d, setD] = useState(null); const [err, setErr] = useState(false);
  useEffect(() => { api.get('/dashboard/admin').then((r) => setD(r.data.data)).catch(() => setErr(true)); }, []);
  if (err) return <p className="py-10 text-center text-sm">Could not load the dashboard. Please refresh.</p>;
  if (!d) return <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>;
  const t = d.totals;
  return (<div className="space-y-6"><h1 className="text-2xl font-bold">Administrator Dashboard</h1>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
      <Stat icon={Users} label="Students" value={t.students} to="/admin/students" /><Stat icon={Presentation} label="Teachers" value={t.teachers} to="/admin/teachers" /><Stat icon={BookOpen} label="Courses" value={t.courses} to="/admin/courses" />
      <Stat icon={CalendarCheck} label="Average attendance" value={`${t.averageAttendance}%`} to="/admin/attendance" /><Stat icon={ClipboardList} label="Pending reviews" value={t.pendingReviews} sub="submissions" to="/admin/assignments" /><Stat icon={PenSquare} label="Published exams" value={t.publishedExams} to="/admin/exams" />
      <Stat icon={Building2} label="Companies" value={t.companies} to="/admin/companies" /><Stat icon={Briefcase} label="Open jobs" value={t.openJobs} to="/admin/jobs" /><Stat icon={ListChecks} label="Applications" value={t.applications} to="/admin/applications" />
      <Stat icon={Trophy} label="Selected students" value={t.selectedStudents} to="/admin/applications" /><Stat icon={Mail} label="Unread messages" value={t.unreadMessages} to="/admin/messages" /><Stat icon={GraduationCap} label="Grades recorded" value={d.gradeDistribution.reduce((n, g) => n + g.count, 0)} to="/admin/results" /></div>
    <div className="grid gap-4 lg:grid-cols-2"><Panel title="Attendance trend (%, last 6 months)"><Chart data={d.attendanceTrend} x="month" y="percentage" line /></Panel><Panel title="Students per course"><Chart data={d.studentsPerCourse} x="course" y="students" color="#16a34a" /></Panel>
      <Panel title="Placement application status"><Chart data={d.placementStatus} x="status" y="count" color="#7c3aed" /></Panel><Panel title="Academic performance (grade distribution)"><Chart data={d.gradeDistribution} x="grade" y="count" color="#f59e0b" /></Panel></div>
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel title="Recent activity">{d.activity.length ? <ul className="space-y-2 text-sm">{d.activity.map((a, i) => <li key={i}><p>{a.text}</p><p className="text-xs text-slate-500">{fmt(a.at)}</p></li>)}</ul> : <Empty>No activity yet.</Empty>}</Panel>
      <Panel title="Latest applications">{d.latestApplications.length ? <ul className="space-y-2 text-sm">{d.latestApplications.map((a) => <li key={a.id} className="flex items-center justify-between gap-2"><span>{a.student}<br /><span className="text-xs text-slate-500">{a.job} · {a.company}</span></span><Badge tone="blue">{a.status.replace('_', ' ')}</Badge></li>)}</ul> : <Empty>No applications yet.</Empty>}</Panel>
      <Panel title="Latest registrations">{d.latestRegistrations.length ? <ul className="space-y-2 text-sm">{d.latestRegistrations.map((r) => <li key={r.id}>{r.name}<br /><span className="text-xs text-slate-500">{r.course} · Sem {r.semester} · {fmt(r.createdAt)}</span></li>)}</ul> : <Empty>No registrations yet.</Empty>}</Panel></div>
    <Panel title="Quick actions"><div className="flex flex-wrap gap-2">{[['Add student', '/admin/students'], ['Mark attendance', '/admin/attendance'], ['Upload notes', '/admin/notes'], ['Create assignment', '/admin/assignments'], ['Create exam', '/admin/exams'], ['Post notification', '/admin/notifications'], ['Add job', '/admin/jobs']].map(([l, to]) => <Link key={to} to={to} className="btn-outline">{l}</Link>)}</div></Panel></div>);
}
