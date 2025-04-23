import { Request, Response, NextFunction } from 'express';
import auth from '../auth';
import { verifyAccessToken } from '../utils/jwt';
import UserModel from '../models/user';

// Extend Express Request type to include user property
// Using declaration merging instead of namespace

declare global {
  interface Express {
    // Empty interface for extension purposes
  }
}

declare module 'express' {
  interface Request {
    user?: {
      id: string;
      role: string;
    };
  }
}

// Authentication middleware using BetterAuth
export const authenticateJwt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Use BetterAuth's built-in authentication
    // Note: cookies property isn't supported in BetterAuth types
    const session = await auth.api.getSession({
      headers: req.headers as any
      // cookies property removed as it's not in the type definition
    });
    
    if (!session) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    
    // Add user data to request
    req.user = {
      id: session.user.id,
      // role property doesn't exist on session.user in BetterAuth types
      // use a default role of 'user' since we can't access it directly
      role: 'user',
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Legacy authentication middleware using our custom JWT implementation
export const authenticateJwtLegacy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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