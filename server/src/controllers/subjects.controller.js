const { z } = require('zod');
const prisma = require('../config/prisma');
const { ok, asyncHandler } = require('../utils/helpers');
const schema = z.object({ courseId: z.string().min(1), teacherId: z.string().optional().nullable().transform((v) => v || null),
  name: z.string().trim().min(2).max(100), code: z.string().trim().toUpperCase().min(2).max(15), semester: z.coerce.number().int().min(1).max(12) });
const include = { course: { select: { name: true } }, teacher: { select: { name: true } } };
const shape = (s) => ({ id: s.id, courseId: s.courseId, teacherId: s.teacherId, name: s.name, code: s.code, semester: s.semester, courseName: s.course.name, teacherName: s.teacher?.name || null, label: `${s.code} - ${s.name}` });
exports.list = asyncHandler(async (req, res) => {
  const { courseId, semester } = req.query;
  const rows = await prisma.subject.findMany({ where: { ...(courseId && { courseId }), ...(semester && { semester: +semester }) }, include, orderBy: [{ semester: 'asc' }, { code: 'asc' }] });
  ok(res, rows.map(shape));
});
exports.create = asyncHandler(async (req, res) => ok(res, shape(await prisma.subject.create({ data: schema.parse(req.body), include })), 'Subject created', 201));
exports.update = asyncHandler(async (req, res) => ok(res, shape(await prisma.subject.update({ where: { id: req.params.id }, data: schema.partial().parse(req.body), include })), 'Subject updated'));
exports.remove = asyncHandler(async (req, res) => { await prisma.subject.delete({ where: { id: req.params.id } }); ok(res, {}, 'Subject deleted'); });
