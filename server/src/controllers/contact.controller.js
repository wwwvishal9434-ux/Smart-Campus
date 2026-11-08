const { z } = require('zod');
const prisma = require('../config/prisma');
const { ok, asyncHandler } = require('../utils/helpers');
const schema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email(),
  subject: z.string().trim().min(3).max(120), message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000) });
exports.submit = asyncHandler(async (req, res) => { await prisma.contactMessage.create({ data: schema.parse(req.body) }); ok(res, {}, 'Message sent. Thank you!', 201); });
exports.list = asyncHandler(async (req, res) => ok(res, await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })));
exports.markRead = asyncHandler(async (req, res) => ok(res, await prisma.contactMessage.update({ where: { id: req.params.id }, data: { isRead: true } }), 'Marked as read'));
exports.remove = asyncHandler(async (req, res) => { await prisma.contactMessage.delete({ where: { id: req.params.id } }); ok(res, {}, 'Message deleted'); });
