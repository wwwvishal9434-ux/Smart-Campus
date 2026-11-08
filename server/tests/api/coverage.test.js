// Second integration suite: every screen's data endpoint returns 200 for the right role on the seeded database,
// plus file upload/download and the notification/event/contact workflows. Run after `npm run seed`.
const test = require('node:test'); const assert = require('node:assert/strict'); const request = require('supertest'); const app = require('../../src/app');
const ADMIN_PW = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345'; const STU_PW = process.env.SEED_STUDENT_PASSWORD || 'Student@12345'; const A = {}; const S = {}; const api = () => request(app); const h = (t) => ({ Authorization: `Bearer ${t}` });
const get = (t, u) => api().get(u).set(h(t));

test('login as seeded admin and student', async () => {
  A.t = (await api().post('/api/auth/login').send({ email: 'admin@smartcampus.com', password: ADMIN_PW })).body.data.token;
  const r = await api().post('/api/auth/login').send({ email: 'student@smartcampus.com', password: STU_PW }); assert.equal(r.status, 200); S.t = r.body.data.token; S.p = r.body.data.profile;
  assert.equal((await get(S.t, '/api/auth/me')).body.data.user.role, 'STUDENT'); assert.equal((await api().post('/api/auth/logout').set(h(S.t))).status, 200);
});
test('admin: every list/analytics endpoint returns 200 with data', async () => {
  const subjects = (await get(A.t, '/api/subjects')).body.data; const subj = subjects.find((s) => s.code === 'BCA501'); const date = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const asg = (await get(A.t, '/api/assignments')).body.data; const exams = (await get(A.t, '/api/exams')).body.data;
  const urls = ['/api/dashboard/admin', '/api/students', '/api/students/options', '/api/teachers', '/api/courses', '/api/subjects', `/api/attendance/report?subjectId=${subj.id}`, `/api/attendance/sheet?subjectId=${subj.id}&date=${date}`, '/api/notes',
    '/api/assignments', `/api/assignments/${asg[0].id}/submissions`, '/api/exams', `/api/exams/${exams[0].id}/questions`, '/api/results', '/api/companies', '/api/jobs', '/api/applications', '/api/applications/stats', '/api/notifications', '/api/events', '/api/contact'];
  for (const u of urls) { const r = await get(A.t, u); assert.equal(r.status, 200, `${u} -> ${r.status} ${r.body.message}`); }
  const d = (await get(A.t, '/api/dashboard/admin')).body.data.totals; assert.equal(d.students, 16); assert.equal(d.teachers, 3); assert.ok(d.averageAttendance > 50);
});
test('student: every screen endpoint returns 200 and dashboard reflects the seeded data', async () => {
  for (const u of ['/api/dashboard/student', '/api/students/me', '/api/attendance/me', '/api/notes', '/api/assignments/mine', '/api/exams/mine', '/api/results/me', '/api/jobs/mine', '/api/applications/mine', '/api/notifications/mine', '/api/events?upcoming=1', '/api/subjects', '/api/courses/public']) {
    const r = await get(S.t, u); assert.equal(r.status, 200, `${u} -> ${r.status} ${r.body.message}`); }
  const d = (await get(S.t, '/api/dashboard/student')).body.data; assert.equal(d.profile.fullName, 'Vishal Sharma'); assert.ok(d.attendance.total > 0); assert.ok(d.upcomingEvents.length > 0);
  const res = (await get(S.t, '/api/results/me')).body.data; assert.equal(res.semesters[0].items.length, 8); assert.ok(res.semesters[0].percentage > 0);
});
test('notes: admin uploads, student downloads identical bytes, bad type rejected', async () => {
  const subj = (await get(A.t, '/api/subjects')).body.data.find((s) => s.code === 'BCA501'); const body = Buffer.from('Hello Smart Campus notes\n');
  const up = await api().post('/api/notes').set(h(A.t)).field('title', 'Round trip note').field('subjectId', subj.id).attach('file', body, { filename: 'roundtrip.txt', contentType: 'text/plain' }); assert.equal(up.status, 201, up.body.message);
  const dl = await get(S.t, `/api/notes/${up.body.data.id}/download`).buffer(true).parse((res, cb) => { const c = []; res.on('data', (x) => c.push(x)); res.on('end', () => cb(null, Buffer.concat(c))); });
  assert.equal(dl.status, 200); assert.deepEqual(dl.body, body); assert.match(dl.headers['content-disposition'], /roundtrip\.txt/);
  assert.equal((await api().post('/api/notes').set(h(A.t)).field('title', 'Bad').field('subjectId', subj.id).attach('file', Buffer.from('x'), { filename: 'a.exe', contentType: 'application/octet-stream' })).status, 400);
  assert.equal((await api().delete(`/api/notes/${up.body.data.id}`).set(h(A.t))).status, 200); assert.equal((await get(S.t, `/api/notes/${up.body.data.id}/download`)).status, 404);
});
test('notifications, events, contact messages', async () => {
  const n = await api().post('/api/notifications').set(h(A.t)).send({ title: 'Test notice', message: 'Hello students', category: 'GENERAL', audience: 'STUDENTS' }); assert.equal(n.status, 201);
  assert.ok((await get(S.t, '/api/notifications/mine')).body.data.some((x) => x.id === n.body.data.id));
  const ao = await api().post('/api/notifications').set(h(A.t)).send({ title: 'Admins only', message: 'Hidden from students', category: 'GENERAL', audience: 'ADMINS' });
  assert.ok(!(await get(S.t, '/api/notifications/mine')).body.data.some((x) => x.id === ao.body.data.id));
  await api().delete(`/api/notifications/${n.body.data.id}`).set(h(A.t)); await api().delete(`/api/notifications/${ao.body.data.id}`).set(h(A.t));
  const e = await api().post('/api/events').set(h(A.t)).send({ title: 'Test event', eventDate: '2030-01-15', location: 'Hall', organizer: 'Dept' }); assert.equal(e.status, 201);
  assert.ok((await get(S.t, '/api/events?upcoming=1')).body.data.some((x) => x.id === e.body.data.id)); assert.equal((await api().delete(`/api/events/${e.body.data.id}`).set(h(A.t))).status, 200);
  assert.equal((await api().post('/api/contact').send({ name: 'Visitor', email: 'v@example.com', subject: 'Hello there', message: 'This is a test message.' })).status, 201);
  assert.equal((await api().post('/api/contact').send({ name: 'V', email: 'bad', subject: 'x', message: 'short' })).status, 400);
  const msgs = (await get(A.t, '/api/contact')).body.data; const m = msgs.find((x) => x.subject === 'Hello there'); assert.ok(m);
  assert.equal((await api().patch(`/api/contact/${m.id}/read`).set(h(A.t))).status, 200); assert.equal((await api().delete(`/api/contact/${m.id}`).set(h(A.t))).status, 200);
});
test('placement and exam rules on seeded data', async () => {
  const jobs = (await get(S.t, '/api/jobs/mine')).body.data; assert.equal(jobs.percentage !== null, true); const expired = jobs.items.find((j) => j.title === 'Process Executive');
  assert.equal(expired.eligible, false); assert.equal((await api().post(`/api/jobs/${expired.id}/apply`).set(h(S.t)).send({})).status, 403);
  const mine = (await get(S.t, '/api/exams/mine')).body.data; const quiz = mine.find((e) => e.title === 'Web Technologies Quiz 1'); const future = mine.find((e) => e.title === 'Software Engineering Unit Test');
  assert.ok(quiz.last); assert.equal((await api().post(`/api/exams/${quiz.id}/start`).set(h(S.t))).status, 409); assert.equal((await api().post(`/api/exams/${future.id}/start`).set(h(S.t))).status, 400);
  assert.equal(mine.some((e) => e.title.includes('draft')), false); // unpublished exams are invisible to students
});
