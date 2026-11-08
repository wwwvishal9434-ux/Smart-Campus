const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/error');
const app = express();
if (env.nodeEnv === 'production') app.set('trust proxy', 1); // behind Render/Railway proxy: correct client IPs for rate limiting
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: { directives: { ...helmet.contentSecurityPolicy.getDefaultDirectives(), 'img-src': ["'self'", 'data:', 'https:'], 'upgrade-insecure-requests': null } } }));
app.use(cors({ origin: env.clientUrl.split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', require('./routes'));
// Single-service deployment: if the React app has been built, serve it from the same server (same origin, no CORS setup).
const dist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(path.join(dist, 'index.html'))) {
  app.use(express.static(dist));
  app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(dist, 'index.html'))); // SPA fallback for /login, /dashboard, ...
}
app.use(notFound);
app.use(errorHandler);
module.exports = app;
