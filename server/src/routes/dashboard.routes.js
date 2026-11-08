const router = require('express').Router();
const c = require('../controllers/dashboard.controller');
const { requireAdmin, requireStudent } = require('../middleware/auth');
router.get('/student', ...requireStudent, c.student);
router.get('/admin', ...requireAdmin, c.admin);
module.exports = router;
