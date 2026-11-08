const { z } = require('zod');
const prisma = require('../config/prisma');
const { ok, asyncHandler } = require('../utils/helpers');
const schema = z.object({ title: z.string().trim().min(3).max(120), description: z.string().trim().max(1000).optional().or(z.literal('')), eventDate: z.coerce.date(),
  eventTime: z.string().trim().max(20).optional().or(z.literal('')), location: z.string().trim().min(2).max(120), organizer: z.string().trim().min(2).max(120) });
const clean = (d) => ({ ...d, ...('description' in d && { description: d.description || null }), ...('eventTime' in d && { eventTime: d.eventTime || null }) });
exports.startOfToday = () => { const t = new Date(); t.setUTCHours(0, 0, 0, 0); return t; };
exports.list = asyncHandler(async (req, res) => ok(res, await prisma.event.findMany({ where: req.query.upcoming ? { eventDate: { gte: exports.startOfToday() } } : {}, orderBy: { eventDate: req.query.upcoming ? 'asc' : 'desc' }, take: 300 })));
exports.create = asyncHandler(async (req, res) => ok(res, await prisma.event.create({ data: clean(schema.parse(req.body)) }), 'Event created', 201));
exports.update = asyncHandler(async (req, res) => ok(res, await prisma.event.update({ where: { id: req.params.id }, data: clean(schema.partial().parse(req.body)) }), 'Event updated'));
exports.remove = asyncHandler(async (req, res) => { await prisma.event.delete({ where: { id: req.params.id } }); ok(res, {}, 'Event deleted'); });
