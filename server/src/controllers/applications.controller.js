const { z } = require('zod');
const prisma = require('../config/prisma');
const { ok, asyncHandler } = require('../utils/helpers');
const STATUSES = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'];
const inc = { job: { select: { title: true, company: { select: { name: true } } } } };
exports.list = asyncHandler(async (req, res) => {
  const { status, q } = req.query;
  const rows = await prisma.jobApplication.findMany({ where: { ...(status && { status }), ...(q && { student: { OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { enrollmentNo: { contains: q, mode: 'insensitive' } }] } }) },
    include: { ...inc, student: { select: { fullName: true, enrollmentNo: true, semester: true } } }, orderBy: { appliedAt: 'desc' }, take: 300 });
  ok(res, rows.map((a) => ({ id: a.id, status: a.status, appliedAt: a.appliedAt, coverNote: a.coverNote, studentName: a.student.fullName, enrollmentNo: a.student.enrollmentNo, semester: a.student.semester, jobTitle: a.job.title, companyName: a.job.company.name })));
});
exports.setStatus = asyncHandler(async (req, res) => {
  const { status } = z.object({ status: z.enum(STATUSES) }).parse(req.body);
  await prisma.jobApplication.update({ where: { id: req.params.id }, data: { status } }); ok(res, { status }, 'Status updated');
});
exports.stats = asyncHandler(async (req, res) => {
  const distinct = async (statuses) => (await prisma.jobApplication.groupBy({ by: ['studentId'], where: { status: { in: statuses } } })).length;
  const [companies, jobs, applications, totalStudents, byStatus, shortlisted, selected] = await Promise.all([prisma.company.count(), prisma.job.count(), prisma.jobApplication.count(), prisma.student.count(),
    prisma.jobApplication.groupBy({ by: ['status'], _count: { _all: true } }), distinct(['SHORTLISTED', 'INTERVIEW', 'SELECTED']), distinct(['SELECTED'])]);
  const counts = Object.fromEntries(byStatus.map((x) => [x.status, x._count._all]));
  ok(res, { companies, jobs, applications, shortlisted, selected, placementRate: totalStudents ? Math.round((selected / totalStudents) * 1000) / 10 : 0, byStatus: STATUSES.map((s) => ({ status: s, count: counts[s] || 0 })) });
});
exports.mine = asyncHandler(async (req, res) => {
  const rows = await prisma.jobApplication.findMany({ where: { studentId: req.student.id }, include: inc, orderBy: { appliedAt: 'desc' } });
  ok(res, rows.map((a) => ({ id: a.id, status: a.status, appliedAt: a.appliedAt, updatedAt: a.updatedAt, jobTitle: a.job.title, companyName: a.job.company.name })));
});
