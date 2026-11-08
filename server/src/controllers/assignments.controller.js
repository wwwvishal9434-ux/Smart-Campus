const { z } = require('zod');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { filePath, removeFile } = require('../config/upload');
const { ok, asyncHandler } = require('../utils/helpers');
const createSchema = z.object({ subjectId: z.string().min(1, 'Select a subject'), title: z.string().trim().min(3).max(120), instructions: z.string().trim().min(5).max(3000),
  deadline: z.coerce.date(), maxMarks: z.coerce.number().int().min(1).max(1000).default(10), allowLate: z.enum(['true', 'false']).optional().transform((v) => v === 'true') });
const reviewSchema = z.object({ marks: z.coerce.number().min(0), feedback: z.string().trim().max(1000).optional() });
const sInclude = { subject: { select: { name: true, code: true, courseId: true, semester: true } } };
const me = (req) => prisma.student.findUnique({ where: { userId: req.user.id }, select: { id: true, courseId: true, semester: true } });
const inScope = (s, a) => a.subject.courseId === s.courseId && a.subject.semester === s.semester;
const eligible = (subject) => prisma.student.findMany({ where: { courseId: subject.courseId, semester: subject.semester, user: { status: 'ACTIVE' } }, orderBy: { fullName: 'asc' }, select: { id: true, fullName: true, enrollmentNo: true } });
const shape = (a, extra = {}) => ({ id: a.id, title: a.title, instructions: a.instructions, deadline: a.deadline, allowLate: a.allowLate, maxMarks: a.maxMarks, subjectId: a.subjectId,
  subjectName: a.subject.name, subjectCode: a.subject.code, referenceName: a.fileName, ...extra });

exports.list = asyncHandler(async (req, res) => {
  const rows = await prisma.assignment.findMany({ include: { ...sInclude, _count: { select: { submissions: true } } }, orderBy: { deadline: 'desc' } });
  ok(res, rows.map((a) => shape(a, { submissionCount: a._count.submissions })));
});
exports.create = asyncHandler(async (req, res) => {
  try {
    const d = createSchema.parse(req.body);
    if (!(await prisma.subject.findUnique({ where: { id: d.subjectId } }))) throw new AppError('Subject not found', 400);
    const a = await prisma.assignment.create({ data: { ...d, createdById: req.user.id, ...(req.file && { fileKey: req.file.filename, fileName: req.file.originalname }) }, include: sInclude });
    ok(res, shape(a), 'Assignment published', 201);
  } catch (e) { if (req.file) await removeFile(req.file.filename); throw e; }
});
exports.remove = asyncHandler(async (req, res) => {
  const a = await prisma.assignment.findUnique({ where: { id: req.params.id }, include: { submissions: { select: { fileKey: true } } } });
  if (!a) throw new AppError('Assignment not found', 404);
  await prisma.assignment.delete({ where: { id: a.id } });
  await Promise.all([...(a.fileKey ? [removeFile(a.fileKey)] : []), ...a.submissions.map((s) => removeFile(s.fileKey))]); ok(res, {}, 'Assignment deleted');
});
exports.submissions = asyncHandler(async (req, res) => {
  const a = await prisma.assignment.findUnique({ where: { id: req.params.id }, include: sInclude });
  if (!a) throw new AppError('Assignment not found', 404);
  const [students, subs] = await Promise.all([eligible(a.subject), prisma.assignmentSubmission.findMany({ where: { assignmentId: a.id } })]);
  const map = new Map(subs.map((s) => [s.studentId, s]));
  ok(res, { assignment: shape(a), rows: students.map((s) => { const x = map.get(s.id); return { ...s, submission: x ? { id: x.id, status: x.status, fileName: x.fileName, submittedAt: x.submittedAt, marks: x.marks, feedback: x.feedback } : null }; }) });
});
exports.review = asyncHandler(async (req, res) => {
  const d = reviewSchema.parse(req.body);
  const sub = await prisma.assignmentSubmission.findUnique({ where: { id: req.params.id }, include: { assignment: true } });
  if (!sub) throw new AppError('Submission not found', 404);
  if (d.marks > sub.assignment.maxMarks) throw new AppError(`Marks cannot exceed ${sub.assignment.maxMarks}`, 400);
  ok(res, await prisma.assignmentSubmission.update({ where: { id: sub.id }, data: { marks: d.marks, feedback: d.feedback || null, status: 'REVIEWED', reviewedAt: new Date() } }), 'Submission reviewed');
});
exports.mine = asyncHandler(async (req, res) => {
  const s = req.student; const now = new Date();
  const rows = await prisma.assignment.findMany({ where: { subject: { courseId: s.courseId, semester: s.semester } }, include: { ...sInclude, submissions: { where: { studentId: s.id } } }, orderBy: { deadline: 'desc' } });
  ok(res, rows.map((a) => { const sub = a.submissions[0];
    return shape(a, { status: sub ? sub.status : 'PENDING', overdue: !sub && now > a.deadline, canSubmit: (!sub || sub.status !== 'REVIEWED') && (now <= a.deadline || a.allowLate),
      submission: sub ? { id: sub.id, fileName: sub.fileName, submittedAt: sub.submittedAt, marks: sub.marks, feedback: sub.feedback } : null }); }));
});
exports.submit = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Please attach your file', 400);
  try {
    const s = await me(req);
    const a = await prisma.assignment.findUnique({ where: { id: req.params.id }, include: sInclude });
    if (!a) throw new AppError('Assignment not found', 404);
    if (!inScope(s, a)) throw new AppError('This assignment is not assigned to you', 403);
    const late = new Date() > a.deadline;
    if (late && !a.allowLate) throw new AppError('The deadline for this assignment has passed', 400);
    const key = { assignmentId_studentId: { assignmentId: a.id, studentId: s.id } };
    const old = await prisma.assignmentSubmission.findUnique({ where: key });
    if (old?.status === 'REVIEWED') throw new AppError('This submission has already been reviewed', 400);
    const data = { fileKey: req.file.filename, fileName: req.file.originalname, status: late ? 'LATE' : 'SUBMITTED', submittedAt: new Date() };
    const sub = await prisma.assignmentSubmission.upsert({ where: key, update: data, create: { ...data, assignmentId: a.id, studentId: s.id } });
    if (old) await removeFile(old.fileKey);
    ok(res, { id: sub.id, status: sub.status }, late ? 'Submitted (marked late)' : 'Assignment submitted', 201);
  } catch (e) { await removeFile(req.file.filename); throw e; }
});
exports.downloadSubmission = asyncHandler(async (req, res) => {
  const sub = await prisma.assignmentSubmission.findUnique({ where: { id: req.params.id } });
  if (!sub) throw new AppError('Submission not found', 404);
  if (req.user.role === 'STUDENT' && (await me(req))?.id !== sub.studentId) throw new AppError('You do not have access to this file', 403);
  res.download(filePath(sub.fileKey), sub.fileName, (err) => { if (err && !res.headersSent) res.status(404).json({ success: false, message: 'File is missing on the server' }); });
});
exports.downloadReference = asyncHandler(async (req, res) => {
  const a = await prisma.assignment.findUnique({ where: { id: req.params.id }, include: sInclude });
  if (!a || !a.fileKey) throw new AppError('No reference file', 404);
  if (req.user.role === 'STUDENT' && !inScope(await me(req), a)) throw new AppError('You do not have access to this file', 403);
  res.download(filePath(a.fileKey), a.fileName, (err) => { if (err && !res.headersSent) res.status(404).json({ success: false, message: 'File is missing on the server' }); });
});
