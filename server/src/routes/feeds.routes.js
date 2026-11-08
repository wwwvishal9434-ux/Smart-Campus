const express = require('express');
const { authenticate, requireAdmin, requireStudent } = require('../middleware/auth');
const n = require('../controllers/notifications.controller'), e = require('../controllers/events.controller');
const notifications = express.Router(); notifications.get('/mine', ...requireStudent, n.mine);
notifications.get('/', ...requireAdmin, n.list); notifications.post('/', ...requireAdmin, n.create); notifications.put('/:id', ...requireAdmin, n.update); notifications.delete('/:id', ...requireAdmin, n.remove);
const events = express.Router(); events.get('/', authenticate, e.list);
events.post('/', ...requireAdmin, e.create); events.put('/:id', ...requireAdmin, e.update); events.delete('/:id', ...requireAdmin, e.remove);
module.exports = { notifications, events };
