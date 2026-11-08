const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const env = require('../config/env');
const AppError = require('../utils/AppError');

const sign = (u) => jwt.sign({ sub: u.id, role: u.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const profileOf = async (u) => u.role === 'STUDENT'
  ? prisma.student.findUnique({ where: { userId: u.id }, include: { course: { select: { id: true, name: true, code: true } } } })
  : u.role === 'ADMIN' ? prisma.admin.findUnique({ where: { userId: u.id } }) : null;

async function register(d) {
  if (!(await prisma.course.findUnique({ where: { id: d.courseId } }))) throw new AppError('Selected course does not exist', 400);
  if (await prisma.user.findUnique({ where: { email: d.email } })) throw new AppError('Email is already registered', 409);
  if (await prisma.student.findUnique({ where: { enrollmentNo: d.enrollmentNo } })) throw new AppError('Enrollment number is already registered', 409);
  const user = await prisma.user.create({ data: {
    email: d.email, role: 'STUDENT', passwordHash: await bcrypt.hash(d.password, 12),
    student: { create: { fullName: d.fullName, enrollmentNo: d.enrollmentNo, courseId: d.courseId, semester: d.semester, phone: d.phone } },
  } });
  return { token: sign(user), user: { id: user.id, email: user.email, role: user.role }, profile: await profileOf(user) };
}
async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user && await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError('Invalid email or password', 401);
  if (user.status !== 'ACTIVE') throw new AppError('Your account is deactivated. Contact the administrator.', 403);
  return { token: sign(user), user: { id: user.id, email: user.email, role: user.role }, profile: await profileOf(user) };
}
async function me(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true } });
  return { user, profile: await profileOf(user) };
}
async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== 'ACTIVE') return {};      // never reveal whether an email exists
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: sha(token), expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
  const resetUrl = `${env.clientUrl}/reset-password?token=${token}`;
  // TODO(email provider): send `resetUrl` by email here (Nodemailer/Resend/SES). Development only: expose it.
  if (env.nodeEnv !== 'production') { console.log('[DEV] Password reset URL:', resetUrl); return { resetUrl }; }
  return {};
}
async function resetPassword({ token, password }) {
  const rec = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha(token) } });
  if (!rec || rec.usedAt || rec.expiresAt < new Date()) throw new AppError('Reset link is invalid or has expired', 400);
  await prisma.$transaction([
    prisma.user.update({ where: { id: rec.userId }, data: { passwordHash: await bcrypt.hash(password, 12) } }),
    prisma.passwordResetToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } }),
  ]);
}
module.exports = { register, login, me, forgotPassword, resetPassword };
