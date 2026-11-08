// Lets unit tests load real middleware/services without a database: config/prisma is replaced by a fake we control.
const Module = require('module');
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'unit-test-secret'; process.env.NODE_ENV = 'test';
const fake = {}; const orig = Module._load;
Module._load = function (request) { return request.endsWith('config/prisma') ? fake : orig.apply(this, arguments); };
module.exports = fake;
