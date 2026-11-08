import api, { errorMessage } from '../services/api.js';
import toast from 'react-hot-toast';
export async function downloadFile(url, name) {
  try { const r = await api.get(url, { responseType: 'blob' }); const a = document.createElement('a'); a.href = URL.createObjectURL(r.data); a.download = name; a.click(); URL.revokeObjectURL(a.href); }
  catch (e) { toast.error(e.response?.status === 403 ? 'You do not have access to this file' : errorMessage(e)); }
}
export const fmtSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
