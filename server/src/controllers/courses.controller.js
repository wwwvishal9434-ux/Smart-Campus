const { z } = require('zod');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { ok, asyncHandler } = require('../utils/helpers');
const schema = z.object({ name: z.string().trim().min(2).max(100), code: z.string().trim().toUpperCase().min(2).max(15),
  semesters: z.coerce.number().int().min(1).max(12).default(6), description: z.string().trim().max(500).optional() });
exports.publicList = asyncHandler(async (req, res) => ok(res, await prisma.course.findMany({ select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } })));
exports.list = asyncHandler(async (req, res) => ok(res, await prisma.course.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { students: true, subjects: true } } } })));
exports.create = asyncHandler(async (req, res) => ok(res, await prisma.course.create({ data: schema.parse(req.body) }), 'Course created', 201));
exports.update = asyncHandler(async (req, res) => ok(res, await prisma.course.update({ where: { id: req.params.id }, data: schema.partial().parse(req.body) }), 'Course updated'));
exports.remove = asyncHandler(async (req, res) => {
  const c = await prisma.course.findUnique({ where: { id: req.params.id }, include: { _count: { select: { students: true, subjects: true } } } });
  if (!c) throw new AppError('Course not found', 404);
  if (c._count.students || c._count.subjects) throw new AppError('Cannot delete a course that has students or subjects', 409);
  await prisma.course.delete({ where: { id: c.id } }); ok(res, {}, 'Course deleted');
});
