import { useAuth } from '../context/AuthContext.jsx';
import DashboardAdmin from './DashboardAdmin.jsx';
import DashboardStudent from './DashboardStudent.jsx';
export default function Dashboard() { const { user } = useAuth(); return user.role === 'ADMIN' ? <DashboardAdmin /> : <DashboardStudent />; }
