import authService from '../src/services/authService';
import UserModel from '../src/models/user';
import * as jwtUtils from '../src/utils/jwt';
// Mock bcrypt module
jest.mock('bcrypt');

// Reference the mock after it's defined
const bcrypt = jest.requireMock('bcrypt');
import redisClient from '../src/utils/redis';
import dbPool from '../src/utils/db';

// Mock UserModel and JWT utilities
jest.mock('../src/models/user');
jest.mock('../src/utils/jwt');

// Mock Redis and DB connections to avoid actual connections during tests
jest.mock('../src/utils/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK')
  }
}));

jest.mock('../src/utils/db', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    end: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Close connections after all tests
  afterAll(async () => {
    await redisClient.quit();
    await dbPool.end();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Mock user data
      const userData = {
        email: 'test@example.com',
        password: 'Password123!'
      };
      
      // Mock database responses
      (UserModel.findByEmail as jest.Mock).mockResolvedValueOnce(null);
      (UserModel.create as jest.Mock).mockResolvedValueOnce({
        id: 1,
        email: userData.email,
        password: 'hashed_password',
        role: 'user',
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Mock token generation
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValueOnce('access_token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockResolvedValueOnce('refresh_token');
      
      // Call the register method
      const result = await authService.register(userData);
      
      // Assert results
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.tokens?.accessToken).toBe('access_token');
      expect(result.tokens?.refreshToken).toBe('refresh_token');
      expect(UserModel.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(UserModel.create).toHaveBeenCalledWith(userData);
    });

    it('should reject registration with invalid password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak'
      };
      
      const result = await authService.register(userData);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Password must be');
      expect(UserModel.findByEmail).not.toHaveBeenCalled();
      expect(UserModel.create).not.toHaveBeenCalled();
    });

    it('should reject registration when user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Password123!'
      };
      
      // Mock existing user
      (UserModel.findByEmail as jest.Mock).mockResolvedValueOnce({
        id: 1,
        email: userData.email,
        password: 'hashed_password',
        role: 'user',
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const result = await authService.register(userData);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
      expect(UserModel.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(UserModel.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should log in a user successfully', async () => {
      const email = 'test@example.com';
      const password = 'Password123!';
      
      // Mock user lookup and password comparison
      (UserModel.findByEmail as jest.Mock).mockResolvedValueOnce({
        id: 1,
        email,
        password: 'hashed_password',
        role: 'user',
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Properly mock bcrypt.compare to return true
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      
      // Mock token generation
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValueOnce('access_token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockResolvedValueOnce('refresh_token');
      
      const result = await authService.login(email, password);
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.tokens?.accessToken).toBe('access_token');
      expect(result.tokens?.refreshToken).toBe('refresh_token');
    });
  });
});