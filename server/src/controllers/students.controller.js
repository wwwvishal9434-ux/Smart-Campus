const { z } = require('zod');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { ok, asyncHandler } = require('../utils/helpers');
const phone = z.string().trim().regex(/^[0-9+\-\s]{10,15}$/, 'Enter a valid phone number').optional().or(z.literal(''));
const base = z.object({ fullName: z.string().trim().min(2).max(80), enrollmentNo: z.string().trim().min(4).max(30), courseId: z.string().min(1),
  semester: z.coerce.number().int().min(1).max(6), phone, address: z.string().trim().max(200).optional() });
const createSchema = base.extend({ email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Password needs an uppercase letter').regex(/[a-z]/, 'Password needs a lowercase letter').regex(/[0-9]/, 'Password needs a number') });
const updateSchema = base.partial().extend({ status: z.enum(['ACTIVE', 'INACTIVE']).optional() });
const meSchema = z.object({ fullName: base.shape.fullName, phone, address: base.shape.address }).partial().strict(); // role/course/enrollment can never be edited by a student
const include = { user: { select: { email: true, status: true } }, course: { select: { name: true } } };
const shape = (s) => ({ id: s.id, fullName: s.fullName, enrollmentNo: s.enrollmentNo, email: s.user.email, status: s.user.status, phone: s.phone, address: s.address,
  courseId: s.courseId, courseName: s.course.name, semester: s.semester, createdAt: s.createdAt });
const clean = (d) => ({ ...d, ...('phone' in d && { phone: d.phone || null }), ...('address' in d && { address: d.address || null }) });

exports.list = asyncHandler(async (req, res) => {
  const page = Math.max(1, +req.query.page || 1), limit = Math.min(50, +req.query.limit || 10);
  const { q, courseId, semester, status } = req.query;
  const where = { ...(courseId && { courseId }), ...(semester && { semester: +semester }), ...(status && { user: { status } }),
    ...(q && { OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { enrollmentNo: { contains: q, mode: 'insensitive' } }, { user: { email: { contains: q, mode: 'insensitive' } } }] }) };
  const [items, total] = await prisma.$transaction([
    prisma.student.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }), prisma.student.count({ where })]);
  ok(res, { items: items.map(shape), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});
exports.get = asyncHandler(async (req, res) => {
  const s = await prisma.student.findUnique({ where: { id: req.params.id }, include });
  if (!s) throw new AppError('Student not found', 404); ok(res, shape(s));
});
exports.create = asyncHandler(async (req, res) => {
  const { email, password, ...d } = createSchema.parse(req.body);
  const user = await prisma.user.create({ data: { email, role: 'STUDENT', passwordHash: await bcrypt.hash(password, 12), student: { create: clean(d) } }, include: { student: { include } } });
  ok(res, shape({ ...user.student, user }), 'Student created', 201);
});
exports.update = asyncHandler(async (req, res) => {
  const { status, ...d } = updateSchema.parse(req.body);
  const s = await prisma.student.findUnique({ where: { id: req.params.id } });
  if (!s) throw new AppError('Student not found', 404);
  const [upd] = await prisma.$transaction([prisma.student.update({ where: { id: s.id }, data: clean(d), include }),
    ...(status ? [prisma.user.update({ where: { id: s.userId }, data: { status } })] : [])]);
  ok(res, shape({ ...upd, user: { ...upd.user, ...(status && { status }) } }), 'Student updated');
});
exports.remove = asyncHandler(async (req, res) => {
  const s = await prisma.student.findUnique({ where: { id: req.params.id } });
  if (!s) throw new AppError('Student not found', 404);
  await prisma.user.delete({ where: { id: s.userId } }); ok(res, {}, 'Student deleted'); // cascades to student-owned records
});
exports.me = asyncHandler(async (req, res) => ok(res, shape(await prisma.student.findUnique({ where: { id: req.student.id }, include }))));
exports.updateMe = asyncHandler(async (req, res) =>
  ok(res, shape(await prisma.student.update({ where: { id: req.student.id }, data: clean(meSchema.parse(req.body)), include })), 'Profile updated'));
exports.options = asyncHandler(async (req, res) => ok(res, (await prisma.student.findMany({ orderBy: { fullName: 'asc' }, select: { id: true, fullName: true, enrollmentNo: true } })).map((s) => ({ id: s.id, label: `${s.fullName} (${s.enrollmentNo})` }))));
