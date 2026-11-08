import ResourcePage from '../components/ResourcePage.jsx';
import { Badge, toInput } from '../utils/format.jsx';
const sem = (n = 6) => Array.from({ length: n }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }));
const types = [['INTERNAL', 'Internal'], ['PRACTICAL', 'Practical'], ['MID_SEMESTER', 'Mid Semester'], ['END_SEMESTER', 'End Semester']].map(([value, label]) => ({ value, label }));
const jobTypes = [['FULL_TIME', 'Full time'], ['INTERNSHIP', 'Internship'], ['PART_TIME', 'Part time'], ['CONTRACT', 'Contract']].map(([value, label]) => ({ value, label }));
const arr = (v) => [].concat(v || []).filter(Boolean);
export const ResultsPage = () => (<ResourcePage title="Results" singular="Result" endpoint="/results"
  filters={[{ name: 'semester', label: 'Semester', options: sem() }, { name: 'examType', label: 'Exam type', options: types }]}
  columns={[{ key: 'studentName', label: 'Student' }, { key: 'subjectCode', label: 'Subject' }, { key: 'semester', label: 'Sem' }, { label: 'Exam', render: (r) => types.find((t) => t.value === r.examType)?.label },
    { label: 'Marks', render: (r) => `${r.obtainedMarks} / ${r.maxMarks}` }, { label: '%', render: (r) => `${r.percentage}%` }, { key: 'grade', label: 'Grade' }, { label: 'Result', render: (r) => <Badge tone={r.status === 'PASS' ? 'green' : 'red'}>{r.status}</Badge> }]}
  fields={[{ name: 'studentId', label: 'Student', type: 'select', required: true, optionsFrom: { url: '/students/options', label: 'label' } }, { name: 'subjectId', label: 'Subject', type: 'select', required: true, optionsFrom: { url: '/subjects', label: 'label' } },
    { name: 'semester', label: 'Semester', type: 'select', required: true, options: sem() }, { name: 'examType', label: 'Exam type', type: 'select', required: true, options: types },
    { name: 'maxMarks', label: 'Maximum marks', type: 'number', required: true }, { name: 'obtainedMarks', label: 'Obtained marks', type: 'number', required: true }]} />);
export const CompaniesPage = () => (<ResourcePage title="Companies" singular="Company" endpoint="/companies"
  columns={[{ key: 'name', label: 'Company' }, { key: 'industry', label: 'Industry' }, { key: 'location', label: 'Location' }, { key: 'contactEmail', label: 'Contact' }, { key: 'jobCount', label: 'Jobs' }]}
  fields={[{ name: 'name', label: 'Company name', required: true }, { name: 'industry', label: 'Industry' }, { name: 'location', label: 'Location' }, { name: 'website', label: 'Website (https://…)' },
    { name: 'logoUrl', label: 'Logo URL (https://…)' }, { name: 'contactEmail', label: 'Contact email', type: 'email' }, { name: 'description', label: 'Description', type: 'textarea' }]} />);
export const JobsPage = () => (<ResourcePage title="Jobs" singular="Job" endpoint="/jobs"
  toForm={(r) => ({ ...r, skills: r.skills.join(', '), deadline: toInput(r.deadline).slice(0, 10), eligibleCourseIds: r.eligibleCourseIds.map(String), eligibleSemesters: r.eligibleSemesters.map(String) })}
  transform={(d) => ({ ...d, eligibleCourseIds: arr(d.eligibleCourseIds), eligibleSemesters: arr(d.eligibleSemesters).map(Number), skills: String(d.skills || '').split(',').map((s) => s.trim()).filter(Boolean), deadline: new Date(`${d.deadline}T23:59:59`).toISOString() })}
  columns={[{ key: 'title', label: 'Job' }, { key: 'companyName', label: 'Company' }, { key: 'location', label: 'Location' }, { label: 'Type', render: (r) => jobTypes.find((t) => t.value === r.jobType)?.label }, { key: 'package', label: 'Package' },
    { label: 'Min %', render: (r) => `${r.minPercentage}%` }, { label: 'Deadline', render: (r) => new Date(r.deadline).toLocaleDateString('en-IN') }, { key: 'applicationCount', label: 'Applicants' }]}
  fields={[{ name: 'companyId', label: 'Company', type: 'select', required: true, optionsFrom: { url: '/companies', label: 'name' } }, { name: 'title', label: 'Job title', required: true }, { name: 'description', label: 'Description', type: 'textarea', required: true },
    { name: 'location', label: 'Location', required: true }, { name: 'jobType', label: 'Job type', type: 'select', required: true, options: jobTypes }, { name: 'package', label: 'Salary / package (e.g. 4 LPA)' },
    { name: 'minPercentage', label: 'Minimum percentage', type: 'number', required: true }, { name: 'eligibleCourseIds', label: 'Eligible courses', type: 'multicheck', optionsFrom: { url: '/courses', label: 'name' } },
    { name: 'eligibleSemesters', label: 'Eligible semesters', type: 'multicheck', options: sem() }, { name: 'skills', label: 'Required skills (comma separated)' },
    { name: 'deadline', label: 'Application deadline', type: 'date', required: true }, { name: 'openings', label: 'Openings', type: 'number', required: true }]} />);
const cats = ['GENERAL', 'ACADEMIC', 'EXAMINATION', 'PLACEMENT', 'ASSIGNMENT', 'EVENT'].map((v) => ({ value: v, label: v[0] + v.slice(1).toLowerCase() }));
export const NotificationsPage = () => (<ResourcePage title="Notifications" singular="Notification" endpoint="/notifications"
  columns={[{ key: 'title', label: 'Title' }, { label: 'Category', render: (r) => <Badge tone="blue">{r.category}</Badge> }, { key: 'audience', label: 'Audience' }, { label: 'Published', render: (r) => new Date(r.createdAt).toLocaleDateString('en-IN') }]}
  fields={[{ name: 'title', label: 'Title', required: true }, { name: 'message', label: 'Message', type: 'textarea', required: true }, { name: 'category', label: 'Category', type: 'select', required: true, options: cats },
    { name: 'audience', label: 'Audience', type: 'select', required: true, options: [{ value: 'ALL', label: 'Everyone' }, { value: 'STUDENTS', label: 'Students only' }, { value: 'ADMINS', label: 'Admins only' }] }]} />);
export const EventsPage = () => (<ResourcePage title="Events" singular="Event" endpoint="/events"
  toForm={(r) => ({ ...r, eventDate: r.eventDate.slice(0, 10) })}
  columns={[{ key: 'title', label: 'Event' }, { label: 'Date', render: (r) => new Date(r.eventDate).toLocaleDateString('en-IN', { timeZone: 'UTC' }) }, { key: 'eventTime', label: 'Time' }, { key: 'location', label: 'Location' }, { key: 'organizer', label: 'Organizer' }]}
  fields={[{ name: 'title', label: 'Event title', required: true }, { name: 'eventDate', label: 'Date', type: 'date', required: true }, { name: 'eventTime', label: 'Time (e.g. 10:00 AM)' }, { name: 'location', label: 'Location', required: true },
    { name: 'organizer', label: 'Organizer', required: true }, { name: 'description', label: 'Description', type: 'textarea' }]} />);
