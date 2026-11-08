# Data Flow Diagrams - Smart Campus

## Level 0 (context diagram)

```mermaid
flowchart LR
    S["Student"]
    A["Admin"]
    SYS(("Smart Campus System"))
    S -->|"register, login, profile updates, assignment files, exam answers, job applications, contact messages"| SYS
    SYS -->|"dashboard, attendance, notes, assignments, exam score, results, jobs, application status, notifications"| S
    A -->|"student and course data, attendance, notes, assignments, exams, results, companies, jobs, application decisions, notifications"| SYS
    SYS -->|"statistics, submissions, applicant lists, placement analytics, contact messages"| A
```

## Level 1

```mermaid
flowchart TB
    S["Student"]
    A["Admin"]

    P1(("1.0 Authentication"))
    P2(("2.0 Student and Course Management"))
    P3(("3.0 Attendance Management"))
    P4(("4.0 Assignment Management"))
    P5(("5.0 Examination Management"))
    P6(("6.0 Result Management"))
    P7(("7.0 Placement Management"))
    P8(("8.0 Notifications and Events"))

    D1[("D1 Users and Profiles")]
    D2[("D2 Courses and Subjects")]
    D3[("D3 Attendance")]
    D4[("D4 Assignments and Submissions")]
    D5[("D5 Exams, Questions, Attempts")]
    D6[("D6 Academic Results")]
    D7[("D7 Companies, Jobs, Applications")]
    D8[("D8 Notifications and Events")]
    F[("File storage")]

    S -->|"credentials / registration"| P1
    A -->|"credentials"| P1
    P1 -->|"JWT token"| S
    P1 -->|"JWT token"| A
    P1 <--> D1

    A -->|"student, teacher, course, subject records"| P2
    S -->|"profile changes"| P2
    P2 <--> D1
    P2 <--> D2

    A -->|"attendance marks"| P3
    P3 -->|"percentage, history"| S
    P3 <--> D3
    D2 --> P3

    A -->|"assignment, review marks"| P4
    S -->|"submission file"| P4
    P4 -->|"status, marks, feedback"| S
    P4 <--> D4
    P4 <--> F

    A -->|"exam, MCQs"| P5
    S -->|"answers"| P5
    P5 -->|"questions without answers, then score"| S
    P5 <--> D5

    A -->|"marks"| P6
    P6 -->|"percentage, grade, report"| S
    P6 <--> D6

    A -->|"companies, jobs, status updates"| P7
    S -->|"application"| P7
    P7 -->|"eligibility, status tracking"| S
    P7 <--> D7
    D6 -->|"academic percentage"| P7

    A -->|"notices, events"| P8
    P8 -->|"feed"| S
    P8 <--> D8
```

Notes: eligibility checking (7.0) reads the student's overall percentage from D6. Exam scoring (5.0) is performed on the server; the client sends only the selected options.
