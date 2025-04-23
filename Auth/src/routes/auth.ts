import express from 'express';
import rateLimit from 'express-rate-limit';
import { LOGIN_RATE_LIMIT } from '../config';
import authController from '../controllers/authController';
import { authenticateJwt, authenticateJwtLegacy, authorize } from '../middleware/auth';

const router = express.Router();

// Create rate limiters
const authLimiter = rateLimit({
  windowMs: LOGIN_RATE_LIMIT.windowMs,
  max: LOGIN_RATE_LIMIT.max,
  standardHeaders: true,
  message: { message: 'Too many login attempts, please try again later' },
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'] as string || 'unknown',
  // We're intentionally ignoring the request parameter
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  skip: (_req) => process.env.NODE_ENV === 'test',
});

// Apply rate limiting to auth routes
router.use('/api/auth/login', authLimiter);
router.use('/api/auth/register', authLimiter);

// Define auth endpoints
const API_PREFIX = '/api/auth';

// Public routes
router.post(`${API_PREFIX}/register`, (req, res) => authController.register(req, res));
router.post(`${API_PREFIX}/login`, (req, res) => authController.login(req, res));
router.post(`${API_PREFIX}/refresh`, (req, res) => authController.refresh(req, res));

// Health endpoint (unprotected)
router.get(`${API_PREFIX}/health`, (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Protected routes - require authentication
router.get(`${API_PREFIX}/me`, authenticateJwt, (req, res) => authController.me(req, res));
router.post(`${API_PREFIX}/logout`, authenticateJwt, (req, res) => authController.logout(req, res));
router.post(`${API_PREFIX}/validate`, authenticateJwtLegacy, (req, res) => authController.validate(req, res));

// Admin routes - require admin authorization
router.get(`${API_PREFIX}/admin`, authenticateJwt, authorize(['admin']), (_req, res) => {
  res.status(200).json({ message: 'Admin access granted' });
});

export default router;