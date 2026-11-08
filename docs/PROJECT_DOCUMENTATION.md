# Smart Campus: Student Placement and College Management System

## 1. Project Title

**Smart Campus - Student Placement and College Management System**
Project report for the Bachelor of Computer Applications (BCA), DPBS College, Anupshahr.
Submitted by: Vishal Sharma (Roll No. 240983106115) | Guide: Mr. Pankaj Kumar Gupta, Head, BCA Department | Batch 2024-2027

## 2. Abstract

Smart Campus is a web-based platform that brings the day-to-day academic and placement work of a college into one secure system. Students can track attendance, download study material, submit assignments, take timed online examinations, view results, and apply for campus jobs. Administrators can manage students, teachers, courses, attendance, material, assignments, exams, results, companies, jobs and applicants, and publish notifications and events. The system is a three-tier application: a React front end, a Node.js/Express REST API, and a PostgreSQL database accessed through Prisma. Access is controlled by role (Student or Admin) and enforced on the server, not only in the interface.

## 3. Introduction

Colleges handle attendance registers, notes, assignment collection, test papers, mark sheets and placement drives through paper, spreadsheets and messaging groups. These tools are not connected, which causes duplicated effort, lost files and delays. Smart Campus replaces them with a single database-backed application available on any device with a browser.

## 4. Problem Statement

- Attendance is recorded on paper, so percentages are calculated by hand and errors go unnoticed until exam time.
- Study material and assignment files are scattered across chat groups.
- Examinations and marking consume faculty time.
- Placement information reaches students late, eligibility is checked manually, and students cannot see where their application stands.
- Administrators have no single view of academic and placement activity.

## 5. Objectives

1. Digitise attendance, material, assignments, examinations and results.
2. Give each student self-service access to their own records only.
3. Automate calculation (attendance percentage, exam scores, percentage and grade).
4. Manage the full campus placement workflow, including automatic eligibility checks and application tracking.
5. Give administrators live statistics drawn from the database.
6. Protect data with authentication, role-based authorization and validated input.

## 6. Scope

**In scope:** one institution; two roles (Student, Admin); courses and subjects by semester; MCQ-based online exams; PDF/Office/text file handling; placement drives with eligibility rules; notifications and events; contact form.
**Out of scope (current version):** a teacher login (teachers exist as records), e-mail/SMS delivery, fee management, timetable, payment, multi-institution support, mobile app.

## 7. Existing System

Manual registers and spreadsheets for attendance and marks; notes and assignments shared through messaging apps; paper or ad-hoc online forms for tests; notice-board and group messages for placements. **Disadvantages:** time-consuming, error-prone, no access control, no history or analytics, no tracking for students.

## 8. Proposed System

A centralised web application with a shared database. **Advantages:** one source of truth; calculations done by the system; per-student data privacy; instant publication of notices and jobs; students see status without asking; administrators see live statistics.

## 9. Functional Requirements

| Area | Requirements |
|---|---|
| Authentication | Register, login, logout, forgot/reset password, profile update |
| Student management | Add, edit, view, deactivate, delete, search, filter, paginate |
| Teachers, courses, subjects | Create, edit, delete (when safe), assign teachers to subjects |
| Attendance | Mark by subject and date, status Present/Absent/Late/Excused, reports, student view with chart |
| Notes | Upload, search, filter, download, delete |
| Assignments | Create with deadline, submit/resubmit, late handling, review with marks and feedback |
| Examinations | Create exam and MCQs, publish, timed attempt, auto-submit, server-side scoring |
| Results | Add marks, calculate percentage and grade, student semester view, printable report |
| Placements | Companies, jobs, eligibility, apply, status tracking, analytics |
| Communication | Notifications by category and audience, events, contact messages |
| Dashboards | Separate student and admin dashboards with charts |

## 10. Non-Functional Requirements

- **Security:** hashed passwords, token authentication, server-side authorization, input validation, rate limiting on authentication routes.
- **Usability:** responsive layout for desktop, tablet and mobile; light and dark themes; loading, empty and error states.
- **Reliability:** database constraints prevent duplicate and orphaned records; consistent error responses.
- **Maintainability:** layered backend (routes, controllers, services, validators, middleware); shared UI components; central rules for grading, attendance, scoring and eligibility.
- **Portability:** file storage isolated in one module so it can move to cloud storage.

## 11. System Architecture

```
Browser (React SPA, Tailwind)
        |  HTTPS, JSON, Bearer token
        v
Express API  -> middleware (Helmet, CORS, rate limit, JWT auth, role guard)
        |      -> routes -> controllers -> validators (Zod) / services / utils
        v
Prisma ORM -> PostgreSQL            Local disk (uploads)
```

The front end calls only the REST API under `/api`. The server derives the student's identity from the verified token and the database, never from request fields, so a student cannot request another student's data by changing an id.

## 12. Technology Stack

