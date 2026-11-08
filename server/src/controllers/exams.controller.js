const { z } = require('zod');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { score: scoreAnswers, evaluate } = require('../utils/scoring');
const { ok, asyncHandler } = require('../utils/helpers');
const GRACE_MS = 30000; // network allowance for auto-submit at timer zero
const base = z.object({ subjectId: z.string().min(1, 'Select a subject'), title: z.string().trim().min(3).max(120), instructions: z.string().trim().max(2000).optional(),
  examDate: z.coerce.date(), durationMinutes: z.coerce.number().int().min(1).max(300), totalMarks: z.coerce.number().int().min(1), passingMarks: z.coerce.number().int().min(0),
  maxAttempts: z.coerce.number().int().min(1).max(5).default(1), showAnswers: z.boolean().optional(), isPublished: z.boolean().optional() });
const createSchema = base.refine((d) => d.passingMarks <= d.totalMarks, { message: 'Passing marks cannot exceed total marks', path: ['passingMarks'] });
const qSchema = z.object({ text: z.string().trim().min(5).max(500), optionA: z.string().trim().min(1).max(200), optionB: z.string().trim().min(1).max(200), optionC: z.string().trim().min(1).max(200),
  optionD: z.string().trim().min(1).max(200), correctOption: z.enum(['A', 'B', 'C', 'D']), marks: z.coerce.number().int().min(1).max(100).default(1) });
const answersSchema = z.object({ answers: z.record(z.string(), z.enum(['A', 'B', 'C', 'D'])).default({}) });
const sInc = { subject: { select: { name: true, code: true, courseId: true, semester: true } } };
const shape = (e, extra = {}) => ({ id: e.id, title: e.title, instructions: e.instructions, examDate: e.examDate, durationMinutes: e.durationMinutes, totalMarks: e.totalMarks, passingMarks: e.passingMarks,
  maxAttempts: e.maxAttempts, showAnswers: e.showAnswers, isPublished: e.isPublished, subjectId: e.subjectId, subjectName: e.subject.name, subjectCode: e.subject.code, ...extra });
