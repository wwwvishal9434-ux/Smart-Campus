const ok = (res, data = {}, message = 'Success', status = 200) => res.status(status).json({ success: true, message, data });
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
module.exports = { ok, asyncHandler };
