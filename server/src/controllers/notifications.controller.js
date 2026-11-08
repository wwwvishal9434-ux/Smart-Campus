const { z } = require('zod');
const prisma = require('../config/prisma');
const { ok, asyncHandler } = require('../utils/helpers');
const schema = z.object({ title: z.string().trim().min(3).max(120), message: z.string().trim().min(5).max(2000),
  category: z.enum(['GENERAL', 'ACADEMIC', 'EXAMINATION', 'PLACEMENT', 'ASSIGNMENT', 'EVENT']), audience: z.enum(['ALL', 'STUDENTS', 'ADMINS']).default('ALL') });
exports.list = asyncHandler(async (req, res) => ok(res, await prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 300 })));
exports.mine = asyncHandler(async (req, res) => {
  const { category } = req.query;
  ok(res, await prisma.notification.findMany({ where: { audience: { in: ['ALL', 'STUDENTS'] }, ...(category && { category }) }, orderBy: { createdAt: 'desc' }, take: 100 }));
});
exports.create = asyncHandler(async (req, res) => ok(res, await prisma.notification.create({ data: { ...schema.parse(req.body), createdById: req.user.id } }), 'Notification published', 201));
exports.update = asyncHandler(async (req, res) => ok(res, await prisma.notification.update({ where: { id: req.params.id }, data: schema.partial().parse(req.body) }), 'Notification updated'));
exports.remove = asyncHandler(async (req, res) => { await prisma.notification.delete({ where: { id: req.params.id } }); ok(res, {}, 'Notification deleted'); });
