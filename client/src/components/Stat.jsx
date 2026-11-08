import { Link } from 'react-router-dom';
export const Stat = ({ icon: Icon, label, value, sub, to, tone }) => {
  const body = (<div className="card h-full p-4 transition hover:border-brand-500"><div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-500">{label}</p>{Icon && <Icon size={16} className="text-brand-600" />}</div>
    <p className={`mt-1 text-2xl font-bold ${tone || ''}`}>{value}</p>{sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}</div>);
  return to ? <Link to={to}>{body}</Link> : body;
};
export const Panel = ({ title, children, className = '' }) => <div className={`card ${className}`}><h2 className="font-semibold">{title}</h2><div className="mt-3">{children}</div></div>;
export const Empty = ({ children }) => <p className="py-6 text-center text-sm text-slate-500">{children}</p>;
export const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#64748b'];
