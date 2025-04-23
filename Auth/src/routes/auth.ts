import express from 'express';
import authController from '../controllers/authController';
import { authenticateJwt } from '../middleware/auth';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../utils/redis';
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
  store: new RedisStore({
    sendCommand: (...args: any[]) => redisClient.call(...args),
    prefix: 'ratelimit:auth:'
  }),
});

// Public routes
router.post('/register', authLimiter, authController.register.bind(authController));
router.post('/login', authLimiter, authController.login.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));

// Protected routes
router.get('/validate', authenticateJwt, authController.validate.bind(authController));
router.get('/me', authenticateJwt, authController.me.bind(authController));
router.post('/logout', authenticateJwt, authController.logout.bind(authController));

export default router;