// Placement eligibility. Empty course/semester lists mean "open to all".
exports.studentPercentage = async (prisma, studentId) => {
  const a = await prisma.academicResult.aggregate({ where: { studentId }, _sum: { obtainedMarks: true, maxMarks: true } });
  return a._sum.maxMarks ? Math.round((a._sum.obtainedMarks / a._sum.maxMarks) * 1000) / 10 : null;
};
exports.checkEligibility = ({ student, job, percentage, now = new Date() }) => {
  const reasons = [];
  if (now > job.deadline) reasons.push('The application deadline has passed');
  if (job.eligibleCourses.length && !job.eligibleCourses.some((c) => c.id === student.courseId)) reasons.push('This job is not open to your course');
  if (job.eligibleSemesters.length && !job.eligibleSemesters.includes(student.semester)) reasons.push(`Open only for semester ${job.eligibleSemesters.join(', ')}`);
  if (job.minPercentage > 0) {
    if (percentage === null) reasons.push('No academic results on record yet');
    else if (percentage < job.minPercentage) reasons.push(`Minimum ${job.minPercentage}% required (yours is ${percentage}%)`);
  }
  return { eligible: reasons.length === 0, reasons };
};
