const router = require('express').Router();
const c = require('../controllers/results.controller');
const { requireAdmin, requireStudent } = require('../middleware/auth');
router.get('/me', ...requireStudent, c.me);
router.get('/', ...requireAdmin, c.list); router.post('/', ...requireAdmin, c.create);
router.put('/:id', ...requireAdmin, c.update); router.delete('/:id', ...requireAdmin, c.remove);
module.exports = router;
