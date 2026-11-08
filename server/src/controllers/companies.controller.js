const { z } = require('zod');
const prisma = require('../config/prisma');
const { ok, asyncHandler } = require('../utils/helpers');
const opt = (s) => s.optional().or(z.literal(''));
const schema = z.object({ name: z.string().trim().min(2).max(100), website: opt(z.string().trim().url('Enter a valid URL')), logoUrl: opt(z.string().trim().url('Enter a valid URL')),
  description: opt(z.string().trim().max(1000)), industry: opt(z.string().trim().max(80)), location: opt(z.string().trim().max(100)), contactEmail: opt(z.string().trim().email('Enter a valid email')) });
const clean = (d) => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v === '' ? null : v]));
const shape = (c) => ({ ...c, jobCount: c._count.jobs });
const inc = { _count: { select: { jobs: true } } };
exports.list = asyncHandler(async (req, res) => ok(res, (await prisma.company.findMany({ include: inc, orderBy: { name: 'asc' } })).map(shape)));
exports.create = asyncHandler(async (req, res) => ok(res, shape(await prisma.company.create({ data: clean(schema.parse(req.body)), include: inc })), 'Company added', 201));
exports.update = asyncHandler(async (req, res) => ok(res, shape(await prisma.company.update({ where: { id: req.params.id }, data: clean(schema.partial().parse(req.body)), include: inc })), 'Company updated'));
exports.remove = asyncHandler(async (req, res) => { await prisma.company.delete({ where: { id: req.params.id } }); ok(res, {}, 'Company deleted'); });
