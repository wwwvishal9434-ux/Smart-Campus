// Integration tests against a REAL PostgreSQL database (use a throwaway/dev DB!).
//   1) createdb smart_campus_test, set DATABASE_URL + JWT_SECRET in server/.env
//   2) npx prisma migrate deploy && npm run seed -- --reset
//   3) npm run test:api
const test = require('node:test'); const assert = require('node:assert/strict'); const request = require('supertest'); const app = require('../../src/app');
const ADMIN_PW = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345'; const uniq = Date.now().toString().slice(-8); const PW = 'Strong@123';
const S = { cleanup: [] }; const api = () => request(app); const auth = (t) => ({ Authorization: `Bearer ${t}` });
const future = (d) => new Date(Date.now() + d * 864e5).toISOString();

test('setup: admin login and BCA course', async () => {
  const r = await api().post('/api/auth/login').send({ email: 'admin@smartcampus.com', password: ADMIN_PW }); assert.equal(r.status, 200); S.admin = r.body.data.token;
  const c = await api().get('/api/courses/public'); S.course = c.body.data.find((x) => x.code === 'BCA').id;
});
test('registration: success, duplicates and weak password', async () => {
  const body = { fullName: 'Test Student', email: `t${uniq}@example.com`, password: PW, confirmPassword: PW, enrollmentNo: `T${uniq}`, courseId: S.course, semester: 5, phone: '9876543210' };
  const r = await api().post('/api/auth/register').send(body); assert.equal(r.status, 201); S.stu = r.body.data.token; S.email = body.email; S.stuProfile = r.body.data.profile;
  assert.equal((await api().post('/api/auth/register').send(body)).status, 409);
  assert.equal((await api().post('/api/auth/register').send({ ...body, email: `x${uniq}@e.com`, password: 'weak', confirmPassword: 'weak' })).status, 400);
});
test('login and role-based authorization', async () => {
  assert.equal((await api().post('/api/auth/login').send({ email: S.email, password: 'Wrong@123' })).status, 401);
  assert.equal((await api().post('/api/auth/login').send({ email: S.email, password: PW })).status, 200);
  assert.equal((await api().get('/api/students')).status, 401);
  assert.equal((await api().get('/api/students').set(auth(S.stu))).status, 403);
  assert.equal((await api().get('/api/students/me').set(auth(S.stu))).status, 200);
  assert.equal((await api().patch('/api/students/me').set(auth(S.stu)).send({ role: 'ADMIN' })).status, 400); // sensitive fields are not editable
  assert.equal((await api().patch('/api/students/me').set(auth(S.stu)).send({ address: 'Anupshahr' })).status, 200);
});
test('student CRUD by admin', async () => {
  const c = await api().post('/api/students').set(auth(S.admin)).send({ fullName: 'Crud Student', email: `c${uniq}@example.com`, password: PW, enrollmentNo: `C${uniq}`, courseId: S.course, semester: 3 }); assert.equal(c.status, 201);
  const id = c.body.data.id; assert.equal((await api().put(`/api/students/${id}`).set(auth(S.admin)).send({ fullName: 'Renamed', status: 'INACTIVE' })).status, 200);
  const l = await api().get(`/api/students?q=${`C${uniq}`}`).set(auth(S.admin)); assert.equal(l.body.data.total, 1); assert.equal(l.body.data.items[0].status, 'INACTIVE');
  assert.equal((await api().post('/api/auth/login').send({ email: `c${uniq}@example.com`, password: PW })).status, 403); // deactivated
  assert.equal((await api().delete(`/api/students/${id}`).set(auth(S.admin))).status, 200);
});
test('attendance marking and percentage', async () => {
  const subs = (await api().get('/api/subjects').set(auth(S.admin))).body.data; S.subj = subs.find((x) => x.code === 'BCA501');
  const date = '2026-01-05'; const sheet = await api().get('/api/attendance/sheet').query({ subjectId: S.subj.id, date }).set(auth(S.admin));
  assert.equal(sheet.status, 200); assert.ok(sheet.body.data.some((x) => x.id === S.stuProfile.id));
  const mark = await api().post('/api/attendance/mark').set(auth(S.admin)).send({ subjectId: S.subj.id, date, records: [{ studentId: S.stuProfile.id, status: 'PRESENT' }] }); assert.equal(mark.status, 200);
  await api().post('/api/attendance/mark').set(auth(S.admin)).send({ subjectId: S.subj.id, date: '2026-01-06', records: [{ studentId: S.stuProfile.id, status: 'ABSENT' }] });
  const me = await api().get('/api/attendance/me').set(auth(S.stu)); assert.equal(me.body.data.overall.percentage, 50);
});
test('assignments: create, submit, deadline enforcement', async () => {
  const mk = (title, d) => api().post('/api/assignments').set(auth(S.admin)).field('subjectId', S.subj.id).field('title', title).field('instructions', 'Do the task').field('deadline', future(d)).field('maxMarks', '10');
  const open = await mk('Open assignment', 3); assert.equal(open.status, 201); const closed = await mk('Closed assignment', -2); assert.equal(closed.status, 201); S.cleanup.push(`/api/assignments/${open.body.data.id}`, `/api/assignments/${closed.body.data.id}`);
  const file = (r) => r.attach('file', Buffer.from('answer'), { filename: 'answer.txt', contentType: 'text/plain' });
  const ok = await file(api().post(`/api/assignments/${open.body.data.id}/submit`).set(auth(S.stu))); assert.equal(ok.status, 201);
  assert.equal((await file(api().post(`/api/assignments/${closed.body.data.id}/submit`).set(auth(S.stu)))).status, 400);
  const bad = await api().post(`/api/assignments/${open.body.data.id}/submit`).set(auth(S.stu)).attach('file', Buffer.from('x'), { filename: 'virus.exe', contentType: 'application/x-msdownload' }); assert.equal(bad.status, 400);
  const subs = await api().get(`/api/assignments/${open.body.data.id}/submissions`).set(auth(S.admin)); const row = subs.body.data.rows.find((x) => x.id === S.stuProfile.id);
  assert.equal((await api().patch(`/api/assignments/submissions/${row.submission.id}/review`).set(auth(S.admin)).send({ marks: 11 })).status, 400);
  assert.equal((await api().patch(`/api/assignments/submissions/${row.submission.id}/review`).set(auth(S.admin)).send({ marks: 8, feedback: 'Good' })).status, 200);
});
test('exam: server-side scoring, hidden answers, single attempt', async () => {
  const e = await api().post('/api/exams').set(auth(S.admin)).send({ subjectId: S.subj.id, title: `Quiz ${uniq}`, examDate: future(-1), durationMinutes: 10, totalMarks: 2, passingMarks: 1, maxAttempts: 1, showAnswers: true }); assert.equal(e.status, 201); S.cleanup.push(`/api/exams/${e.body.data.id}`);
  const q = (text, c) => api().post(`/api/exams/${e.body.data.id}/questions`).set(auth(S.admin)).send({ text, optionA: 'one', optionB: 'two', optionC: 'three', optionD: 'four', correctOption: c, marks: 1 });
  const q1 = await q('First question?', 'A'); await q('Second question?', 'B');
  assert.equal((await api().put(`/api/exams/${e.body.data.id}`).set(auth(S.admin)).send({ isPublished: true })).status, 200);
  const start = await api().post(`/api/exams/${e.body.data.id}/start`).set(auth(S.stu)); assert.equal(start.status, 200);
  assert.ok(start.body.data.questions.every((x) => !('correctOption' in x))); // answers never sent before submission
  const done = await api().post(`/api/exams/attempts/${start.body.data.attemptId}/submit`).set(auth(S.stu)).send({ answers: { [q1.body.data.id]: 'A' }, score: 999 });
  assert.equal(done.status, 200); assert.equal(done.body.data.score, 1); assert.equal(done.body.data.passed, true); // client-sent score ignored
  assert.equal((await api().post(`/api/exams/${e.body.data.id}/start`).set(auth(S.stu))).status, 409);
});
test('results and grade calculation', async () => {
  const r = await api().post('/api/results').set(auth(S.admin)).send({ studentId: S.stuProfile.id, subjectId: S.subj.id, semester: 5, examType: 'INTERNAL', maxMarks: 50, obtainedMarks: 45 });
  assert.equal(r.status, 201); assert.deepEqual([r.body.data.percentage, r.body.data.grade], [90, 'A+']);
  assert.equal((await api().post('/api/results').set(auth(S.admin)).send({ studentId: S.stuProfile.id, subjectId: S.subj.id, semester: 5, examType: 'INTERNAL', maxMarks: 50, obtainedMarks: 40 })).status, 409);
  const me = await api().get('/api/results/me').set(auth(S.stu)); assert.equal(me.body.data.semesters[0].items[0].grade, 'A+');
});
test('placement: eligibility enforced, duplicate application blocked', async () => {
  const co = await api().post('/api/companies').set(auth(S.admin)).send({ name: `TestCo ${uniq}` }); assert.equal(co.status, 201); S.cleanup.push(`/api/companies/${co.body.data.id}`); // deleting a company also deletes its jobs
  const job = (title, min) => api().post('/api/jobs').set(auth(S.admin)).send({ companyId: co.body.data.id, title, description: 'A test job description', location: 'Noida', jobType: 'FULL_TIME', minPercentage: min, eligibleCourseIds: [S.course], eligibleSemesters: [5], skills: ['SQL'], deadline: future(10), openings: 2 });
  const easy = await job('Easy job', 60); const hard = await job('Hard job', 99); assert.equal(easy.status, 201);
  assert.equal((await api().post(`/api/jobs/${easy.body.data.id}/apply`).set(auth(S.stu)).send({})).status, 201); // 90% >= 60%
  assert.equal((await api().post(`/api/jobs/${easy.body.data.id}/apply`).set(auth(S.stu)).send({})).status, 409);
  assert.equal((await api().post(`/api/jobs/${hard.body.data.id}/apply`).set(auth(S.stu)).send({})).status, 403); // below minimum
  const mine = await api().get('/api/applications/mine').set(auth(S.stu)); assert.equal(mine.body.data.length, 1);
  const appId = (await api().get('/api/applications').query({ q: `T${uniq}` }).set(auth(S.admin))).body.data[0].id;
  assert.equal((await api().patch(`/api/applications/${appId}/status`).set(auth(S.admin)).send({ status: 'SHORTLISTED' })).status, 200);
});
test('cleanup: remove everything the tests created', async () => { for (const u of S.cleanup) assert.equal((await api().delete(u).set(auth(S.admin))).status, 200); assert.equal((await api().delete(`/api/students/${S.stuProfile.id}`).set(auth(S.admin))).status, 200); });
