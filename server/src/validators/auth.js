const { z } = require('zod');
const password = z.string().min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Include an uppercase letter').regex(/[a-z]/, 'Include a lowercase letter').regex(/[0-9]/, 'Include a number');
const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password, confirmPassword: z.string(),
  enrollmentNo: z.string().trim().min(4).max(30),
  courseId: z.string().min(1, 'Select a course'),
  semester: z.coerce.number().int().min(1).max(6),
  phone: z.string().trim().regex(/^[0-9+\-\s]{10,15}$/, 'Enter a valid phone number'),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1, 'Password is required') });
const forgotSchema = z.object({ email: z.string().trim().toLowerCase().email() });
const resetSchema = z.object({ token: z.string().min(20), password });
module.exports = { registerSchema, loginSchema, forgotSchema, resetSchema };
