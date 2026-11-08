// Audits the real Express app (database replaced by a fake):
//  1) every route enforces its guard: public / any logged-in / admin-only / student-only
//  2) every API call the React client makes matches a route the server actually has
const prisma = require('../helpers/stub'); // must be first
const test = require('node:test'); const assert = require('node:assert/strict'); const fs = require('fs'); const path = require('path'); const jwt = require('jsonwebtoken'); const request = require('supertest');
const app = require('../../src/app'); console.error = () => {}; // 500s from the fake database are expected noise
const R = path.join(__dirname, '../../src/routes'); const C = path.join(__dirname, '../../../client/src');
// Fake database: every model method rejects asynchronously ("no db"), except the two lookups the auth guards need.
const model = (over = {}) => new Proxy({}, { get: (_, k) => over[k] || (async () => { throw new Error('no db'); }) });
for (const m of ['academicResult', 'admin', 'assignment', 'assignmentSubmission', 'attendance', 'company', 'contactMessage', 'course', 'event', 'examAnswer', 'examAttempt', 'examination', 'job', 'jobApplication', 'note', 'notification', 'passwordResetToken', 'question', 'subject', 'teacher']) prisma[m] = model();
prisma.$transaction = async (ops) => { await Promise.allSettled([].concat(ops)); throw new Error('no db'); }; // like real Prisma, settle the queries it was given
prisma.user = model({ findUnique: async ({ where }) => ({ id: where.id, role: where.id === 'adm' ? 'ADMIN' : 'STUDENT', status: 'ACTIVE' }) });
prisma.student = model({ findUnique: async () => ({ id: 's1', courseId: 'c1', semester: 5 }) });
const tok = (id) => ({ Authorization: `Bearer ${jwt.sign({ sub: id }, 'unit-test-secret')}` });
const norm = (p) => p.replace(/:\w+/g, 'x');

function serverRoutes() {
  const out = []; const add = (m, prefix, p, guard) => out.push({ method: m, url: `/api${prefix}${p === '/' ? '' : p}`, guard });
  const guardOf = (line, fallback) => (/requireAdmin/.test(line) ? 'admin' : /requireStudent/.test(line) ? 'student' : /authenticate/.test(line) ? 'any' : fallback);
  const single = { 'auth.routes.js': '/auth', 'courses.routes.js': '/courses', 'contact.routes.js': '/contact', 'students.routes.js': '/students', 'teachers.routes.js': '/teachers', 'subjects.routes.js': '/subjects',
    'attendance.routes.js': '/attendance', 'notes.routes.js': '/notes', 'assignments.routes.js': '/assignments', 'exams.routes.js': '/exams', 'results.routes.js': '/results', 'dashboard.routes.js': '/dashboard' };
  for (const [file, prefix] of Object.entries(single)) { const src = fs.readFileSync(path.join(R, file), 'utf8'); const fallback = /router\.use\((\.\.\.)?requireAdmin\)/.test(src) ? 'admin' : 'public';
    for (const m of src.matchAll(/router\.(get|post|put|patch|delete)\(\s*'([^']*)'\s*,([^;]*)/g)) add(m[1], prefix, m[2], guardOf(m[3], fallback)); }
  const feeds = fs.readFileSync(path.join(R, 'feeds.routes.js'), 'utf8'); const vars = { notifications: '/notifications', events: '/events' };
  for (const m of feeds.matchAll(/\b(notifications|events)\.(get|post|put|patch|delete)\(\s*'([^']*)'\s*,([^;]*)/g)) add(m[2], vars[m[1]], m[3], guardOf(m[4], 'public'));
  const crud = [['get', '/'], ['post', '/'], ['put', '/:id'], ['delete', '/:id']]; // placement.routes.js builds these through crud()
  crud.forEach(([m, p]) => ['/companies', '/jobs'].forEach((pre) => add(m, pre, p, 'admin')));
  add('get', '/jobs', '/mine', 'student'); add('post', '/jobs', '/:id/apply', 'student'); add('get', '/applications', '/mine', 'student');
  add('get', '/applications', '/stats', 'admin'); add('get', '/applications', '/', 'admin'); add('patch', '/applications', '/:id/status', 'admin'); add('get', '/health', '', 'public');
  return out.map((r) => ({ ...r, url: norm(r.url) }));
}
const routes = serverRoutes();

test('route table was parsed (sanity)', () => { assert.ok(routes.length >= 85, `only ${routes.length} routes parsed`); assert.ok(['public', 'any', 'admin', 'student'].every((g) => routes.some((r) => r.guard === g))); });
test('every route enforces its guard for anonymous, student and admin callers', async () => {
  const bad = []; const blocked = (s) => s === 401 || s === 403 || s === 404;
  for (const r of routes) {
    const call = (h) => request(app)[r.method](r.url).set(h || {}).send({});
    const anon = (await call()).status, stu = (await call(tok('stu'))).status, adm = (await call(tok('adm'))).status;
    const want = { public: [false, false, false], any: [true, false, false], admin: [true, 403, false], student: [true, false, 403] }[r.guard];
    if (want[0] === true ? anon !== 401 : blocked(anon)) bad.push(`${r.method.toUpperCase()} ${r.url} anonymous -> ${anon}`);
    if (want[1] === 403 ? stu !== 403 : blocked(stu)) bad.push(`${r.method.toUpperCase()} ${r.url} student -> ${stu}`);
    if (want[2] === 403 ? adm !== 403 : blocked(adm)) bad.push(`${r.method.toUpperCase()} ${r.url} admin -> ${adm}`);
  }
  assert.deepEqual(bad, []);
});
test('unknown routes return 404 JSON', async () => { const r = await request(app).get('/api/nope'); assert.equal(r.status, 404); assert.equal(r.body.success, false); });

function clientCalls() {
  const calls = new Set(); const files = []; const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.jsx?$/.test(e.name) && files.push(path.join(d, e.name))));
  walk(C); const clean = (s) => s.slice(1, -1).replace(/\$\{[^}]*\}/g, 'x').split('?')[0];
  for (const f of files) { const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/\bapi\.(get|post|put|patch|delete)\(\s*(`[^`]*`|'[^']*'|"[^"]*")/g)) { const u = clean(m[2]); if (u.startsWith('/')) calls.add(`${m[1]} ${u}`); }
    for (const m of src.matchAll(/downloadFile\(\s*(`[^`]*`|'[^']*')/g)) calls.add(`get ${clean(m[1])}`);
    for (const m of src.matchAll(/endpoint="(\/[^"]+)"/g)) ['get ' + m[1], 'post ' + m[1], `put ${m[1]}/x`, `delete ${m[1]}/x`].forEach((c) => calls.add(c));
    for (const m of src.matchAll(/optionsFrom: \{ url: '(\/[^']+)'/g)) calls.add(`get ${m[1]}`); }
  return [...calls];
}
test('every API call made by the React client exists on the server', async () => {
  const calls = clientCalls(); assert.ok(calls.length >= 60, `only ${calls.length} client calls found`); const missing = [];
  for (const c of calls) { const [m, u] = c.split(' '); const r = await request(app)[m](`/api${u}`).set(tok('adm')).send({}); if (r.status === 404 && /^Route not found/.test(r.body.message || '')) missing.push(c); }
  assert.deepEqual(missing, []);
});
