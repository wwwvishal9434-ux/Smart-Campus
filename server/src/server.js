const env = require('./config/env');
const app = require('./app');
app.listen(env.port, () => console.log(`Smart Campus API on http://localhost:${env.port} (${env.nodeEnv})`));
