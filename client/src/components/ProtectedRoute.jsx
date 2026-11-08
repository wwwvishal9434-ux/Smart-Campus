import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: loc }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}
