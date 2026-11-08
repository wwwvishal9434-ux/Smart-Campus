const { z } = require('zod');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { summarize, toDate, iso } = require('../utils/attendance');
const { ok, asyncHandler } = require('../utils/helpers');
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
const markSchema = z.object({ subjectId: z.string().min(1), date: dateStr,
  records: z.array(z.object({ studentId: z.string().min(1), status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']) })).min(1, 'No students to mark') });
const eligible = async (subjectId) => {
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) throw new AppError('Subject not found', 404);
  const students = await prisma.student.findMany({ where: { courseId: subject.courseId, semester: subject.semester, user: { status: 'ACTIVE' } },
    orderBy: { fullName: 'asc' }, select: { id: true, fullName: true, enrollmentNo: true } });
  return { subject, students };
};
exports.sheet = asyncHandler(async (req, res) => {
  const { subjectId, date } = z.object({ subjectId: z.string().min(1), date: dateStr }).parse(req.query);
  const { students } = await eligible(subjectId);
  const existing = await prisma.attendance.findMany({ where: { subjectId, date: toDate(date) } });
  const map = new Map(existing.map((a) => [a.studentId, a.status]));
  ok(res, students.map((s) => ({ ...s, status: map.get(s.id) || null })));
});
exports.mark = asyncHandler(async (req, res) => {
  const { subjectId, date, records } = markSchema.parse(req.body);
  const { students } = await eligible(subjectId);
  const allowed = new Set(students.map((s) => s.id));
  if (records.some((r) => !allowed.has(r.studentId))) throw new AppError('Some students are not enrolled in this subject', 400);
  const d = toDate(date);
  await prisma.$transaction(records.map((r) => prisma.attendance.upsert({
    where: { studentId_subjectId_date: { studentId: r.studentId, subjectId, date: d } },
    update: { status: r.status }, create: { studentId: r.studentId, subjectId, date: d, status: r.status } })));
  ok(res, { saved: records.length }, 'Attendance saved');
});
exports.report = asyncHandler(async (req, res) => {
  const { subjectId } = z.object({ subjectId: z.string().min(1) }).parse(req.query);
  const { students } = await eligible(subjectId);
  const recs = await prisma.attendance.findMany({ where: { subjectId } });
  ok(res, students.map((s) => ({ ...s, ...summarize(recs.filter((r) => r.studentId === s.id)) })));
});
exports.me = asyncHandler(async (req, res) => {
  const recs = await prisma.attendance.findMany({ where: { studentId: req.student.id }, include: { subject: { select: { name: true, code: true } } }, orderBy: { date: 'desc' } });
  const group = (keyFn) => { const m = new Map(); recs.forEach((r) => { const k = keyFn(r); m.set(k, [...(m.get(k) || []), r]); }); return m; };
  const bySubject = [...group((r) => r.subject.code)].map(([code, rs]) => ({ code, name: rs[0].subject.name, ...summarize(rs) }));
  const monthly = [...group((r) => iso(r.date).slice(0, 7))].map(([month, rs]) => ({ month, ...summarize(rs) })).sort((a, b) => a.month.localeCompare(b.month));
  ok(res, { overall: summarize(recs), bySubject, monthly, history: recs.slice(0, 60).map((r) => ({ id: r.id, date: iso(r.date), subject: r.subject.name, status: r.status })) });
});