| Layer | Technology |
|---|---|
| Front end | React 18, Vite, React Router, Tailwind CSS, Axios, React Hook Form, Zod, Recharts, Lucide icons, Framer Motion |
| Back end | Node.js, Express 5, Prisma ORM, Zod, bcryptjs, jsonwebtoken, Multer, Helmet, CORS, express-rate-limit |
| Database | PostgreSQL |
| Testing | Node's built-in test runner, Supertest |
| Deployment | Vercel (front end), Render (API), Neon (database) |

## 13. Database Design

22 tables: users, admins, students, teachers, courses, subjects, attendance, notes, assignments, assignment_submissions, examinations, questions, exam_attempts, exam_answers, academic_results, companies, jobs, job_applications, notifications, events, contact_messages, password_reset_tokens. All have primary keys and timestamps where relevant. Unique constraints guard business rules (one attendance row per student/subject/day, one submission per student per assignment, one application per student per job, one result per student/subject/semester/exam type). Foreign keys use `Cascade`, `Restrict` or `SetNull` deliberately. See `prisma/schema.prisma`.

## 14. ER Diagram

See [ER_DIAGRAM.md](ER_DIAGRAM.md).

## 15. Data Flow Diagram

See [DFD.md](DFD.md) for Level 0 and Level 1.

## 16. Modules

1. **Authentication** - registration, login, password reset, profile.
2. **Dashboards** - student and admin summaries built from database queries.
3. **People and structure** - students, teachers, courses, subjects.
4. **Attendance** - marking, reports and percentages.
5. **Notes** - upload and download of study material.
6. **Assignments** - publishing, submission, review.
7. **Online examinations** - MCQ builder, timed attempts, scoring.
8. **Results** - marks, grades, printable report.
9. **Placements** - companies, jobs, eligibility, applications, analytics.
10. **Notifications, events and contact** - communication tools.

**Key rules.** Attendance % = attended / counted classes x 100, where Present and Late are attended and Excused is excluded. Grades: 90+ A+, 80+ A, 70+ B+, 60+ B, 50+ C, 40+ D, below 40 F (pass mark 40%). Exam score is computed by the server from stored answers; a late submission beyond a 30-second allowance scores nothing. A student may apply for a job only if the deadline is open, their course and semester are eligible, and their overall academic percentage meets the minimum.

## 17. Security

- Passwords hashed with bcrypt; never returned by the API.
- JWT access tokens with expiry; every request re-checks that the account is active.
- Role-based middleware on every protected route; ownership checks for files and records.
- Server-side validation with Zod on every write; client-side validation for usability.
- Prisma parameterised queries (no string-built SQL).
- Helmet headers, CORS limited to the configured front-end origin, rate limiting on login, registration and reset.
- Upload validation by extension and MIME type, size limit, random stored file names, path-traversal protection.
- Password-reset tokens are random, stored only as a hash, expire in 30 minutes and are single-use. Forgot-password never reveals whether an email is registered.
- Secrets live in environment variables; the server refuses to start in production with a short JWT secret.

## 18. Testing

- **Unit tests (17, passing):** a route audit (every one of 89 endpoints checked for anonymous, student and admin callers, plus every client API call matched to a server route), exam scoring, grade boundaries, attendance rule, placement eligibility, authentication middleware (missing, invalid, expired, deactivated), role guard, validators, duplicate-registration handling, login errors, password-reset rules, error mapping.
- **API integration suites (16 tests, passing on PostgreSQL):** registration, login, authorization, CRUD, attendance, notes upload/download, assignments, exam scoring, results, placements, notifications, events, contact, and every dashboard endpoint (`server/tests/api`).
- **Browser tests:** a real-browser crawl of all 27 screens at desktop, mobile and dark mode, and an 11-step user journey including a timed exam that auto-submits. See [FINAL_VERIFICATION.md](FINAL_VERIFICATION.md).
- **Manual test cases:** 45 cases in [TEST_CASES.md](TEST_CASES.md).

## 19. Deployment

Vercel for the front end, Render for the API, Neon for PostgreSQL. Step-by-step instructions are in [DEPLOYMENT.md](DEPLOYMENT.md).

## 20. Limitations

- Files are stored on local disk; cloud storage is not yet connected.
- Password-reset links are shown on screen in development because no e-mail provider is configured.
- No teacher login; teachers are managed by the administrator.
- Company logos are entered as URLs rather than uploaded.
- Students cannot yet upload a profile photo (the field exists in the database but has no upload screen).
- There is no Settings page; the sidebar lists only screens that work.
- The React client has no automated tests; only the server is covered.
- An examination has a start time but no closing time.
- Exams are multiple-choice only.
- The responsive layout and dark mode were checked at 375, 1024 and 1280 px in headless Chrome; tablet width, Safari and Firefox are untested.

## 21. Future Scope

E-mail and SMS notifications; teacher portal; question banks and randomised paper order; descriptive questions with manual marking; resume upload and PDF export of results; fee and timetable modules; cloud file storage; progressive web app; analytics export.

## 22. Conclusion

Smart Campus demonstrates a complete full-stack solution to the everyday problems of academic administration and campus placement. By centralising data, automating calculations and enforcing role-based access on the server, it reduces manual work and gives students and administrators timely, accurate information. The modular design and documented deployment path allow it to be extended to a real institution.
