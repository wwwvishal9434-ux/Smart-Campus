export default function Field({ label, error, children }) {
  return (<label className="block"><span className="mb-1.5 block text-sm font-medium">{label}</span>{children}
    {error && <span role="alert" className="mt-1 block text-xs text-red-600 dark:text-red-400">{error}</span>}</label>);
}
