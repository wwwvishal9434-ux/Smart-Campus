// Full demo seed. Safe by default: refuses to touch a database that already has users.
//   npm run seed              -> seed an empty database
//   npm run seed -- --reset   -> wipe everything, then seed (blocked in production unless SEED_FORCE=1)
require('dotenv').config();
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { score: scoreAnswers, evaluate } = require('../src/utils/scoring');
const prisma = new PrismaClient();
const ADMIN_PW = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345'; const STUDENT_PW = process.env.SEED_STUDENT_PASSWORD || 'Student@12345';
const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads'); fs.mkdirSync(uploadDir, { recursive: true });
let s = 42; const rnd = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; // deterministic
const pick = (a) => a[Math.floor(rnd() * a.length)];
const inDays = (n) => new Date(Date.now() + n * 864e5);
const dayUTC = (n) => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + n); return d; };
const makeFile = (text) => { const fileKey = `${crypto.randomUUID()}.txt`; fs.writeFileSync(path.join(uploadDir, fileKey), text); return { fileKey, fileSize: Buffer.byteLength(text) }; };
const chunk = async (rows, fn, n = 1000) => { for (let i = 0; i < rows.length; i += n) await fn(rows.slice(i, i + n)); };
const WIPE = ['examAnswer', 'examAttempt', 'question', 'examination', 'assignmentSubmission', 'assignment', 'note', 'attendance', 'academicResult', 'jobApplication', 'job', 'company',
  'notification', 'event', 'contactMessage', 'passwordResetToken', 'student', 'teacher', 'subject', 'course', 'admin', 'user'];

