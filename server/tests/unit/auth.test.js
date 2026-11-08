const prisma = require('../helpers/stub'); // must be first
const test = require('node:test'); const assert = require('node:assert/strict'); const jwt = require('jsonwebtoken'); const bcrypt = require('bcryptjs'); const { ZodError } = require('zod');
const { authenticate, authorize } = require('../../src/middleware/auth'); const { errorHandler } = require('../../src/middleware/error');
const svc = require('../../src/services/auth.service'); const v = require('../../src/validators/auth'); const AppError = require('../../src/utils/AppError');
const run = (mw, req) => new Promise((resolve) => mw(req, {}, resolve));
const tok = (p, o) => jwt.sign(p, 'unit-test-secret', o);
const valid = { fullName: 'Test User', email: 'T@Example.com', password: 'Strong@123', confirmPassword: 'Strong@123', enrollmentNo: 'M2481', courseId: 'c1', semester: '5', phone: '9876543210' };

test('authenticate rejects missing, malformed, expired and deactivated-account tokens', async () => {
  assert.equal((await run(authenticate, { headers: {} })).status, 401);
  assert.equal((await run(authenticate, { headers: { authorization: 'Bearer nope' } })).message, 'Invalid token');
  assert.match((await run(authenticate, { headers: { authorization: `Bearer ${tok({ sub: 'u1', role: 'ADMIN' }, { expiresIn: -10 })}` } })).message, /expired/);
  prisma.user = { findUnique: async () => ({ id: 'u1', role: 'STUDENT', status: 'INACTIVE' }) };
  assert.equal((await run(authenticate, { headers: { authorization: `Bearer ${tok({ sub: 'u1' })}` } })).status, 401);
});
test('authenticate attaches identity from the token/db, never from the request', async () => {
  prisma.user = { findUnique: async ({ where }) => ({ id: where.id, role: 'STUDENT', status: 'ACTIVE' }) };
  const req = { headers: { authorization: `Bearer ${tok({ sub: 'u9', role: 'ADMIN' })}` }, body: { role: 'ADMIN', userId: 'someone-else' } };
  assert.equal(await run(authenticate, req), undefined); assert.deepEqual(req.user, { id: 'u9', role: 'STUDENT', status: 'ACTIVE' }); // role comes from DB, not from token claim or body
});
test('role guard returns 403 for the wrong role', async () => {
  assert.equal((await run(authorize('ADMIN'), { user: { role: 'STUDENT' } })).status, 403); assert.equal(await run(authorize('ADMIN'), { user: { role: 'ADMIN' } }), undefined);
  assert.equal((await run(authorize('ADMIN'), {})).status, 403);
});
test('error handler maps validation, duplicate and not-found errors', () => {
  const out = (e) => { let r; errorHandler(e, {}, { status(s) { r = { s }; return this; }, json(b) { r.b = b; } }, () => {}); return r; };
  const z = out((() => { try { v.loginSchema.parse({ email: 'bad', password: '' }); } catch (e) { return e; } })());
  assert.equal(z.s, 400); assert.equal(z.b.success, false); assert.ok(z.b.errors.length >= 1);
  assert.equal(out({ code: 'P2002', meta: { target: ['email'] } }).s, 409); assert.equal(out({ code: 'P2025' }).s, 404); assert.equal(out(new AppError('nope', 418)).s, 418);
});
test('registration validation: strong password, matching confirmation, valid email/phone/semester', () => {
  assert.equal(v.registerSchema.parse(valid).email, 't@example.com');
  const bad = (o) => assert.throws(() => v.registerSchema.parse({ ...valid, ...o }), ZodError);
  bad({ password: 'weak', confirmPassword: 'weak' }); bad({ confirmPassword: 'Different@1' }); bad({ email: 'x' }); bad({ phone: '12' }); bad({ semester: '9' }); bad({ fullName: '' });
});
test('register rejects duplicate email and duplicate enrollment', async () => {
  const d = v.registerSchema.parse(valid);
  prisma.course = { findUnique: async () => ({ id: 'c1' }) }; prisma.user = { findUnique: async () => ({ id: 'x' }) }; prisma.student = { findUnique: async () => null };
  await assert.rejects(svc.register(d), (e) => e.status === 409 && /Email/.test(e.message));
  prisma.user.findUnique = async () => null; prisma.student.findUnique = async () => ({ id: 's' });
  await assert.rejects(svc.register(d), (e) => e.status === 409 && /Enrollment/.test(e.message));
});
test('login gives the same error for unknown email and wrong password; blocks inactive accounts', async () => {
  const hash = await bcrypt.hash('Right@123', 4);
  prisma.user = { findUnique: async () => null }; const a = await svc.login({ email: 'a@b.c', password: 'x' }).catch((e) => e);
  prisma.user = { findUnique: async () => ({ id: 'u', role: 'STUDENT', passwordHash: hash, status: 'ACTIVE' }) }; const b = await svc.login({ email: 'a@b.c', password: 'wrong' }).catch((e) => e);
  assert.equal(a.status, 401); assert.equal(a.message, b.message);
  prisma.user = { findUnique: async () => ({ id: 'u', role: 'STUDENT', passwordHash: hash, status: 'INACTIVE' }) };
  assert.equal((await svc.login({ email: 'a@b.c', password: 'Right@123' }).catch((e) => e)).status, 403);
});
test('password reset: token stored only as a hash, unknown emails reveal nothing, bad tokens rejected', async () => {
  let stored; prisma.passwordResetToken = { create: async ({ data }) => { stored = data; } };
  prisma.user = { findUnique: async () => null }; assert.deepEqual(await svc.forgotPassword('no@one.com'), {}); assert.equal(stored, undefined);
  prisma.user = { findUnique: async () => ({ id: 'u1', status: 'ACTIVE' }) };
  const { resetUrl } = await svc.forgotPassword('a@b.c'); const token = new URL(resetUrl).searchParams.get('token');
  assert.notEqual(stored.tokenHash, token); assert.equal(stored.tokenHash.length, 64); assert.ok(stored.expiresAt > new Date());
  const rec = { id: 'r1', userId: 'u1', usedAt: null, expiresAt: new Date(Date.now() + 1e5) };
  prisma.passwordResetToken.findUnique = async () => ({ ...rec, usedAt: new Date() }); await assert.rejects(svc.resetPassword({ token, password: 'New@12345' }), /invalid or has expired/);
  prisma.passwordResetToken.findUnique = async () => ({ ...rec, expiresAt: new Date(Date.now() - 1) }); await assert.rejects(svc.resetPassword({ token, password: 'New@12345' }), /invalid or has expired/);
  prisma.passwordResetToken.findUnique = async () => null; await assert.rejects(svc.resetPassword({ token, password: 'New@12345' }), /invalid or has expired/);
});
