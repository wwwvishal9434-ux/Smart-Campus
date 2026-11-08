const { ZodError } = require('zod');
const { nodeEnv } = require('../config/env');
const notFound = (req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
const errorHandler = (err, req, res, next) => {
  let status = err.status || 500, message = err.message, details = err.details;
  if (err instanceof ZodError) { status = 400; message = 'Validation failed'; details = err.errors.map(e => ({ field: e.path.join('.'), message: e.message })); }
  else if (err.code === 'P2002') { status = 409; message = `Duplicate value for: ${(err.meta?.target || []).join(', ') || 'unique field'}`; }
  else if (err.code === 'P2025') { status = 404; message = 'Record not found'; }
  else if (err.code === 'P2003') { status = 409; message = 'Operation blocked: record is referenced by other data'; }
  else if (err.name === 'MulterError') { status = 400; message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : 'Invalid upload'; }
  if (status >= 500) { console.error(err); if (nodeEnv === 'production') message = 'Internal server error'; }
  res.status(status).json({ success: false, message, ...(details && { errors: details }) });
};
module.exports = { notFound, errorHandler };
