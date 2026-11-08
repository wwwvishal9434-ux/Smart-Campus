const router = require('express').Router();
const c = require('../controllers/subjects.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');
router.get('/', authenticate, c.list);
router.post('/', requireAdmin, c.create); router.put('/:id', requireAdmin, c.update); router.delete('/:id', requireAdmin, c.remove);
module.exports = router;
