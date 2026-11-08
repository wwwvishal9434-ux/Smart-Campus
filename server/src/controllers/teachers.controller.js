const { z } = require('zod');
const prisma = require('../config/prisma');
const { ok, asyncHandler } = require('../utils/helpers');
const schema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().regex(/^[0-9+\-\s]{10,15}$/, 'Enter a valid phone number').optional().or(z.literal('')),
  department: z.string().trim().min(2).max(60), designation: z.string().trim().min(2).max(60) });
const clean = (d) => ({ ...d, ...('phone' in d && { phone: d.phone || null }) });
const include = { subjects: { select: { code: true, name: true } } };
exports.list = asyncHandler(async (req, res) => ok(res, await prisma.teacher.findMany({ include, orderBy: { name: 'asc' } })));
exports.create = asyncHandler(async (req, res) => ok(res, await prisma.teacher.create({ data: clean(schema.parse(req.body)), include }), 'Teacher added', 201));
exports.update = asyncHandler(async (req, res) => ok(res, await prisma.teacher.update({ where: { id: req.params.id }, data: clean(schema.partial().parse(req.body)), include }), 'Teacher updated'));
exports.remove = asyncHandler(async (req, res) => { await prisma.teacher.delete({ where: { id: req.params.id } }); ok(res, {}, 'Teacher removed'); }); // subjects keep existing, teacher unassigned
