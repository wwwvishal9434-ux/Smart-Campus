const express = require('express');
const { requireAdmin, requireStudent } = require('../middleware/auth');
const companies = require('../controllers/companies.controller'), jobs = require('../controllers/jobs.controller'), apps = require('../controllers/applications.controller');
const crud = (c) => { const r = express.Router(); r.use(...requireAdmin); r.get('/', c.list); r.post('/', c.create); r.put('/:id', c.update); r.delete('/:id', c.remove); return r; };
const j = crud(jobs); // student routes first so '/mine' is not captured by admin guard
const jobsRouter = express.Router(); jobsRouter.get('/mine', ...requireStudent, jobs.mine); jobsRouter.post('/:id/apply', ...requireStudent, jobs.apply); jobsRouter.use(j);
const appsRouter = express.Router(); appsRouter.get('/mine', ...requireStudent, apps.mine);
appsRouter.get('/stats', ...requireAdmin, apps.stats); appsRouter.get('/', ...requireAdmin, apps.list); appsRouter.patch('/:id/status', ...requireAdmin, apps.setStatus);
module.exports = { companies: crud(companies), jobs: jobsRouter, applications: appsRouter };
