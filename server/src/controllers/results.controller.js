const { z } = require('zod');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { gradeOf, percentage, statusOf, GRADE_SCALE } = require('../utils/grading');
const { ok, asyncHandler } = require('../utils/helpers');
const base = z.object({ studentId: z.string().min(1, 'Select a student'), subjectId: z.string().min(1, 'Select a subject'), semester: z.coerce.number().int().min(1).max(12),
  examType: z.enum(['INTERNAL', 'PRACTICAL', 'MID_SEMESTER', 'END_SEMESTER']), maxMarks: z.coerce.number().positive().max(1000), obtainedMarks: z.coerce.number().min(0).max(1000) });
const include = { student: { select: { fullName: true, enrollmentNo: true } }, subject: { select: { name: true, code: true } } };
const compute = (r) => { const p = percentage(r.obtainedMarks, r.maxMarks); return { percentage: p, grade: gradeOf(p), status: statusOf(p) }; };
const shape = (r) => ({ id: r.id, studentId: r.studentId, subjectId: r.subjectId, studentName: r.student.fullName, enrollmentNo: r.student.enrollmentNo, subjectName: r.subject.name, subjectCode: r.subject.code,
  semester: r.semester, examType: r.examType, maxMarks: r.maxMarks, obtainedMarks: r.obtainedMarks, ...compute(r) });
async function validate(d) {
  if (d.obtainedMarks > d.maxMarks) throw new AppError('Obtained marks cannot exceed maximum marks', 400);
  const [st, sub] = await Promise.all([prisma.student.findUnique({ where: { id: d.studentId } }), prisma.subject.findUnique({ where: { id: d.subjectId } })]);
  if (!st || !sub) throw new AppError('Student or subject not found', 404);
  if (st.courseId !== sub.courseId) throw new AppError('This subject does not belong to the student\'s course', 400);
}
exports.list = asyncHandler(async (req, res) => {
  const { studentId, subjectId, semester, examType } = req.query;
  const rows = await prisma.academicResult.findMany({ where: { ...(studentId && { studentId }), ...(subjectId && { subjectId }), ...(semester && { semester: +semester }), ...(examType && { examType }) },
    include, orderBy: [{ semester: 'desc' }, { createdAt: 'desc' }], take: 500 });
  ok(res, rows.map(shape));
});
exports.create = asyncHandler(async (req, res) => { const d = base.parse(req.body); await validate(d); ok(res, shape(await prisma.academicResult.create({ data: d, include })), 'Result added', 201); });
exports.update = asyncHandler(async (req, res) => {
  const cur = await prisma.academicResult.findUnique({ where: { id: req.params.id } });
  if (!cur) throw new AppError('Result not found', 404);
  const d = base.partial().parse(req.body); await validate({ ...cur, ...d });
  ok(res, shape(await prisma.academicResult.update({ where: { id: cur.id }, data: d, include })), 'Result updated');
});
exports.remove = asyncHandler(async (req, res) => { await prisma.academicResult.delete({ where: { id: req.params.id } }); ok(res, {}, 'Result deleted'); });
exports.me = asyncHandler(async (req, res) => {
  const student = await prisma.student.findUnique({ where: { id: req.student.id }, include: { course: { select: { name: true } } } });
  const rows = await prisma.academicResult.findMany({ where: { studentId: student.id }, include, orderBy: [{ semester: 'asc' }, { examType: 'asc' }] });
  const sems = new Map(); rows.forEach((r) => sems.set(r.semester, [...(sems.get(r.semester) || []), shape(r)]));
  const semesters = [...sems].map(([semester, items]) => { const o = items.reduce((a, x) => a + x.obtainedMarks, 0), m = items.reduce((a, x) => a + x.maxMarks, 0), p = percentage(o, m);
    return { semester, items, totalObtained: o, totalMax: m, percentage: p, grade: gradeOf(p), result: items.every((x) => x.status === 'PASS') ? 'PASS' : 'FAIL' }; });
  ok(res, { student: { fullName: student.fullName, enrollmentNo: student.enrollmentNo, course: student.course.name }, semesters, gradeScale: GRADE_SCALE.map(([min, g]) => ({ min, grade: g })) });
});
