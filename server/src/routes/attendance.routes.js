const router = require('express').Router();
const c = require('../controllers/attendance.controller');
const { requireAdmin, requireStudent } = require('../middleware/auth');
router.get('/me', requireStudent, c.me);
router.get('/sheet', requireAdmin, c.sheet);
router.get('/report', requireAdmin, c.report);
router.post('/mark', requireAdmin, c.mark);
module.exports = router;
