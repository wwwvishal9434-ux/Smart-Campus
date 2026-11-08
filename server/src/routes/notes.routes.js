const router = require('express').Router();
const c = require('../controllers/notes.controller');
const { authenticate, authorize, requireAdmin } = require('../middleware/auth');
const { notesUpload } = require('../config/upload');
router.get('/', authenticate, c.list);
router.get('/:id/download', authenticate, c.download);
router.post('/', ...requireAdmin, notesUpload.single('file'), c.create);
router.delete('/:id', ...requireAdmin, c.remove);
module.exports = router;
