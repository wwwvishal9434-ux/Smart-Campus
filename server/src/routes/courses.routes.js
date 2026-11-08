const router = require('express').Router();
const c = require('../controllers/courses.controller');
const { requireAdmin } = require('../middleware/auth');
router.get('/public', c.publicList);
router.get('/', requireAdmin, c.list);
router.post('/', requireAdmin, c.create);
router.put('/:id', requireAdmin, c.update);
router.delete('/:id', requireAdmin, c.remove);
module.exports = router;
