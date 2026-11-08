const prisma = require('../config/prisma');
const { summarize, iso } = require('../utils/attendance');
const { studentPercentage, checkEligibility } = require('../utils/eligibility');
const { gradeOf, percentage, GRADE_SCALE } = require('../utils/grading');
const { startOfToday } = require('./events.controller');
const { ok, asyncHandler } = require('../utils/helpers');
const monthly = (recs) => { const m = new Map(); recs.forEach((r) => { const k = iso(r.date).slice(0, 7); m.set(k, [...(m.get(k) || []), r]); });
  return [...m].map(([month, rs]) => ({ month, percentage: summarize(rs).percentage })).sort((a, b) => a.month.localeCompare(b.month)); };

exports.student = asyncHandler(async (req, res) => {
  const s = req.student; const now = new Date(); const scope = { subject: { courseId: s.courseId, semester: s.semester } };
  const [profile, att, assignments, last, exams, events, notifications, pct, jobs, apps] = await Promise.all([
    prisma.student.findUnique({ where: { id: s.id }, include: { course: { select: { name: true } } } }),
    prisma.attendance.findMany({ where: { studentId: s.id }, select: { status: true, date: true } }),
    prisma.assignment.findMany({ where: scope, include: { subject: { select: { code: true } }, submissions: { where: { studentId: s.id }, select: { status: true } } }, orderBy: { deadline: 'asc' } }),
    prisma.examAttempt.findFirst({ where: { studentId: s.id, submittedAt: { not: null } }, orderBy: { submittedAt: 'desc' }, include: { exam: { select: { title: true, totalMarks: true } } } }),
    prisma.examination.findMany({ where: { isPublished: true, ...scope, examDate: { gte: now } }, orderBy: { examDate: 'asc' }, take: 3, include: { subject: { select: { code: true } } } }),
    prisma.event.findMany({ where: { eventDate: { gte: startOfToday() } }, orderBy: { eventDate: 'asc' }, take: 5 }),
    prisma.notification.findMany({ where: { audience: { in: ['ALL', 'STUDENTS'] } }, orderBy: { createdAt: 'desc' }, take: 5 }),
    studentPercentage(prisma, s.id),
    prisma.job.findMany({ where: { deadline: { gt: now } }, include: { eligibleCourses: { select: { id: true } }, applications: { where: { studentId: s.id }, select: { id: true } } } }),
    prisma.jobApplication.groupBy({ by: ['status'], where: { studentId: s.id }, _count: { _all: true } })]);
  const counts = { PENDING: 0, SUBMITTED: 0, LATE: 0, REVIEWED: 0, MISSED: 0 }; const deadlines = [];
  assignments.forEach((a) => { const sub = a.submissions[0]; const st = sub ? sub.status : (now > a.deadline && !a.allowLate ? 'MISSED' : 'PENDING'); counts[st]++;
    if (st === 'PENDING') deadlines.push({ id: a.id, title: a.title, subjectCode: a.subject.code, deadline: a.deadline, overdue: now > a.deadline }); });
  ok(res, {
    profile: { fullName: profile.fullName, enrollmentNo: profile.enrollmentNo, course: profile.course.name, semester: profile.semester },
    attendance: { ...summarize(att), monthly: monthly(att) },
    assignments: { pending: counts.PENDING, statusChart: Object.entries(counts).map(([status, count]) => ({ status, count })), deadlines: deadlines.slice(0, 5) },
    latestResult: last ? { examTitle: last.exam.title, score: last.score, totalMarks: last.exam.totalMarks, percentage: last.percentage, passed: last.passed } : null,
    upcomingExams: exams.map((e) => ({ id: e.id, title: e.title, subjectCode: e.subject.code, examDate: e.examDate })), upcomingEvents: events, notifications,
    placement: { academicPercentage: pct, eligibleOpenJobs: jobs.filter((j) => !j.applications.length && checkEligibility({ student: s, job: j, percentage: pct }).eligible).length,
      applications: apps.map((a) => ({ status: a.status, count: a._count._all })), totalApplications: apps.reduce((n, a) => n + a._count._all, 0) } });
});

