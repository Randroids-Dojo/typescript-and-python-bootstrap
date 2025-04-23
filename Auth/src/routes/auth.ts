import express from 'express';
import auth from '../auth';
import rateLimit from 'express-rate-limit';
import { LOGIN_RATE_LIMIT } from '../config';

const router = express.Router();

// Create rate limiters
const authLimiter = rateLimit({
  windowMs: LOGIN_RATE_LIMIT.windowMs,
  max: LOGIN_RATE_LIMIT.max,
  standardHeaders: true,
  message: { message: 'Too many login attempts, please try again later' },
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'] as string || 'unknown',
  skip: (req) => process.env.NODE_ENV === 'test',
});

// Use Better Auth's built-in API middleware for auth routes
router.use('/api/auth/*', authLimiter, auth.api.expressMiddleware());

export default router;