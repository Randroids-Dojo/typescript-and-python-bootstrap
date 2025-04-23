import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import UserModel from '../models/user';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

// Authentication middleware
export const authenticateJwt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from Authorization header or cookie
    const token = 
      req.cookies?.access_token || 
      (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    
    // Check if token was issued before password change or logout
    const user = await UserModel.findById(decoded.sub);
    
    if (!user || (decoded.tokenVersion !== undefined && user.tokenVersion > decoded.tokenVersion)) {
      res.status(401).json({ message: 'Token expired' });
      return;
    }
    
    // Add user data to request
    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Role-based authorization middleware
export const authorize = (roles: string[] = []): (req: Request, res: Response, next: NextFunction) => void => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Access forbidden' });
      return;
    }
    
    next();
  };
};