import { Request, Response, NextFunction } from 'express';
import { authenticateJwt, authenticateJwtLegacy, authorize } from '../src/middleware/auth';
import auth from '../src/auth';
import { verifyAccessToken } from '../src/utils/jwt';
import UserModel from '../src/models/user';

// Mock dependencies
jest.mock('../src/auth', () => ({
  api: {
    getSession: jest.fn()
  }
}));

jest.mock('../src/utils/jwt', () => ({
  verifyAccessToken: jest.fn()
}));

jest.mock('../src/models/user', () => ({
  findById: jest.fn()
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock request and response
    mockRequest = {
      headers: {
        authorization: 'Bearer test_token'
      },
      cookies: {},
      user: undefined
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    nextFunction = jest.fn();
  });

  describe('authenticateJwt', () => {
    it('should set user data and call next() if session is valid', async () => {
      // Mock successful BetterAuth session
      (auth.api.getSession as jest.Mock).mockResolvedValueOnce({
        user: { id: 'user123' }
      });
      
      // Call the middleware
      await authenticateJwt(
        mockRequest as Request, 
        mockResponse as Response, 
        nextFunction
      );
      
      // Verify user was set and next was called
      expect(mockRequest.user).toEqual({
        id: 'user123',
        role: 'user'
      });
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no session is found', async () => {
      // Mock null session
      (auth.api.getSession as jest.Mock).mockResolvedValueOnce(null);
      
      // Call the middleware
      await authenticateJwt(
        mockRequest as Request, 
        mockResponse as Response, 
        nextFunction
      );
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Authentication required'
      });
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should return 500 if authentication throws an error', async () => {
      // Mock error
      (auth.api.getSession as jest.Mock).mockRejectedValueOnce(new Error('Auth error'));
      
      // Mock console.error to avoid test output pollution
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Call the middleware
      await authenticateJwt(
        mockRequest as Request, 
        mockResponse as Response, 
        nextFunction
      );
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Authentication error'
      });
      expect(nextFunction).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      
      // Restore console.error
      console.error = originalConsoleError;
    });
  });

  describe('authenticateJwtLegacy', () => {
    it('should set user data and call next() if token is valid', async () => {
      // Setup valid token in the request
      mockRequest.headers = {
        authorization: 'Bearer valid_token'
      };
      
      // Mock token verification
      (verifyAccessToken as jest.Mock).mockReturnValueOnce({
        sub: 'user123',
        role: 'admin',
        tokenVersion: 1
      });
      
      // Mock user lookup
      (UserModel.findById as jest.Mock).mockResolvedValueOnce({
        id: 'user123',
        tokenVersion: 1
      });
      
      // Call the middleware
      await authenticateJwtLegacy(
        mockRequest as Request, 
        mockResponse as Response, 
        nextFunction
      );
      
      // Verify user was set and next was called
      expect(mockRequest.user).toEqual({
        id: 'user123',
        role: 'admin'
      });
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no token is provided', async () => {
      // No token in request
      mockRequest.headers = {};
      mockRequest.cookies = {};
      
      // Call the middleware
      await authenticateJwtLegacy(
        mockRequest as Request, 
        mockResponse as Response, 
        nextFunction
      );
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Authentication required'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      // Setup token in the request
      mockRequest.headers = {
        authorization: 'Bearer invalid_token'
      };
      
      // Mock token verification to return null (invalid token)
      (verifyAccessToken as jest.Mock).mockReturnValueOnce(null);
      
      // Call the middleware
      await authenticateJwtLegacy(
        mockRequest as Request, 
        mockResponse as Response, 
        nextFunction
      );
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid token'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not found', async () => {
      // Setup valid token in the request
      mockRequest.headers = {
        authorization: 'Bearer valid_token'
      };
      
      // Mock token verification
      (verifyAccessToken as jest.Mock).mockReturnValueOnce({
        sub: 'user123',
        role: 'admin',
        tokenVersion: 1
      });
      
      // Mock user lookup to return null (user not found)
      (UserModel.findById as jest.Mock).mockResolvedValueOnce(null);
      
      // Call the middleware
      await authenticateJwtLegacy(
        mockRequest as Request, 
        mockResponse as Response, 
        nextFunction
      );
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Token expired'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token version is outdated', async () => {
      // Setup valid token in the request
      mockRequest.headers = {
        authorization: 'Bearer valid_token'
      };
      
      // Mock token verification with older token version
      (verifyAccessToken as jest.Mock).mockReturnValueOnce({
        sub: 'user123',
        role: 'admin',
        tokenVersion: 1
      });
      
      // Mock user lookup with newer token version (token is outdated)
      (UserModel.findById as jest.Mock).mockResolvedValueOnce({
        id: 'user123',
        tokenVersion: 2 // Newer version than token
      });
      
      // Call the middleware
      await authenticateJwtLegacy(
        mockRequest as Request, 
        mockResponse as Response, 
        nextFunction
      );
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Token expired'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should call next() if user has required role', () => {
      // Setup user with 'admin' role
      mockRequest.user = {
        id: 'user123',
        role: 'admin'
      };
      
      // Create middleware that requires 'admin' role
      const middleware = authorize(['admin']);
      
      // Call the middleware
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Verify next was called
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should call next() if no roles are required', () => {
      // Setup user with any role
      mockRequest.user = {
        id: 'user123',
        role: 'user'
      };
      
      // Create middleware with no required roles
      const middleware = authorize();
      
      // Call the middleware
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Verify next was called
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', () => {
      // No user in request
      mockRequest.user = undefined;
      
      // Create middleware with any roles
      const middleware = authorize(['admin']);
      
      // Call the middleware
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Authentication required'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not have required role', () => {
      // Setup user with 'user' role
      mockRequest.user = {
        id: 'user123',
        role: 'user'
      };
      
      // Create middleware that requires 'admin' role
      const middleware = authorize(['admin']);
      
      // Call the middleware
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Access forbidden'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});