exports.admin = asyncHandler(async (req, res) => {
  const now = new Date(); const since = new Date(); since.setMonth(since.getMonth() - 5); since.setDate(1); since.setUTCHours(0, 0, 0, 0);
  const [students, teachers, courses, companies, openJobs, applications, selectedGroups, publishedExams, pendingReviews, unreadMessages, attStatus, attRecent, courseRows, appStatus, results, regs, apps, subs] = await Promise.all([
    prisma.student.count(), prisma.teacher.count(), prisma.course.count(), prisma.company.count(), prisma.job.count({ where: { deadline: { gt: now } } }), prisma.jobApplication.count(),
    prisma.jobApplication.groupBy({ by: ['studentId'], where: { status: 'SELECTED' } }), prisma.examination.count({ where: { isPublished: true } }),
    prisma.assignmentSubmission.count({ where: { status: { in: ['SUBMITTED', 'LATE'] } } }), prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.attendance.groupBy({ by: ['status'], _count: { _all: true } }), prisma.attendance.findMany({ where: { date: { gte: since } }, select: { status: true, date: true } }),
    prisma.course.findMany({ select: { code: true, _count: { select: { students: true } } }, orderBy: { code: 'asc' } }), prisma.jobApplication.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.academicResult.findMany({ select: { obtainedMarks: true, maxMarks: true } }),
    prisma.student.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { course: { select: { code: true } } } }),
    prisma.jobApplication.findMany({ orderBy: { appliedAt: 'desc' }, take: 5, include: { student: { select: { fullName: true } }, job: { select: { title: true, company: { select: { name: true } } } } } }),
    prisma.assignmentSubmission.findMany({ orderBy: { submittedAt: 'desc' }, take: 5, include: { student: { select: { fullName: true } }, assignment: { select: { title: true } } } })]);
  const overall = summarize(attStatus.flatMap((g) => Array(g._count._all).fill({ status: g.status })));
  const grades = Object.fromEntries(GRADE_SCALE.map(([, g]) => [g, 0])); results.forEach((r) => { grades[gradeOf(percentage(r.obtainedMarks, r.maxMarks))]++; });
  const statuses = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED']; const sm = Object.fromEntries(appStatus.map((a) => [a.status, a._count._all]));
  const activity = [...regs.map((r) => ({ type: 'REGISTRATION', text: `${r.fullName} registered (${r.course.code})`, at: r.createdAt })),
    ...apps.map((a) => ({ type: 'APPLICATION', text: `${a.student.fullName} applied for ${a.job.title}`, at: a.appliedAt })),
    ...subs.map((x) => ({ type: 'SUBMISSION', text: `${x.student.fullName} submitted "${x.assignment.title}"`, at: x.submittedAt }))].sort((a, b) => b.at - a.at).slice(0, 8);
  ok(res, { totals: { students, teachers, courses, companies, openJobs, applications, selectedStudents: selectedGroups.length, publishedExams, pendingReviews, unreadMessages, averageAttendance: overall.percentage },
    attendanceTrend: monthly(attRecent), studentsPerCourse: courseRows.map((c) => ({ course: c.code, students: c._count.students })), placementStatus: statuses.map((status) => ({ status, count: sm[status] || 0 })),
    gradeDistribution: Object.entries(grades).map(([grade, count]) => ({ grade, count })), activity,
    latestApplications: apps.map((a) => ({ id: a.id, student: a.student.fullName, job: a.job.title, company: a.job.company.name, status: a.status, appliedAt: a.appliedAt })),
    latestRegistrations: regs.map((r) => ({ id: r.id, name: r.fullName, course: r.course.code, semester: r.semester, createdAt: r.createdAt })) });
});
