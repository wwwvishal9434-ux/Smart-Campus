# Test Cases - Smart Campus

**Status legend**
- **Pass (unit)** - covered by an automated unit test that passes (`cd server && npm test`, 17 tests).
- **Pass (API)** - verified by the integration suites (`tests/api`) on a real PostgreSQL database.
- **Pass (browser)** - verified in a real browser run (headless Chrome).
- **Pending** - not yet executed (admin-form click-through, reset-link UI flow, listing filters, cross-course download check, print preview, rate limit). Fill in *Actual Result* when you test them.

| ID | Module | Test Scenario | Preconditions | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| TC-01 | Auth | Register a valid student | Database seeded; BCA course exists | Open /register, fill all fields with valid data, submit | Account created, user logged in, redirected to dashboard | Account created via API and via the browser form | Pass (API + browser) |
| TC-02 | Auth | Duplicate email rejected | A user with the email exists | Register again with the same email | 409 "Email is already registered" | Service rejects with 409 | Pass (unit) |
| TC-03 | Auth | Duplicate enrollment rejected | A student with the enrollment no. exists | Register with a new email but same enrollment no. | 409 "Enrollment number is already registered" | Service rejects with 409 | Pass (unit) |
| TC-04 | Auth | Weak password rejected | - | Register with password `weak` | 400 with a password-strength message | Validator throws | Pass (unit) |
| TC-05 | Auth | Password mismatch rejected | - | Enter different password and confirmation | 400 "Passwords do not match" | Validator throws | Pass (unit) |
| TC-06 | Auth | Login with valid credentials | Seeded student exists | Login as student@smartcampus.com | Token issued, dashboard opens | Token issued; dashboard opens | Pass (API + browser) |
| TC-07 | Auth | Wrong password and unknown email give the same error | - | Login with unknown email, then wrong password | Both return 401 with identical message (no user enumeration) | Messages identical | Pass (unit) |
| TC-08 | Auth | Deactivated account cannot log in | Student status set to INACTIVE | Attempt login | 403 account deactivated | Service returns 403 | Pass (unit) |
| TC-09 | Authorization | Protected API without token | - | GET /api/students with no Authorization header | 401 | Middleware returns 401 | Pass (unit) |
| TC-10 | Authorization | Expired token | Token with past expiry | Call any protected API | 401 "Session expired" | Middleware returns 401 | Pass (unit) |
| TC-11 | Authorization | Student calls an admin API | Logged in as student | GET /api/students | 403 | Role guard returns 403 | Pass (unit) |
| TC-12 | Authorization | Student cannot change own role | Logged in as student | PATCH /api/students/me with `{ "role": "ADMIN" }` | 400, role unchanged | 400; role unchanged | Pass (API) |
| TC-13 | Auth | Forgot password does not reveal unknown emails | - | Request reset for an unregistered email | Generic success message, no token created | No token created | Pass (unit) |
| TC-14 | Auth | Expired, used or unknown reset token rejected | - | Submit reset with such a token | 400 "invalid or has expired" | Service rejects | Pass (unit) |
| TC-15 | Auth | Complete password reset in the UI | Registered user | Forgot password -> open dev link -> set new password -> login | New password works, old one fails | Not yet run | Pending (manual) |
| TC-16 | Students | Admin creates, edits, deactivates and deletes a student | Logged in as admin | Use Students page for each action | Each action succeeds; deactivated student cannot log in | Create, update (incl. deactivate), search, delete all succeed; deactivated user gets 403 on login | Pass (API) |
| TC-17 | Students | Search, filter and paginate | 16 seeded students | Search "Sharma", filter Semester 5, go to page 2 | Table updates; counts and pages correct | Not yet run | Pending (manual) |
| TC-18 | Courses | Cannot delete a course in use | BCA has students | Delete BCA | 409 "has students or subjects" | Not yet run | Pending (manual) |
| TC-19 | Attendance | Mark and re-mark attendance | Admin; subject with enrolled students | Select subject and date, mark, save; change one status, save again | Records saved; re-save updates, no duplicates | Saved; re-save updates; student % = 50 for 1 present + 1 absent | Pass (API) |
| TC-20 | Attendance | Percentage rule | - | Records: Present, Late, Absent, Excused | 2 of 3 counted = 66.7% (Excused excluded) | 66.7% | Pass (unit) |
| TC-21 | Notes | Upload and download a valid file | Admin | Upload a PDF; as student download it | File downloads with original name and content | Admin uploaded .txt; student downloaded identical bytes and original filename | Pass (API) |
| TC-22 | Notes | Invalid file type rejected | Admin | Upload `.exe` | 400 "Invalid file type" and no file stored | 400 for .exe; nothing stored | Pass (API) |
| TC-23 | Notes | Student cannot download another course's note | Note in BBA; student in BCA | Request /api/notes/:id/download | 403 | Not yet run | Pending (manual) |
| TC-24 | Assignments | Create and submit an assignment | Admin, student in same course/semester | Create with future deadline; student uploads a file | Submission saved with status SUBMITTED | Submission saved (also through the browser with a real file upload) | Pass (API + browser) |
| TC-25 | Assignments | Submission after deadline blocked | Assignment past deadline, late not allowed | Student submits | 400 "deadline has passed" | 400 for the closed assignment | Pass (API) |
| TC-26 | Assignments | Review marks above maximum rejected | Submission exists, max 10 | Admin enters 11 | 400; entering 8 succeeds and status becomes REVIEWED | 11 rejected (400); 8 accepted, status REVIEWED | Pass (API) |
| TC-27 | Exams | Score is calculated on the server | Published exam with 2 questions | Submit one correct answer and a fake `score: 999` | Score 1; fake value ignored | Score 1; client value 999 ignored; also 1/2 in browser | Pass (API + browser) |
| TC-28 | Exams | Attempt limit enforced | maxAttempts = 1, one attempt done | Start the exam again | 409 "already used all attempts" | 409 via API; browser shows "No attempts left" | Pass (API + browser) |
| TC-29 | Exams | Timer auto-submits | Published exam, 1-minute duration | Start and wait for zero | Exam submits automatically and shows result | 1-minute exam submitted itself at zero and showed 1 / 2 | Pass (browser) |
| TC-30 | Exams | Correct answers hidden during the exam | Student starts exam | Inspect the start response | No `correctOption` field in questions | No correctOption in start response | Pass (API) |
| TC-31 | Results | Percentage and grade | - | 45/50 | 90% and grade A+; boundaries 89.9 -> A, 39.9 -> F | Matches | Pass (unit) |
| TC-32 | Results | Duplicate result blocked | Result exists for same student/subject/semester/type | Add it again | 409 | 409 | Pass (API) |
| TC-33 | Results | Printable report | Student with results | Click Print report | Sidebar and header hidden, report printable | Not yet run | Pending (manual) |
| TC-34 | Placement | Eligibility rules | - | Check deadline, course, semester, minimum % cases | Eligible only when every rule passes | All 8 cases pass | Pass (unit) |
| TC-35 | Placement | Ineligible application blocked on the server | Student 90%, job needs 99% | Apply | 403 with reason | 403 with reason; Apply button disabled in browser | Pass (API + browser) |
| TC-36 | Placement | Duplicate application blocked | Student already applied | Apply again | 409 | 409 | Pass (API) |
| TC-37 | Placement | Admin updates application status | Application exists | Change status to SHORTLISTED | Saved; analytics update | Saved (SHORTLISTED) | Pass (API) |
| TC-38 | Placement | Student tracks status | Application exists | Open My Applications | Stage tracker shows current stage | Stage tracker and APPLIED status shown after applying | Pass (browser) |
| TC-39 | Notifications | Audience targeting | - | Post one for ADMINS only | Not visible to students | ADMINS-only notice not in student feed; STUDENTS notice is | Pass (API) |
| TC-40 | Contact | Message stored and visible to admin | - | Submit the form; open admin Messages | Message listed as NEW; can mark read and delete | Stored, listed for admin, marked read, deleted; Messages page loads | Pass (API + browser) |
| TC-41 | Dashboard | Statistics come from the database | Seeded data | Compare dashboard cards with table row counts | Numbers match | Cards match seeded counts (16 students, 3 teachers, 2 courses, 96 grades) | Pass (browser) |
| TC-42 | UI | Dark mode | - | Toggle theme, refresh | Theme applies on every page and persists | Dark class applied and readable on all 27 pages | Pass (browser) |
| TC-43 | UI | Mobile layout (375 px) | - | Open app at 375 px | Sidebar becomes a drawer; tables scroll; forms stack | No horizontal overflow on 27 pages at 375 px; drawer sidebar shown | Pass (browser) |
| TC-44 | UI | Validation messages | - | Submit empty forms | Clear field-level messages; server errors shown as toasts | Field-level messages shown on empty registration submit | Pass (browser) |
| TC-45 | Security | Auth rate limiting | - | Send 31 login requests within 15 minutes | 429 "Too many attempts" | Not yet run | Pending (manual) |
