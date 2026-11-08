export const fmt = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
export const toInput = (d) => { const x = new Date(d); return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
export const Badge = ({ children, tone = 'slate' }) => {
  const t = { slate: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300', green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', blue: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200' }[tone];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${t}`}>{children}</span>;
};
export const STATUS_TONE = { PENDING: 'amber', SUBMITTED: 'blue', LATE: 'red', REVIEWED: 'green' };
