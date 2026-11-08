const { z } = require('zod');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { filePath, removeFile } = require('../config/upload');
const { ok, asyncHandler } = require('../utils/helpers');
const schema = z.object({ title: z.string().trim().min(3).max(120), description: z.string().trim().max(500).optional(), subjectId: z.string().min(1, 'Select a subject') });
const include = { subject: { select: { name: true, code: true, courseId: true } } };
const shape = (n) => ({ id: n.id, title: n.title, description: n.description, subjectId: n.subjectId, subjectName: n.subject.name, subjectCode: n.subject.code,
  semester: n.semester, fileName: n.fileName, fileSize: n.fileSize, mimeType: n.mimeType, createdAt: n.createdAt });
const studentCourse = async (req) => req.user.role === 'STUDENT' ? (await prisma.student.findUnique({ where: { userId: req.user.id }, select: { courseId: true } }))?.courseId : null;
exports.list = asyncHandler(async (req, res) => {
  const { subjectId, semester, q } = req.query; const courseId = await studentCourse(req);
  const rows = await prisma.note.findMany({ where: { ...(subjectId && { subjectId }), ...(semester && { semester: +semester }), ...(q && { title: { contains: q, mode: 'insensitive' } }), ...(courseId && { subject: { courseId } }) },
    include, orderBy: { createdAt: 'desc' } });
  ok(res, rows.map(shape));
});
exports.create = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Please attach a file', 400);
  try {
    const d = schema.parse(req.body);
    const subject = await prisma.subject.findUnique({ where: { id: d.subjectId } });
    if (!subject) throw new AppError('Subject not found', 400);
    const note = await prisma.note.create({ data: { ...d, semester: subject.semester, uploadedById: req.user.id, fileKey: req.file.filename,
      fileName: req.file.originalname, fileSize: req.file.size, mimeType: req.file.mimetype }, include });
    ok(res, shape(note), 'Note uploaded', 201);
  } catch (e) { await removeFile(req.file.filename); throw e; } // never leave orphan files
});
exports.download = asyncHandler(async (req, res) => {
  const note = await prisma.note.findUnique({ where: { id: req.params.id }, include });
  if (!note) throw new AppError('Note not found', 404);
  const courseId = await studentCourse(req);
  if (courseId && note.subject.courseId !== courseId) throw new AppError('You do not have access to this file', 403);
  res.download(filePath(note.fileKey), note.fileName, (err) => { if (err && !res.headersSent) res.status(404).json({ success: false, message: 'File is missing on the server' }); });
});
exports.remove = asyncHandler(async (req, res) => {
  const note = await prisma.note.findUnique({ where: { id: req.params.id } });
  if (!note) throw new AppError('Note not found', 404);
  await prisma.note.delete({ where: { id: note.id } }); await removeFile(note.fileKey); ok(res, {}, 'Note deleted');
});