async function main() {
  const reset = process.argv.includes('--reset');
  if ((await prisma.user.count()) > 0) {
    if (!reset) { console.log('Database already has data. Run "npm run seed -- --reset" to wipe and reseed.'); return; }
    if (process.env.NODE_ENV === 'production' && !process.env.SEED_FORCE) throw new Error('Refusing to wipe a production database (set SEED_FORCE=1 to override)');
    for (const m of WIPE) await prisma[m].deleteMany();
  }
  const [adminHash, studentHash] = [await bcrypt.hash(ADMIN_PW, 12), await bcrypt.hash(STUDENT_PW, 12)];
  const admin = await prisma.user.create({ data: { email: 'admin@smartcampus.com', role: 'ADMIN', passwordHash: adminHash, admin: { create: { fullName: 'System Admin' } } } });
  const bca = await prisma.course.create({ data: { name: 'Bachelor of Computer Applications', code: 'BCA', semesters: 6, description: 'Three-year undergraduate computer applications programme' } });
  const bba = await prisma.course.create({ data: { name: 'Bachelor of Business Administration', code: 'BBA', semesters: 6, description: 'Three-year undergraduate management programme' } });
  const teachers = [];
  for (const [name, email, department, designation] of [['Pankaj Kumar Gupta', 'pankaj.gupta@dpbs.edu', 'Computer Applications', 'Head of Department'], ['Neha Verma', 'neha.verma@dpbs.edu', 'Computer Applications', 'Assistant Professor'], ['Rakesh Singh', 'rakesh.singh@dpbs.edu', 'Management', 'Assistant Professor']])
    teachers.push(await prisma.teacher.create({ data: { name, email, department, designation, phone: '9810000000' } }));
  const subjects = {};
  for (const [c, code, name, sem, t] of [[bca, 'BCA501', 'Web Technologies', 5, 0], [bca, 'BCA502', 'Software Engineering', 5, 1], [bca, 'BCA503', 'Computer Networks', 5, 0], [bca, 'BCA504', 'Python Programming', 5, 1], [bca, 'BCA301', 'Database Management Systems', 3, 1], [bba, 'BBA501', 'Marketing Management', 5, 2], [bba, 'BBA502', 'Financial Management', 5, 2]])
    subjects[code] = await prisma.subject.create({ data: { courseId: c.id, code, name, semester: sem, teacherId: teachers[t].id } });
  // ---- students (first one is the demo account)
  const roster = [['Vishal Sharma', 'student@smartcampus.com', 'M24818368', bca, 5], ['Aarav Mehta', 'aarav.mehta', 0, bca, 5], ['Priya Nair', 'priya.nair', 0, bca, 5], ['Rohan Gupta', 'rohan.gupta', 0, bca, 5], ['Sneha Yadav', 'sneha.yadav', 0, bca, 5],
    ['Ankit Tyagi', 'ankit.tyagi', 0, bca, 5], ['Pooja Rawat', 'pooja.rawat', 0, bca, 5], ['Karan Malhotra', 'karan.malhotra', 0, bca, 5], ['Divya Saxena', 'divya.saxena', 0, bca, 5], ['Mohit Chauhan', 'mohit.chauhan', 0, bca, 5],
    ['Ritu Agarwal', 'ritu.agarwal', 0, bca, 5], ['Sahil Khan', 'sahil.khan', 0, bca, 5], ['Anjali Joshi', 'anjali.joshi', 0, bca, 3], ['Deepak Kumar', 'deepak.kumar', 0, bca, 3], ['Nidhi Bansal', 'nidhi.bansal', 0, bba, 5], ['Yash Pathak', 'yash.pathak', 0, bba, 5]];
  const students = [];
  for (const [i, [fullName, em, enr, course, semester]] of roster.entries()) {
    const email = em.includes('@') ? em : `${em}@student.smartcampus.com`;
    const u = await prisma.user.create({ data: { email, role: 'STUDENT', passwordHash: studentHash, student: { create: { fullName, enrollmentNo: enr || `M24818${3100 + i}`, courseId: course.id, semester, phone: `98${10000000 + i * 1111}`.slice(0, 10) } } }, include: { student: true } });
    students.push({ ...u.student, idx: i });
  }
  const bcaS5 = students.filter((x) => x.courseId === bca.id && x.semester === 5);
  // ---- attendance: last 5 weeks of weekdays
  const att = [];
  for (const st of students) for (const sub of Object.values(subjects).filter((x) => x.courseId === st.courseId && x.semester === st.semester))
    for (let d = -35; d <= -1; d++) { const date = dayUTC(d); if ([0, 6].includes(date.getUTCDay())) continue; const r = rnd(); const lowAtt = st.idx % 7 === 5;
      att.push({ studentId: st.id, subjectId: sub.id, date, status: r < (lowAtt ? 0.55 : 0.84) ? 'PRESENT' : r < (lowAtt ? 0.6 : 0.9) ? 'LATE' : r < 0.97 ? 'ABSENT' : 'EXCUSED' }); }
  await chunk(att, (rows) => prisma.attendance.createMany({ data: rows, skipDuplicates: true }));
  // ---- notes (real files so downloads work)
  for (const [code, title, description] of [['BCA501', 'HTML, CSS & JavaScript Basics', 'Unit 1 revision notes'], ['BCA501', 'React Fundamentals', 'Components, props and state'], ['BCA502', 'Software Development Life Cycle', 'SDLC models and comparison'], ['BCA503', 'OSI and TCP/IP Models', 'Layered architecture summary'], ['BCA301', 'Normalization Explained', '1NF to BCNF with examples']]) {
    const f = makeFile(`${title}\n\n${description}\n\n(Sample study material generated by the Smart Campus seed script.)\n`);
    await prisma.note.create({ data: { subjectId: subjects[code].id, uploadedById: admin.id, title, description, semester: subjects[code].semester, ...f, fileName: `${title.replace(/[^A-Za-z0-9]+/g, '_')}.txt`, mimeType: 'text/plain' } });
  }
  // ---- assignments + submissions
  const mkA = (code, title, instructions, days, allowLate, maxMarks) => prisma.assignment.create({ data: { subjectId: subjects[code].id, createdById: admin.id, title, instructions, deadline: inDays(days), allowLate, maxMarks } });
  const [a1, a2, a3] = [await mkA('BCA501', 'Responsive portfolio page', 'Build a responsive personal portfolio using HTML, CSS and JavaScript. Submit a zip or document with the link and screenshots.', 7, false, 20),
    await mkA('BCA502', 'SRS for a Library System', 'Prepare a Software Requirements Specification document for a library management system.', 14, false, 20),
    await mkA('BCA503', 'Network topologies report', 'Write a short report comparing bus, star, ring and mesh topologies.', -5, true, 10)];
  const sub = (a, st, status, days, extra = {}) => prisma.assignmentSubmission.create({ data: { assignmentId: a.id, studentId: st.id, status, submittedAt: inDays(days), fileName: `${st.fullName.split(' ')[0]}_submission.txt`, fileKey: makeFile(`Submission by ${st.fullName}\n`).fileKey, ...extra } });
  for (const st of bcaS5.slice(1, 4)) await sub(a3, st, 'REVIEWED', -6, { marks: 6 + (st.idx % 5), feedback: 'Good comparison. Add real-world examples next time.', reviewedAt: inDays(-3) });
  for (const st of bcaS5.slice(4, 7)) await sub(a3, st, 'SUBMITTED', -6);
  await sub(a3, bcaS5[7], 'LATE', -3);
  for (const st of bcaS5.slice(1, 4)) await sub(a1, st, 'SUBMITTED', -1);
  // ---- exams
  const mkExam = (code, title, days, mins, total, pass, published, qs) => prisma.examination.create({ data: { subjectId: subjects[code].id, title, instructions: 'Answer all questions. Each question has one correct option.', examDate: inDays(days), durationMinutes: mins, totalMarks: total, passingMarks: pass, showAnswers: true, isPublished: published } })
    .then(async (exam) => { const made = []; for (const q of qs) made.push(await prisma.question.create({ data: { examId: exam.id, text: q[0], optionA: q[1][0], optionB: q[1][1], optionC: q[1][2], optionD: q[1][3], correctOption: q[2], marks: 1 } })); return { exam, made }; });
  const e1 = await mkExam('BCA501', 'Web Technologies Quiz 1', -2, 20, 5, 2, true, [['Which tag defines the largest HTML heading?', ['<h6>', '<h1>', '<head>', '<header>'], 'B'], ['Which CSS property changes text colour?', ['font-style', 'text-align', 'color', 'background'], 'C'],
    ['Which keyword declares a block-scoped variable in JavaScript?', ['var', 'let', 'def', 'dim'], 'B'], ['What does DOM stand for?', ['Document Object Model', 'Data Object Mode', 'Digital Order Map', 'Document Oriented Method'], 'A'], ['Which HTTP method is normally used to submit a form that creates data?', ['GET', 'HEAD', 'POST', 'TRACE'], 'C']]);
  await mkExam('BCA502', 'Software Engineering Unit Test', 3, 30, 4, 2, true, [['Which SDLC model is also called the classic life cycle?', ['Agile', 'Waterfall', 'Spiral', 'RAD'], 'B'], ['What does SRS stand for?', ['Software Requirement Specification', 'System Run Sheet', 'Software Release Summary', 'Standard Review Sheet'], 'A'],
    ['Which testing checks individual units of code?', ['Unit testing', 'System testing', 'Acceptance testing', 'Load testing'], 'A'], ['Which diagram shows data movement through a system?', ['ER diagram', 'DFD', 'Gantt chart', 'Class diagram'], 'B']]);
  await mkExam('BCA504', 'Python Basics (draft)', 10, 15, 2, 1, false, [['Which function prints output in Python?', ['echo()', 'print()', 'write()', 'out()'], 'B'], ['Which symbol starts a comment in Python?', ['//', '#', '--', '/*'], 'B']]);
  for (const st of bcaS5.slice(0, 8)) {
    const answers = {}; e1.made.forEach((q) => { const r = rnd(); if (r < 0.7) answers[q.id] = q.correctOption; else if (r < 0.9) answers[q.id] = pick(['A', 'B', 'C', 'D'].filter((o) => o !== q.correctOption)); });
    const r = scoreAnswers(e1.made, answers); const ev = evaluate(r.score, 5, 2); const started = new Date(e1.exam.examDate.getTime() + 3600e3 * (1 + st.idx));
    const at = await prisma.examAttempt.create({ data: { examId: e1.exam.id, studentId: st.id, startedAt: started, submittedAt: new Date(started.getTime() + 12 * 60e3), score: r.score, percentage: ev.percentage, passed: ev.passed } });
    await prisma.examAnswer.createMany({ data: r.rows.map((x) => ({ ...x, attemptId: at.id })) });
  }
  // ---- academic results (sem 5 BCA)
  const res = [];
  for (const st of bcaS5) for (const code of ['BCA501', 'BCA502', 'BCA503', 'BCA504']) for (const [examType, max] of [['INTERNAL', 30], ['MID_SEMESTER', 50]]) {
    const p = st.idx % 9 === 4 ? 0.3 + rnd() * 0.15 : 0.5 + rnd() * 0.45; res.push({ studentId: st.id, subjectId: subjects[code].id, semester: 5, examType, maxMarks: max, obtainedMarks: Math.round(max * p) }); }
  await prisma.academicResult.createMany({ data: res });
  // ---- placements
  const cos = {}; for (const [name, industry, location, website] of [['Tata Consultancy Services', 'IT Services', 'Noida', 'https://www.tcs.com'], ['Infosys', 'IT Services', 'Bengaluru', 'https://www.infosys.com'], ['Wipro', 'IT Services', 'Gurugram', 'https://www.wipro.com'], ['Zoho Corporation', 'Software Products', 'Chennai', 'https://www.zoho.com'], ['Innovate Soft Solutions', 'Startup', 'Delhi NCR', null]])
    cos[name] = await prisma.company.create({ data: { name, industry, location, website, description: `${name} is hiring fresh graduates through campus placement.`, contactEmail: `careers@${name.split(' ')[0].toLowerCase()}.example.com` } });
  const mkJob = (co, title, jobType, pkg, min, courses, sems, days, openings, skills) => prisma.job.create({ data: { companyId: cos[co].id, title, jobType, package: pkg, minPercentage: min, eligibleSemesters: sems, skills, deadline: inDays(days), openings, location: cos[co].location,
    description: `${title} role at ${co}. Work with experienced teams, structured training provided for freshers.`, eligibleCourses: { connect: courses.map((c) => ({ id: c.id })) } } });
  const jobs = [await mkJob('Tata Consultancy Services', 'Associate Software Engineer', 'FULL_TIME', '3.5 LPA', 60, [bca], [5, 6], 20, 20, ['Java', 'SQL', 'Problem solving']), await mkJob('Infosys', 'Systems Engineer Trainee', 'FULL_TIME', '3.6 LPA', 65, [bca], [5, 6], 30, 15, ['Programming basics', 'Communication']),
    await mkJob('Wipro', 'Junior Web Developer', 'FULL_TIME', '3.2 LPA', 55, [bca], [], 12, 10, ['HTML', 'CSS', 'JavaScript']), await mkJob('Zoho Corporation', 'Software Developer Intern', 'INTERNSHIP', '15,000 / month', 70, [bca], [5], 25, 5, ['Python', 'Data structures']),
    await mkJob('Innovate Soft Solutions', 'Frontend Developer', 'FULL_TIME', '3 LPA', 50, [bca, bba], [], 40, 3, ['React', 'Tailwind CSS']), await mkJob('Tata Consultancy Services', 'Business Analyst Trainee', 'FULL_TIME', '3.4 LPA', 60, [bba], [5, 6], 18, 8, ['Excel', 'Communication']),
    await mkJob('Infosys', 'Process Executive', 'FULL_TIME', '2.8 LPA', 50, [bba], [], -3, 10, ['Communication'])];
  const apps = new Map(); const statuses = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'];
  for (const st of bcaS5.slice(0, 9)) for (const j of [jobs[0], jobs[2], jobs[4]]) if (rnd() < 0.6) apps.set(`${j.id}:${st.id}`, { jobId: j.id, studentId: st.id, status: pick(statuses), appliedAt: inDays(-Math.ceil(rnd() * 10)) });
  apps.set(`${jobs[2].id}:${bcaS5[1].id}`, { jobId: jobs[2].id, studentId: bcaS5[1].id, status: 'SELECTED', appliedAt: inDays(-9) });
  await prisma.jobApplication.createMany({ data: [...apps.values()] });
  // ---- notifications, events, messages
  for (const [title, message, category, audience] of [['Semester 5 internal exams', 'Internal examinations start next month. Check the exam portal for schedules.', 'EXAMINATION', 'STUDENTS'], ['Campus drive: TCS and Wipro', 'Eligible BCA Semester 5 and 6 students can now apply from the Placements page.', 'PLACEMENT', 'STUDENTS'],
    ['Assignment deadline reminder', 'Submit the Web Technologies portfolio assignment before the deadline.', 'ASSIGNMENT', 'STUDENTS'], ['Library timings updated', 'The library is open 9 AM to 6 PM on weekdays.', 'GENERAL', 'ALL'], ['Mid-semester results published', 'Check your results page for the latest marks.', 'ACADEMIC', 'STUDENTS'], ['Annual Tech Fest', 'Registrations for the annual tech fest are open.', 'EVENT', 'ALL']])
    await prisma.notification.create({ data: { title, message, category, audience, createdById: admin.id, createdAt: inDays(-Math.floor(rnd() * 6)) } });
  for (const [title, d, eventTime, location, organizer, description] of [['Annual Tech Fest', 12, '10:00 AM', 'College Auditorium', 'BCA Department', 'Coding contests, project exhibition and guest talks.'], ['Placement Preparation Workshop', 5, '11:00 AM', 'Seminar Hall', 'Training & Placement Cell', 'Resume building and mock interviews.'],
    ['Guest Lecture: Cloud Computing', 20, '2:00 PM', 'Room 204', 'BCA Department', 'Industry expert session.'], ['Sports Day', 35, '9:00 AM', 'College Ground', 'Sports Committee', 'Inter-department competitions.']])
    await prisma.event.create({ data: { title, eventDate: dayUTC(d), eventTime, location, organizer, description } });
  await prisma.contactMessage.createMany({ data: [{ name: 'Rahul Verma', email: 'rahul@example.com', subject: 'Admission query', message: 'Could you tell me when BCA admissions open for the next session?' }, { name: 'Meena Sharma', email: 'meena@example.com', subject: 'Demo request', message: 'I would like to see how the placement module works for our institute.', isRead: true }] });
  console.log(`\nSeeded: ${students.length} students, ${teachers.length} teachers, 2 courses, ${Object.keys(subjects).length} subjects, ${att.length} attendance rows, ${res.length} results, ${jobs.length} jobs, ${apps.size} applications.`);
  console.log(`\nDemo logins\n  Admin:   admin@smartcampus.com   / ${ADMIN_PW}\n  Student: student@smartcampus.com / ${STUDENT_PW}   (Vishal Sharma, BCA Sem 5)\n  Other students: aarav.mehta@student.smartcampus.com ... / ${STUDENT_PW}`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
