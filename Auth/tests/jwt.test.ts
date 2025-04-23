import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeToken,
  revokeTokenFamily
} from '../src/utils/jwt';
import { JWT_SECRET } from '../src/config';
import redisClient from '../src/utils/redis';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('crypto');
jest.mock('uuid');
jest.mock('../src/config', () => ({
  JWT_SECRET: 'test_secret',
  JWT_ACCESS_EXPIRATION: '15m',
  JWT_REFRESH_EXPIRATION: '7d'
}));
jest.mock('../src/utils/redis');

describe('JWT Utilities', () => {
  const mockUser = {
    id: 123,
    email: 'test@example.com',
    password: 'hashed_password',
    role: 'user',
    tokenVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate a JWT with correct payload', () => {
      // Mock uuid generation
      (uuidv4 as jest.Mock).mockReturnValueOnce('mock-uuid');
      
      // Mock Date.now() to have consistent timestamps
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => 1600000000000); // Specific timestamp
      
      // Mock jwt.sign to return token
      (jwt.sign as jest.Mock).mockReturnValueOnce('mock_access_token');
      
      // Call the function
      const token = generateAccessToken(mockUser);
      
      // Verify jwt.sign was called with correct parameters
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          sub: mockUser.id.toString(),
          role: mockUser.role,
          jti: 'mock-uuid',
          iat: 1600000000 // Seconds timestamp
        },
        JWT_SECRET,
        {
          expiresIn: '15m',
          issuer: 'better-auth-service'
        }
      );
      
      // Verify returned token
      expect(token).toBe('mock_access_token');
      
      // Restore Date.now
      Date.now = originalDateNow;
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token and store it in Redis', async () => {
      // Mock crypto.randomBytes to generate token
      const mockBuffer = Buffer.from('random_buffer');
      (crypto.randomBytes as jest.Mock).mockReturnValueOnce(mockBuffer);
      mockBuffer.toString = jest.fn().mockReturnValueOnce('mock_refresh_token');
      
      // Mock crypto.createHash for token hashing
      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValueOnce('hashed_token')
      };
      (crypto.createHash as jest.Mock).mockReturnValueOnce(mockHash);
      
      // Mock uuid generation
      (uuidv4 as jest.Mock).mockReturnValueOnce('token-family-uuid');
      
      // Call the function
      const token = await generateRefreshToken(mockUser);
      
      // Verify token generation
      expect(crypto.randomBytes).toHaveBeenCalledWith(64);
      expect(mockBuffer.toString).toHaveBeenCalledWith('hex');
      
      // Verify token hashing
      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.update).toHaveBeenCalledWith('mock_refresh_token');
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
      
      // Verify Redis storage
      expect(redisClient.set).toHaveBeenCalledWith(
        'refresh_token:hashed_token',
        JSON.stringify({
          userId: mockUser.id,
          tokenFamily: 'token-family-uuid',
          used: false
        }),
        'EX',
        expect.any(Number) // Verify expiration time is passed
      );
      
      // Verify returned token
      expect(token).toBe('mock_refresh_token');
    });
  });

  describe('verifyAccessToken', () => {
    it('should return decoded token payload if token is valid', () => {
      // Mock jwt.verify to return decoded payload
      const mockPayload = {
        sub: '123',
        role: 'user',
        tokenVersion: 1
      };
      (jwt.verify as jest.Mock).mockReturnValueOnce(mockPayload);
      
      // Call the function
      const result = verifyAccessToken('valid_token');
      
      // Verify jwt.verify was called correctly
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', JWT_SECRET);
      
      // Verify returned payload
      expect(result).toEqual(mockPayload);
    });

    it('should return null if token verification fails', () => {
      // Mock jwt.verify to throw error
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });
      
      // Call the function
      const result = verifyAccessToken('invalid_token');
      
      // Verify returned null
      expect(result).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return token data if token is valid and unused', async () => {
      // Mock crypto.createHash for token hashing
      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValueOnce('hashed_token')
      };
      (crypto.createHash as jest.Mock).mockReturnValueOnce(mockHash);
      
      // Mock Redis get to return token data
      const mockTokenData = JSON.stringify({
        userId: '123',
        tokenFamily: 'family-uuid',
        used: false
      });
      (redisClient.get as jest.Mock).mockResolvedValueOnce(mockTokenData);
      
      // Call the function
      const result = await verifyRefreshToken('valid_token');
      
      // Verify token hashing
      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.update).toHaveBeenCalledWith('valid_token');
      
      // Verify Redis get
      expect(redisClient.get).toHaveBeenCalledWith('refresh_token:hashed_token');
      
      // Verify Redis set (marking token as used)
      expect(redisClient.set).toHaveBeenCalledWith(
        'refresh_token:hashed_token',
        JSON.stringify({
          userId: '123',
          tokenFamily: 'family-uuid',
          used: true
        }),
        'KEEPTTL'
      );
      
      // Verify returned token data
      expect(result).toEqual({
        userId: '123',
        tokenFamily: 'family-uuid'
      });
    });

    it('should return null if Redis returns no token data', async () => {
      // Mock crypto.createHash for token hashing
      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValueOnce('hashed_token')
      };
      (crypto.createHash as jest.Mock).mockReturnValueOnce(mockHash);
      
      // Mock Redis get to return null (no token found)
      (redisClient.get as jest.Mock).mockResolvedValueOnce(null);
      
      // Call the function
      const result = await verifyRefreshToken('invalid_token');
      
      // Verify Redis get
      expect(redisClient.get).toHaveBeenCalledWith('refresh_token:hashed_token');
      
      // Verify returned null
      expect(result).toBeNull();
    });

    it('should return null and revoke family if token has been used', async () => {
      // Mock crypto.createHash for token hashing
      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValueOnce('hashed_token')
      };
      (crypto.createHash as jest.Mock).mockReturnValueOnce(mockHash);
      
      // Mock Redis get to return token data with used=true
      const mockTokenData = JSON.stringify({
        userId: '123',
        tokenFamily: 'family-uuid',
        used: true // Token already used (possible reuse/theft)
      });
      (redisClient.get as jest.Mock).mockResolvedValueOnce(mockTokenData);
      
      // Call the function
      const result = await verifyRefreshToken('reused_token');
      
      // Verify token revocation
      expect(redisClient.set).toHaveBeenCalledWith(
        'revoked_family:family-uuid',
        '1',
        'EX',
        expect.any(Number)
      );
      
      // Verify returned null
      expect(result).toBeNull();
    });
  });

  describe('revokeToken', () => {
    it('should delete the token from Redis and return true if successful', async () => {
      // Mock crypto.createHash for token hashing
      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValueOnce('hashed_token')
      };
      (crypto.createHash as jest.Mock).mockReturnValueOnce(mockHash);
      
      // Mock Redis del to return 1 (successful deletion)
      (redisClient.del as jest.Mock).mockResolvedValueOnce(1);
      
      // Call the function
      const result = await revokeToken('token_to_revoke');
      
      // Verify Redis del
      expect(redisClient.del).toHaveBeenCalledWith('refresh_token:hashed_token');
      
      // Verify returned true
      expect(result).toBe(true);
    });

    it('should return false if Redis returns 0 (token not found)', async () => {
      // Mock crypto.createHash for token hashing
      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValueOnce('hashed_token')
      };
      (crypto.createHash as jest.Mock).mockReturnValueOnce(mockHash);
      
      // Mock Redis del to return 0 (no token deleted)
      (redisClient.del as jest.Mock).mockResolvedValueOnce(0);
      
      // Call the function
      const result = await revokeToken('nonexistent_token');
      
      // Verify returned false
      expect(result).toBe(false);
    });

    it('should return false if Redis operation fails', async () => {
      // Mock crypto.createHash for token hashing
      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValueOnce('hashed_token')
      };
      (crypto.createHash as jest.Mock).mockReturnValueOnce(mockHash);
      
      // Mock console.error to avoid test output pollution
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Mock Redis del to throw error
      (redisClient.del as jest.Mock).mockRejectedValueOnce(new Error('Redis error'));
      
      // Call the function
      const result = await revokeToken('token_to_revoke');
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalled();
      
      // Verify returned false
      expect(result).toBe(false);
      
      // Restore console.error
      console.error = originalConsoleError;
    });
  });

  describe('revokeTokenFamily', () => {
    it('should create a Redis entry marking the family as revoked', async () => {
      // Call the function
      await revokeTokenFamily('family_to_revoke');
      
      // Verify Redis set
      expect(redisClient.set).toHaveBeenCalledWith(
        'revoked_family:family_to_revoke',
        '1',
        'EX',
        expect.any(Number)
      );
    });
  });
});