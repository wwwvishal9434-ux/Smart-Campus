import { useEffect } from 'react';
import { X } from 'lucide-react';
export default function Modal({ title, onClose, children }) {
  useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return (<div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-label={title} className="card w-full max-w-lg">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">{title}</h2><button onClick={onClose} aria-label="Close"><X size={18} /></button></div>{children}</div></div>);
}
