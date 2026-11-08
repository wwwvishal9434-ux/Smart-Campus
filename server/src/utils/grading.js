// Centralised grade scale. Change thresholds here and every screen/report follows.
const GRADE_SCALE = [[90, 'A+'], [80, 'A'], [70, 'B+'], [60, 'B'], [50, 'C'], [40, 'D'], [0, 'F']];
const PASS_PERCENTAGE = 40;
exports.GRADE_SCALE = GRADE_SCALE;
exports.percentage = (obtained, max) => (max ? Math.round((obtained / max) * 1000) / 10 : 0);
exports.gradeOf = (pct) => GRADE_SCALE.find(([min]) => pct >= min)[1];
exports.statusOf = (pct) => (pct >= PASS_PERCENTAGE ? 'PASS' : 'FAIL');
