import { Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Contact from './pages/Contact.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import StudentProfile from './pages/StudentProfile.jsx';
import AttendanceAdmin from './pages/AttendanceAdmin.jsx';
import AttendanceStudent from './pages/AttendanceStudent.jsx';
import Notes from './pages/Notes.jsx';
import AssignmentsAdmin from './pages/AssignmentsAdmin.jsx';
import AssignmentsStudent from './pages/AssignmentsStudent.jsx';
import ExamsAdmin from './pages/ExamsAdmin.jsx';
import ExamsStudent from './pages/ExamsStudent.jsx';
import ExamTake from './pages/ExamTake.jsx';
import { NotificationsPage, EventsPage, ResultsPage, CompaniesPage, JobsPage } from './pages/admin2.jsx';
import ApplicationsAdmin from './pages/ApplicationsAdmin.jsx';
import JobsStudent from './pages/JobsStudent.jsx';
import ApplicationsStudent from './pages/ApplicationsStudent.jsx';
import ResultsStudent from './pages/ResultsStudent.jsx';
import MessagesAdmin from './pages/MessagesAdmin.jsx';
import { NotificationsStudent, EventsStudent } from './pages/StudentFeeds.jsx';
import { StudentsPage, TeachersPage, CoursesPage, SubjectsPage } from './pages/admin.jsx';
const guard = (el, roles) => <ProtectedRoute roles={roles}>{el}</ProtectedRoute>;
export default function App() {
  return (<Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<Landing />} /><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/contact" element={<Contact />} />
      <Route path="/forgot-password" element={<ForgotPassword />} /><Route path="/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<div className="py-24 text-center"><h1 className="text-3xl font-bold">404</h1><p className="mt-2 text-slate-500">Page not found.</p></div>} /></Route>
    <Route element={guard(<AppLayout />)}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/student/profile" element={guard(<StudentProfile />, ['STUDENT'])} />
      <Route path="/admin/students" element={guard(<StudentsPage />, ['ADMIN'])} /><Route path="/admin/teachers" element={guard(<TeachersPage />, ['ADMIN'])} />
      <Route path="/admin/attendance" element={guard(<AttendanceAdmin />, ['ADMIN'])} /><Route path="/admin/notes" element={guard(<Notes />, ['ADMIN'])} />
      <Route path="/student/attendance" element={guard(<AttendanceStudent />, ['STUDENT'])} /><Route path="/student/notes" element={guard(<Notes />, ['STUDENT'])} />
      <Route path="/admin/assignments" element={guard(<AssignmentsAdmin />, ['ADMIN'])} /><Route path="/admin/exams" element={guard(<ExamsAdmin />, ['ADMIN'])} />
      <Route path="/student/assignments" element={guard(<AssignmentsStudent />, ['STUDENT'])} /><Route path="/student/exams" element={guard(<ExamsStudent />, ['STUDENT'])} /><Route path="/student/exams/:id/take" element={guard(<ExamTake />, ['STUDENT'])} />
      <Route path="/admin/results" element={guard(<ResultsPage />, ['ADMIN'])} /><Route path="/admin/companies" element={guard(<CompaniesPage />, ['ADMIN'])} /><Route path="/admin/jobs" element={guard(<JobsPage />, ['ADMIN'])} /><Route path="/admin/applications" element={guard(<ApplicationsAdmin />, ['ADMIN'])} />
      <Route path="/student/results" element={guard(<ResultsStudent />, ['STUDENT'])} /><Route path="/student/jobs" element={guard(<JobsStudent />, ['STUDENT'])} /><Route path="/student/applications" element={guard(<ApplicationsStudent />, ['STUDENT'])} />
      <Route path="/admin/notifications" element={guard(<NotificationsPage />, ['ADMIN'])} /><Route path="/admin/events" element={guard(<EventsPage />, ['ADMIN'])} /><Route path="/admin/messages" element={guard(<MessagesAdmin />, ['ADMIN'])} />
      <Route path="/student/notifications" element={guard(<NotificationsStudent />, ['STUDENT'])} /><Route path="/student/events" element={guard(<EventsStudent />, ['STUDENT'])} />
      <Route path="/admin/courses" element={guard(<CoursesPage />, ['ADMIN'])} /><Route path="/admin/subjects" element={guard(<SubjectsPage />, ['ADMIN'])} /></Route></Routes>);
}
