import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Award, Briefcase, CalendarCheck, ClipboardList, ListChecks, PenSquare } from 'lucide-react';
import api from '../services/api.js';
import { Empty, Panel, Stat } from '../components/Stat.jsx';
import { Badge, fmt } from '../utils/format.jsx';
const STATUS_COLOR = { PENDING: '#f59e0b', SUBMITTED: '#2563eb', LATE: '#dc2626', REVIEWED: '#16a34a', MISSED: '#64748b' };
export default function DashboardStudent() {
  const [d, setD] = useState(null); const [err, setErr] = useState(false);
  useEffect(() => { api.get('/dashboard/student').then((r) => setD(r.data.data)).catch(() => setErr(true)); }, []);
  if (err) return <p className="py-10 text-center text-sm">Could not load your dashboard. Please refresh.</p>;
  if (!d) return <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>;
  const a = d.attendance; const pie = d.assignments.statusChart.filter((x) => x.count > 0);
  return (<div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Welcome, {d.profile.fullName}</h1><p className="text-sm text-slate-500">{d.profile.enrollmentNo} · {d.profile.course} · Semester {d.profile.semester}</p></div>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <Stat icon={CalendarCheck} label="Attendance" value={a.total ? `${a.percentage}%` : '—'} sub={a.total ? `${a.attended}/${a.total} classes` : 'No records yet'} tone={a.total && a.percentage < 75 ? 'text-red-600' : ''} to="/student/attendance" />
      <Stat icon={ClipboardList} label="Pending assignments" value={d.assignments.pending} to="/student/assignments" />
      <Stat icon={Award} label="Latest exam result" value={d.latestResult ? `${d.latestResult.score}/${d.latestResult.totalMarks}` : '—'} sub={d.latestResult ? `${d.latestResult.examTitle} · ${d.latestResult.passed ? 'Pass' : 'Fail'}` : 'No exam taken yet'} to="/student/exams" />
      <Stat icon={PenSquare} label="Upcoming exams" value={d.upcomingExams.length} to="/student/exams" />
      <Stat icon={Briefcase} label="Open jobs for you" value={d.placement.eligibleOpenJobs} to="/student/jobs" />
      <Stat icon={ListChecks} label="Applications" value={d.placement.totalApplications} sub={d.placement.applications.map((x) => `${x.count} ${x.status.replace('_', ' ').toLowerCase()}`).join(', ') || 'None yet'} to="/student/applications" /></div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Monthly attendance (%)">{a.monthly.length ? <div className="h-56"><ResponsiveContainer><BarChart data={a.monthly}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="month" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="percentage" fill="#2563eb" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div> : <Empty>No attendance recorded yet.</Empty>}</Panel>
      <Panel title="Assignment status">{pie.length ? <div className="h-56"><ResponsiveContainer><PieChart><Pie data={pie} dataKey="count" nameKey="status" outerRadius={80} label={(x) => x.count}>{pie.map((x) => <Cell key={x.status} fill={STATUS_COLOR[x.status]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div> : <Empty>No assignments yet.</Empty>}</Panel></div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Pending assignments">{d.assignments.deadlines.length ? <ul className="space-y-2 text-sm">{d.assignments.deadlines.map((x) => <li key={x.id} className="flex justify-between gap-2"><span>{x.title} <span className="text-slate-500">({x.subjectCode})</span></span><span className="shrink-0 text-slate-500">{x.overdue && <Badge tone="red">OVERDUE</Badge>} {fmt(x.deadline)}</span></li>)}</ul> : <Empty>Nothing pending. 🎉</Empty>}</Panel>
      <Panel title="Upcoming examinations">{d.upcomingExams.length ? <ul className="space-y-2 text-sm">{d.upcomingExams.map((x) => <li key={x.id} className="flex justify-between gap-2"><span>{x.title} <span className="text-slate-500">({x.subjectCode})</span></span><span className="shrink-0 text-slate-500">{fmt(x.examDate)}</span></li>)}</ul> : <Empty>No upcoming examinations.</Empty>}</Panel>
      <Panel title="Upcoming events">{d.upcomingEvents.length ? <ul className="space-y-2 text-sm">{d.upcomingEvents.map((x) => <li key={x.id} className="flex justify-between gap-2"><span>{x.title} <span className="text-slate-500">· {x.location}</span></span><span className="shrink-0 text-slate-500">{new Date(x.eventDate).toLocaleDateString('en-IN', { timeZone: 'UTC' })}</span></li>)}</ul> : <Empty>No upcoming events.</Empty>}</Panel>
      <Panel title="Recent notifications">{d.notifications.length ? <ul className="space-y-3 text-sm">{d.notifications.map((x) => <li key={x.id}><div className="flex items-center gap-2"><Badge tone="blue">{x.category}</Badge><span className="font-medium">{x.title}</span></div><p className="mt-0.5 text-slate-500">{x.message}</p></li>)}</ul> : <Empty>No notifications.</Empty>}
        {!!d.notifications.length && <Link to="/student/notifications" className="mt-3 block text-sm font-semibold text-brand-600">View all</Link>}</Panel></div></div>);
}
