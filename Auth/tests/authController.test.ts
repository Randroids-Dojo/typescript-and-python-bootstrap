import { Request, Response } from 'express';
import authController from '../src/controllers/authController';
import authService from '../src/services/authService';

// Mock the bcrypt module
jest.mock('bcrypt');

// Mock authService
jest.mock('../src/services/authService');

describe('AuthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject = {};

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request and response
    mockRequest = {
      body: {},
      cookies: {},
      user: { id: '1', role: 'user' }
    };
    
    // Create mock response with jest functions
    responseObject = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation(result => {
        responseObject = result;
        return mockResponse;
      }),
      clearCookie: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis()
    };
  });

  describe('register', () => {
    it('should return 400 if email or password is missing', async () => {
      // Call the register method with empty body
      await authController.register(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('required') })
      );
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('should return 400 if registration fails', async () => {
      // Setup request with valid data
      mockRequest.body = {
        email: 'test@example.com',
        password: 'Password123!'
      };
      
      // Mock service to return failure
      (authService.register as jest.Mock).mockResolvedValueOnce({
        success: false,
        message: 'Registration failed'
      });
      
      // Call the register method
      await authController.register(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Registration failed' })
      );
      expect(authService.register).toHaveBeenCalledWith(mockRequest.body);
    });

    it('should return 201 on successful registration', async () => {
      // Setup request with valid data
      mockRequest.body = {
        email: 'test@example.com',
        password: 'Password123!'
      };
      
      // Mock service to return success
      const mockUser = { id: 1, email: 'test@example.com', role: 'user' };
      const mockTokens = { accessToken: 'access', refreshToken: 'refresh' };
      
      (authService.register as jest.Mock).mockResolvedValueOnce({
        success: true,
        user: mockUser,
        tokens: mockTokens
      });
      
      // Call the register method
      await authController.register(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User registered successfully',
          user: mockUser
        })
      );
      expect(authService.register).toHaveBeenCalledWith(mockRequest.body);
    });

    it('should handle unexpected errors', async () => {
      // Setup request with valid data
      mockRequest.body = {
        email: 'test@example.com',
        password: 'Password123!'
      };
      
      // Mock service to throw error
      (authService.register as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      // Mock console.error to avoid test output pollution
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Call the register method
      await authController.register(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Registration failed' })
      );
      expect(console.error).toHaveBeenCalled();
      
      // Restore console.error
      console.error = originalConsoleError;
    });
  });

  describe('login', () => {
    it('should return 400 if email or password is missing', async () => {
      // Call the login method with empty body
      await authController.login(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('required') })
      );
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should return 401 if login fails', async () => {
      // Setup request with valid data
      mockRequest.body = {
        email: 'test@example.com',
        password: 'Password123!'
      };
      
      // Mock service to return failure
      (authService.login as jest.Mock).mockResolvedValueOnce({
        success: false,
        message: 'Invalid credentials'
      });
      
      // Call the login method
      await authController.login(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid credentials' })
      );
      expect(authService.login).toHaveBeenCalledWith(
        mockRequest.body.email, 
        mockRequest.body.password
      );
    });

    it('should return 200 on successful login', async () => {
      // Setup request with valid data
      mockRequest.body = {
        email: 'test@example.com',
        password: 'Password123!'
      };
      
      // Mock service to return success
      const mockUser = { id: 1, email: 'test@example.com', role: 'user' };
      const mockTokens = { accessToken: 'access', refreshToken: 'refresh' };
      
      (authService.login as jest.Mock).mockResolvedValueOnce({
        success: true,
        user: mockUser,
        tokens: mockTokens
      });
      
      // Call the login method
      await authController.login(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          user: mockUser
        })
      );
      expect(authService.login).toHaveBeenCalledWith(
        mockRequest.body.email, 
        mockRequest.body.password
      );
    });
  });

  describe('refresh', () => {
    it('should return 400 if refresh token is missing', async () => {
      // Call the refresh method with no token
      await authController.refresh(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('required') })
      );
      expect(authService.refreshToken).not.toHaveBeenCalled();
    });

    it('should return 401 if token refresh fails', async () => {
      // Setup request with refresh token in cookies
      mockRequest.cookies = { refresh_token: 'refresh_token_value' };
      
      // Mock service to return failure
      (authService.refreshToken as jest.Mock).mockResolvedValueOnce({
        success: false,
        message: 'Invalid refresh token'
      });
      
      // Call the refresh method
      await authController.refresh(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid refresh token' })
      );
      expect(authService.refreshToken).toHaveBeenCalledWith('refresh_token_value');
    });

    it('should return 200 on successful token refresh', async () => {
      // Setup request with refresh token in cookies
      mockRequest.cookies = { refresh_token: 'refresh_token_value' };
      
      // Mock service to return success
      const mockTokens = { accessToken: 'new_access', refreshToken: 'new_refresh' };
      
      (authService.refreshToken as jest.Mock).mockResolvedValueOnce({
        success: true,
        tokens: mockTokens
      });
      
      // Call the refresh method
      await authController.refresh(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token refreshed successfully'
        })
      );
      expect(authService.refreshToken).toHaveBeenCalledWith('refresh_token_value');
    });
  });

  describe('logout', () => {
    it('should return 400 if refresh token or user ID is missing', async () => {
      // Call the logout method with no token
      await authController.logout(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('required') })
      );
      expect(authService.logout).not.toHaveBeenCalled();
    });

    it('should return 200 on successful logout', async () => {
      // Setup request with refresh token in cookies and user ID
      mockRequest.cookies = { refresh_token: 'refresh_token_value' };
      mockRequest.user = { id: '1', role: 'user' };
      
      // Call the logout method
      await authController.logout(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Logged out successfully'
        })
      );
      expect(authService.logout).toHaveBeenCalledWith('refresh_token_value', '1');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('access_token');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('me', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Setup request with no user
      mockRequest.user = undefined;
      
      // Call the me method
      await authController.me(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Authentication required' })
      );
      expect(authService.getUserProfile).not.toHaveBeenCalled();
    });

    it('should return 404 if user profile is not found', async () => {
      // Setup request with user ID
      mockRequest.user = { id: '1', role: 'user' };
      
      // Mock service to return failure
      (authService.getUserProfile as jest.Mock).mockResolvedValueOnce({
        success: false,
        message: 'User not found'
      });
      
      // Call the me method
      await authController.me(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'User not found' })
      );
      expect(authService.getUserProfile).toHaveBeenCalledWith('1');
    });

    it('should return 200 with user profile on success', async () => {
      // Setup request with user ID
      mockRequest.user = { id: '1', role: 'user' };
      
      // Mock service to return success
      const mockUser = { id: 1, email: 'test@example.com', role: 'user' };
      
      (authService.getUserProfile as jest.Mock).mockResolvedValueOnce({
        success: true,
        user: mockUser
      });
      
      // Call the me method
      await authController.me(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        user: mockUser
      });
      expect(authService.getUserProfile).toHaveBeenCalledWith('1');
    });
  });

  describe('validate', () => {
    it('should return 200 with user data for valid tokens', async () => {
      // Setup request with user (middleware sets this if token is valid)
      mockRequest.user = { id: '1', role: 'user' };
      
      // Call the validate method
      await authController.validate(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        valid: true,
        user: { id: '1', role: 'user' }
      });
    });
  });
});