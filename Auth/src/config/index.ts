import dotenv from 'dotenv';
dotenv.config();

// Server configuration
export const PORT = process.env.PORT || 4000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';

// JWT configuration
export const JWT_SECRET = process.env.JWT_SECRET || 'development-jwt-secret';
export const JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m';
export const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

// BetterAuth configuration
export const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || 'your-secret-key-should-be-changed-in-production';
export const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || 'http://localhost:4000';

// Database configuration
export const DB_CONFIG = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'app',
};

// Redis configuration
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/0';

// CORS configuration
export const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000'];

// Rate limiting
export const LOGIN_RATE_LIMIT = {
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW || '15', 10) * 60 * 1000, // 15 minutes by default
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5', 10), // 5 requests per window by default
};