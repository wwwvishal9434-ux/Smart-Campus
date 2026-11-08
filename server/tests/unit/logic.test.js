const test = require('node:test'); const assert = require('node:assert/strict');
const { score, evaluate } = require('../../src/utils/scoring');
const { gradeOf, statusOf, percentage } = require('../../src/utils/grading');
const { checkEligibility } = require('../../src/utils/eligibility');
const { summarize } = require('../../src/utils/attendance');

test('exam scoring is computed from correct options, ignoring invalid input', () => {
  const qs = [{ id: 'q1', marks: 2, correctOption: 'A' }, { id: 'q2', marks: 3, correctOption: 'C' }, { id: 'q3', marks: 5, correctOption: 'D' }, { id: 'q4', marks: 1, correctOption: 'B' }];
  const r = score(qs, { q1: 'A', q2: 'B', q3: 'D', q4: 'Z', unknown: 'A' });
  assert.deepEqual([r.score, r.correct, r.incorrect, r.unanswered], [7, 2, 1, 1]);
  assert.equal(score(qs, {}).score, 0);
});
test('exam evaluation: percentage and pass mark boundary', () => {
  assert.deepEqual(evaluate(7, 11, 4), { percentage: 63.6, passed: true });
  assert.equal(evaluate(3, 10, 4).passed, false); assert.equal(evaluate(4, 10, 4).passed, true); assert.equal(evaluate(0, 0, 0).percentage, 0);
});
test('grade scale boundaries', () => {
  const g = (p) => gradeOf(p);
  assert.deepEqual([100, 90, 89.9, 80, 79.9, 70, 60, 50, 40, 39.9, 0].map(g), ['A+', 'A+', 'A', 'A', 'B+', 'B+', 'B', 'C', 'D', 'F', 'F']);
  assert.equal(statusOf(40), 'PASS'); assert.equal(statusOf(39.9), 'FAIL'); assert.equal(percentage(45, 50), 90); assert.equal(percentage(1, 0), 0);
});
test('attendance: PRESENT+LATE attended, EXCUSED excluded, ABSENT counts against', () => {
  const r = (s) => ({ status: s });
  assert.deepEqual(summarize([r('PRESENT'), r('LATE'), r('ABSENT'), r('EXCUSED')]), { attended: 2, total: 3, percentage: 66.7 });
  assert.deepEqual(summarize([]), { attended: 0, total: 0, percentage: 0 }); assert.equal(summarize([r('EXCUSED')]).percentage, 0);
});
test('placement eligibility rules', () => {
  const now = new Date('2026-11-01'); const st = { courseId: 'bca', semester: 5 };
  const job = (o) => ({ deadline: new Date('2026-12-01'), eligibleCourses: [], eligibleSemesters: [], minPercentage: 0, ...o });
  const chk = (j, pct) => checkEligibility({ student: st, job: j, percentage: pct, now });
  assert.equal(chk(job({}), null).eligible, true);
  assert.match(chk(job({ deadline: new Date('2026-10-01') }), 90).reasons[0], /deadline/);
  assert.equal(chk(job({ eligibleCourses: [{ id: 'bba' }] }), 90).eligible, false); assert.equal(chk(job({ eligibleCourses: [{ id: 'bca' }] }), 90).eligible, true);
  assert.equal(chk(job({ eligibleSemesters: [6] }), 90).eligible, false);
  assert.equal(chk(job({ minPercentage: 60 }), 55.5).eligible, false); assert.equal(chk(job({ minPercentage: 60 }), 60).eligible, true);
  assert.match(chk(job({ minPercentage: 60 }), null).reasons[0], /No academic results/);
});
