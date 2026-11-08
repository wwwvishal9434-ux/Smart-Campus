const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const c = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' } });
router.post('/register', limiter, c.register);
router.post('/login', limiter, c.login);
router.post('/forgot-password', limiter, c.forgot);
router.post('/reset-password', limiter, c.reset);
router.post('/logout', authenticate, c.logout);
router.get('/me', authenticate, c.me);
module.exports = router;
