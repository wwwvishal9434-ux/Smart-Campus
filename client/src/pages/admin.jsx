import ResourcePage from '../components/ResourcePage.jsx';
const sem = (n = 6) => Array.from({ length: n }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }));
const badge = (s) => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{s}</span>;
const course = { name: 'courseId', optionsFrom: { url: '/courses', label: 'name' } };
export const StudentsPage = () => (<ResourcePage title="Students" singular="Student" endpoint="/students" paged
  filters={[{ ...course, label: 'Course' }, { name: 'semester', label: 'Semester', options: sem() }, { name: 'status', label: 'Status', options: [{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }] }]}
  columns={[{ key: 'fullName', label: 'Name' }, { key: 'enrollmentNo', label: 'Enrollment' }, { key: 'email', label: 'Email' }, { key: 'courseName', label: 'Course' }, { key: 'semester', label: 'Sem' }, { label: 'Status', render: (r) => badge(r.status) }]}
  fields={[{ name: 'fullName', label: 'Full name', required: true }, { name: 'email', label: 'Email', type: 'email', required: true, createOnly: true }, { name: 'password', label: 'Password', type: 'password', required: true, createOnly: true },
    { name: 'enrollmentNo', label: 'Enrollment number', required: true }, { ...course, label: 'Course', type: 'select', required: true }, { name: 'semester', label: 'Semester', type: 'select', required: true, options: sem() },
    { name: 'phone', label: 'Phone' }, { name: 'address', label: 'Address', type: 'textarea' }, { name: 'status', label: 'Status', type: 'select', required: true, editOnly: true, options: [{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }] }]} />);
export const TeachersPage = () => (<ResourcePage title="Teachers" singular="Teacher" endpoint="/teachers"
  columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'department', label: 'Department' }, { key: 'designation', label: 'Designation' }, { label: 'Subjects', render: (r) => r.subjects.map((s) => s.code).join(', ') || '—' }]}
  fields={[{ name: 'name', label: 'Name', required: true }, { name: 'email', label: 'Email', type: 'email', required: true }, { name: 'phone', label: 'Phone' }, { name: 'department', label: 'Department', required: true }, { name: 'designation', label: 'Designation', required: true }]} />);
export const CoursesPage = () => (<ResourcePage title="Courses" singular="Course" endpoint="/courses"
  columns={[{ key: 'name', label: 'Name' }, { key: 'code', label: 'Code' }, { key: 'semesters', label: 'Semesters' }, { label: 'Students', render: (r) => r._count.students }, { label: 'Subjects', render: (r) => r._count.subjects }]}
  fields={[{ name: 'name', label: 'Course name', required: true }, { name: 'code', label: 'Code', required: true }, { name: 'semesters', label: 'Semesters', type: 'number', required: true }, { name: 'description', label: 'Description', type: 'textarea' }]} />);
export const SubjectsPage = () => (<ResourcePage title="Subjects" singular="Subject" endpoint="/subjects"
  filters={[{ ...course, label: 'Course' }, { name: 'semester', label: 'Semester', options: sem() }]}
  columns={[{ key: 'code', label: 'Code' }, { key: 'name', label: 'Subject' }, { key: 'courseName', label: 'Course' }, { key: 'semester', label: 'Sem' }, { key: 'teacherName', label: 'Teacher' }]}
  fields={[{ ...course, label: 'Course', type: 'select', required: true }, { name: 'semester', label: 'Semester', type: 'select', required: true, options: sem(12) }, { name: 'code', label: 'Subject code', required: true }, { name: 'name', label: 'Subject name', required: true },
    { name: 'teacherId', label: 'Teacher', type: 'select', optionsFrom: { url: '/teachers', label: 'name' } }]} />);
