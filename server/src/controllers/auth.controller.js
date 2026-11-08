const svc = require('../services/auth.service');
const v = require('../validators/auth');
const { ok, asyncHandler } = require('../utils/helpers');
exports.register = asyncHandler(async (req, res) => ok(res, await svc.register(v.registerSchema.parse(req.body)), 'Registration successful', 201));
exports.login = asyncHandler(async (req, res) => ok(res, await svc.login(v.loginSchema.parse(req.body)), 'Login successful'));
exports.me = asyncHandler(async (req, res) => ok(res, await svc.me(req.user.id)));
exports.logout = (req, res) => ok(res, {}, 'Logged out'); // stateless JWT: client discards the token
exports.forgot = asyncHandler(async (req, res) => ok(res, await svc.forgotPassword(v.forgotSchema.parse(req.body).email), 'If the email exists, a reset link has been generated'));
exports.reset = asyncHandler(async (req, res) => { await svc.resetPassword(v.resetSchema.parse(req.body)); ok(res, {}, 'Password reset successful'); });
