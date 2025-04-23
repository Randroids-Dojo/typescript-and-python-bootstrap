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
// BetterAuth doesn't have expressMiddleware method in the type definition
// Use raw Express route handler instead
router.use('/api/auth/*', authLimiter, (req, res, next) => {
  // Here we would typically use auth.api.handler or similar
  // For now, forward to our controller
  next();
});

export default router;