require('dotenv').config();
const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const k of required) if (!process.env[k]) { console.error(`Missing env var: ${k}`); process.exit(1); }
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) { console.error('JWT_SECRET must be at least 32 characters in production'); process.exit(1); }
module.exports = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileMb: Number(process.env.MAX_FILE_SIZE_MB) || 10,
};
