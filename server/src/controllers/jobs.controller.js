const { z } = require('zod');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { studentPercentage, checkEligibility } = require('../utils/eligibility');
const { ok, asyncHandler } = require('../utils/helpers');
const base = z.object({ companyId: z.string().min(1, 'Select a company'), title: z.string().trim().min(3).max(120), description: z.string().trim().min(10).max(3000), location: z.string().trim().min(2).max(100),
  jobType: z.enum(['FULL_TIME', 'INTERNSHIP', 'PART_TIME', 'CONTRACT']), package: z.string().trim().max(60).optional().or(z.literal('')), minPercentage: z.coerce.number().min(0).max(100).default(0),
  eligibleCourseIds: z.array(z.string()).default([]), eligibleSemesters: z.array(z.coerce.number().int().min(1).max(12)).default([]), skills: z.array(z.string().trim().min(1)).default([]),
  deadline: z.coerce.date(), openings: z.coerce.number().int().min(1).max(1000).default(1) });
const toData = ({ eligibleCourseIds, package: pkg, ...d }) => ({ ...d, ...(pkg !== undefined && { package: pkg || null }), ...(eligibleCourseIds && { eligibleCourses: { set: eligibleCourseIds.map((id) => ({ id })) } }) });
const inc = { company: { select: { name: true, location: true, website: true } }, eligibleCourses: { select: { id: true, name: true } } };
const shape = (j) => ({ id: j.id, companyId: j.companyId, companyName: j.company.name, title: j.title, description: j.description, location: j.location, jobType: j.jobType, package: j.package,
  minPercentage: j.minPercentage, eligibleCourseIds: j.eligibleCourses.map((c) => c.id), courseNames: j.eligibleCourses.map((c) => c.name), eligibleSemesters: j.eligibleSemesters, skills: j.skills, deadline: j.deadline, openings: j.openings });
exports.list = asyncHandler(async (req, res) => {
  const rows = await prisma.job.findMany({ include: { ...inc, _count: { select: { applications: true } } }, orderBy: { deadline: 'desc' } });
  ok(res, rows.map((j) => ({ ...shape(j), applicationCount: j._count.applications })));
});
exports.create = asyncHandler(async (req, res) => {
  const d = base.parse(req.body);
  if (d.deadline <= new Date()) throw new AppError('Deadline must be in the future', 400);
  if (!(await prisma.company.findUnique({ where: { id: d.companyId } }))) throw new AppError('Company not found', 400);
  const { eligibleCourseIds, ...rest } = toData(d); const data = { ...rest, eligibleCourses: { connect: d.eligibleCourseIds.map((id) => ({ id })) } };
  ok(res, shape(await prisma.job.create({ data, include: inc })), 'Job created', 201);
});
exports.update = asyncHandler(async (req, res) => ok(res, shape(await prisma.job.update({ where: { id: req.params.id }, data: toData(base.partial().parse(req.body)), include: inc })), 'Job updated'));
exports.remove = asyncHandler(async (req, res) => { await prisma.job.delete({ where: { id: req.params.id } }); ok(res, {}, 'Job deleted'); });
exports.mine = asyncHandler(async (req, res) => {
  const s = req.student; const { q, jobType } = req.query;
  const [pct, rows] = await Promise.all([studentPercentage(prisma, s.id), prisma.job.findMany({
    where: { ...(jobType && { jobType }), ...(q && { OR: [{ title: { contains: q, mode: 'insensitive' } }, { company: { name: { contains: q, mode: 'insensitive' } } }, { location: { contains: q, mode: 'insensitive' } }] }) },
    include: { ...inc, applications: { where: { studentId: s.id }, select: { status: true } } }, orderBy: { deadline: 'asc' } })]);
  ok(res, { percentage: pct, items: rows.map((j) => ({ ...shape(j), ...checkEligibility({ student: s, job: j, percentage: pct }), applicationStatus: j.applications[0]?.status || null })) });
});
exports.apply = asyncHandler(async (req, res) => {
  const s = req.student; const { coverNote } = z.object({ coverNote: z.string().trim().max(1000).optional() }).parse(req.body);
  const job = await prisma.job.findUnique({ where: { id: req.params.id }, include: { eligibleCourses: { select: { id: true } } } });
  if (!job) throw new AppError('Job not found', 404);
  if (await prisma.jobApplication.findUnique({ where: { jobId_studentId: { jobId: job.id, studentId: s.id } } })) throw new AppError('You have already applied for this job', 409);
  const { eligible, reasons } = checkEligibility({ student: s, job, percentage: await studentPercentage(prisma, s.id) });
  if (!eligible) throw new AppError(`You are not eligible: ${reasons.join('; ')}`, 403);
  await prisma.jobApplication.create({ data: { jobId: job.id, studentId: s.id, coverNote: coverNote || null } });
  ok(res, {}, 'Application submitted', 201);
});
