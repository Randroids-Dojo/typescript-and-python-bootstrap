import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import csurf from 'csurf';
import cors from 'cors';
import { IS_PRODUCTION, CORS_ORIGINS } from '../config';

// Configure CORS options
const corsOptions = {
  origin: CORS_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 86400 // 24 hours
};

// CSRF protection configuration
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'strict'
  }
});

// Apply CSRF protection only to sensitive operations
export const protectSensitiveOperation = (req: Request, res: Response, next: NextFunction): void => {
  csrfProtection(req, res, next);
};

// Set CSRF token middleware
export const setCsrfToken = (req: Request, res: Response, next: NextFunction): void => {
  csrfProtection(req, res, (error: any) => {
    if (error) {
      next(error);
      return;
    }
    
    // Set CSRF token in response
    res.cookie('XSRF-TOKEN', req.csrfToken(), {
      secure: IS_PRODUCTION,
      sameSite: 'strict'
    });
    
    next();
  });
};

// Helper function to configure security middleware
export const configureSecurityMiddleware = (app: any): void => {
  // Apply security headers with Helmet
  app.use(helmet());
  
  // Apply CORS
  app.use(cors(corsOptions));
  
  // Add X-Content-Type-Options header
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Add Content-Security-Policy in production
    if (IS_PRODUCTION) {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self';"
      );
    }
    
    next();
  });
};