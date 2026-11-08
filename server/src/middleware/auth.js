const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { jwtSecret } = require('../config/env');
const AppError = require('../utils/AppError');
const { asyncHandler } = require('../utils/helpers');

const authenticate = asyncHandler(async (req, res, next) => {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) throw new AppError('Authorization token missing', 401);
  let payload;
  try { payload = jwt.verify(h.slice(7), jwtSecret); }
  catch (e) { throw new AppError(e.name === 'TokenExpiredError' ? 'Session expired, please log in again' : 'Invalid token', 401); }
  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true, status: true } });
  if (!user || user.status !== 'ACTIVE') throw new AppError('Account not found or deactivated', 401);
  req.user = user; // identity always comes from the token, never from request body/params
  next();
});

const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : next(new AppError('You do not have permission to perform this action', 403));

// Resolves the logged-in student's profile id from the token (prevents accessing other students' data)
const requireStudent = [authenticate, authorize('STUDENT'), asyncHandler(async (req, res, next) => {
  const s = await prisma.student.findUnique({ where: { userId: req.user.id }, select: { id: true, courseId: true, semester: true } });
  if (!s) throw new AppError('Student profile not found', 404);
  req.student = s; next();
})];
const requireAdmin = [authenticate, authorize('ADMIN')];

module.exports = { authenticate, authorize, requireStudent, requireAdmin };