const endMs = (att, exam) => att.startedAt.getTime() + exam.durationMinutes * 60000;
async function ensurePublishable(examId, totalMarks) {
  const qs = await prisma.question.findMany({ where: { examId }, select: { marks: true } });
  if (!qs.length) throw new AppError('Add at least one question before publishing', 400);
  const sum = qs.reduce((a, q) => a + q.marks, 0);
  if (sum !== totalMarks) throw new AppError(`Question marks add up to ${sum} but total marks is ${totalMarks}`, 400);
}
async function finalize(attempt, exam, answers) {
  const questions = await prisma.question.findMany({ where: { examId: exam.id }, select: { id: true, marks: true, correctOption: true } });
  const r = scoreAnswers(questions, answers); const ev = evaluate(r.score, exam.totalMarks, exam.passingMarks);
  await prisma.$transaction([
    prisma.examAnswer.createMany({ data: r.rows.map((x) => ({ ...x, attemptId: attempt.id })) }),
    prisma.examAttempt.update({ where: { id: attempt.id }, data: { submittedAt: new Date(), score: r.score, percentage: ev.percentage, passed: ev.passed } })]);
  return { ...r, ...ev };
}
// ---- admin
exports.list = asyncHandler(async (req, res) => {
  const rows = await prisma.examination.findMany({ include: { ...sInc, _count: { select: { questions: true, attempts: true } } }, orderBy: { examDate: 'desc' } });
  ok(res, rows.map((e) => shape(e, { questionCount: e._count.questions, attemptCount: e._count.attempts })));
});
exports.create = asyncHandler(async (req, res) => {
  const { isPublished, ...d } = createSchema.parse(req.body);
  if (!(await prisma.subject.findUnique({ where: { id: d.subjectId } }))) throw new AppError('Subject not found', 400);
  ok(res, shape(await prisma.examination.create({ data: d, include: sInc })), 'Examination created', 201);
});
exports.update = asyncHandler(async (req, res) => {
  const cur = await prisma.examination.findUnique({ where: { id: req.params.id } });
  if (!cur) throw new AppError('Examination not found', 404);
  const d = base.partial().parse(req.body); const m = { ...cur, ...d };
  if (m.passingMarks > m.totalMarks) throw new AppError('Passing marks cannot exceed total marks', 400);
  if (m.isPublished) await ensurePublishable(cur.id, m.totalMarks);
  ok(res, shape(await prisma.examination.update({ where: { id: cur.id }, data: d, include: sInc })), 'Examination updated');
});
exports.remove = asyncHandler(async (req, res) => { await prisma.examination.delete({ where: { id: req.params.id } }); ok(res, {}, 'Examination deleted'); });
exports.questions = asyncHandler(async (req, res) => ok(res, await prisma.question.findMany({ where: { examId: req.params.id }, orderBy: { id: 'asc' } })));
const lockIfAttempted = async (examId) => { if (await prisma.examAttempt.count({ where: { examId } })) throw new AppError('Questions cannot be changed after students have attempted this exam', 409); };
exports.addQuestion = asyncHandler(async (req, res) => {
  const exam = await prisma.examination.findUnique({ where: { id: req.params.id } });
  if (!exam) throw new AppError('Examination not found', 404); await lockIfAttempted(exam.id);
  ok(res, await prisma.question.create({ data: { ...qSchema.parse(req.body), examId: exam.id } }), 'Question added', 201);
});
exports.removeQuestion = asyncHandler(async (req, res) => {
  const q = await prisma.question.findUnique({ where: { id: req.params.qid }, include: { exam: true } });
  if (!q) throw new AppError('Question not found', 404); await lockIfAttempted(q.examId);
  if (q.exam.isPublished) throw new AppError('Unpublish the exam before removing questions', 409);
  await prisma.question.delete({ where: { id: q.id } }); ok(res, {}, 'Question removed');
});
// ---- student
exports.mine = asyncHandler(async (req, res) => {
  const s = req.student; const now = new Date();
  const rows = await prisma.examination.findMany({ where: { isPublished: true, subject: { courseId: s.courseId, semester: s.semester } },
    include: { ...sInc, _count: { select: { questions: true } }, attempts: { where: { studentId: s.id }, orderBy: { attemptNo: 'desc' } } }, orderBy: { examDate: 'desc' } });
  ok(res, rows.map((e) => { const open = e.attempts.find((a) => !a.submittedAt && endMs(a, e) + GRACE_MS > now.getTime()); const done = e.attempts.filter((a) => a.submittedAt);
    return shape(e, { questionCount: e._count.questions, attemptsUsed: e.attempts.length, inProgress: !!open, started: now >= e.examDate,
      canStart: now >= e.examDate && (!!open || e.attempts.length < e.maxAttempts), last: done[0] ? { score: done[0].score, percentage: done[0].percentage, passed: done[0].passed } : null }); }));
});
exports.start = asyncHandler(async (req, res) => {
  const s = req.student;
  const exam = await prisma.examination.findUnique({ where: { id: req.params.id }, include: { ...sInc, questions: { select: { id: true, text: true, optionA: true, optionB: true, optionC: true, optionD: true, marks: true }, orderBy: { id: 'asc' } } } });
  if (!exam || !exam.isPublished) throw new AppError('Examination not found', 404);
  if (exam.subject.courseId !== s.courseId || exam.subject.semester !== s.semester) throw new AppError('This examination is not assigned to you', 403);
  if (new Date() < exam.examDate) throw new AppError('This examination has not started yet', 400);
  if (!exam.questions.length) throw new AppError('This examination has no questions', 400);
  const attempts = await prisma.examAttempt.findMany({ where: { examId: exam.id, studentId: s.id } });
  let open = attempts.find((a) => !a.submittedAt);
  if (open && Date.now() > endMs(open, exam) + GRACE_MS) { await finalize(open, exam, {}); open = null; } // abandoned attempt: close it with whatever was (not) answered
  if (!open) {
    if (attempts.length >= exam.maxAttempts) throw new AppError('You have already used all attempts for this examination', 409);
    open = await prisma.examAttempt.create({ data: { examId: exam.id, studentId: s.id, attemptNo: attempts.length + 1 } });
  }
  ok(res, { attemptId: open.id, title: exam.title, durationMinutes: exam.durationMinutes, totalMarks: exam.totalMarks, remainingSeconds: Math.max(0, Math.floor((endMs(open, exam) - Date.now()) / 1000)), questions: exam.questions });
});
exports.submit = asyncHandler(async (req, res) => {
  const { answers } = answersSchema.parse(req.body);
  const att = await prisma.examAttempt.findUnique({ where: { id: req.params.attemptId }, include: { exam: true } });
  if (!att || att.studentId !== req.student.id) throw new AppError('Attempt not found', 404);
  if (att.submittedAt) throw new AppError('This attempt was already submitted', 409);
  const late = Date.now() > endMs(att, att.exam) + GRACE_MS;
  const r = await finalize(att, att.exam, late ? {} : answers);
  ok(res, { score: r.score, totalMarks: att.exam.totalMarks, percentage: r.percentage, passed: r.passed, timedOut: late, ...(att.exam.showAnswers && { correct: r.correct, incorrect: r.incorrect, unanswered: r.unanswered }) }, 'Examination submitted');
});
