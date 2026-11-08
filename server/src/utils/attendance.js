// Single source of truth for attendance rules:
// PRESENT and LATE count as attended; ABSENT counts against; EXCUSED is excluded from the total.
const ATTENDED = ['PRESENT', 'LATE'];
exports.summarize = (records) => {
  const counted = records.filter((r) => r.status !== 'EXCUSED');
  const attended = counted.filter((r) => ATTENDED.includes(r.status)).length;
  return { attended, total: counted.length, percentage: counted.length ? Math.round((attended / counted.length) * 1000) / 10 : 0 };
};
exports.toDate = (s) => new Date(`${s}T00:00:00.000Z`);
exports.iso = (d) => d.toISOString().slice(0, 10);
