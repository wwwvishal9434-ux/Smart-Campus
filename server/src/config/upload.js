// Local disk storage. To move to S3/Cloudinary/Supabase, replace this module and services/storage.js only.
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const multer = require('multer');
const env = require('./env'); const AppError = require('../utils/AppError');
const dir = path.resolve(env.uploadDir); fs.mkdirSync(dir, { recursive: true });
const ALLOWED = { '.pdf': ['application/pdf'], '.doc': ['application/msword'], '.txt': ['text/plain'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'], '.ppt': ['application/vnd.ms-powerpoint'],
  '.pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'], '.zip': ['application/zip', 'application/x-zip-compressed'] };
const make = (exts) => multer({
  storage: multer.diskStorage({ destination: dir, filename: (req, f, cb) => cb(null, crypto.randomUUID() + path.extname(f.originalname).toLowerCase()) }),
  limits: { fileSize: env.maxFileMb * 1024 * 1024, files: 1 },
  fileFilter: (req, f, cb) => { const ext = path.extname(f.originalname).toLowerCase();
    cb(exts.includes(ext) && ALLOWED[ext].includes(f.mimetype) ? null : new AppError(`Invalid file type. Allowed: ${exts.join(', ')}`, 400), exts.includes(ext) && ALLOWED[ext].includes(f.mimetype)); },
});
exports.notesUpload = make(['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt']);
exports.submissionUpload = make(['.pdf', '.doc', '.docx', '.zip', '.txt']);
exports.filePath = (key) => path.join(dir, path.basename(key)); // basename blocks path traversal
exports.removeFile = (key) => fs.promises.unlink(exports.filePath(key)).catch(() => {});
