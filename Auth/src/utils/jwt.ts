import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { JWT_SECRET, JWT_ACCESS_EXPIRATION, JWT_REFRESH_EXPIRATION } from '../config';
import redisClient from './redis';
import { User } from '../models/user';

interface TokenPayload {
  sub: string;
  role: string;
  tokenVersion?: number;
  jti?: string;
  iat?: number;
}

// Generate access token
export const generateAccessToken = (user: User): string => {
  const payload: TokenPayload = {
    sub: user.id.toString(),
    role: user.role,
    jti: uuidv4(),
    iat: Math.floor(Date.now() / 1000),
  };

  // @ts-expect-error JWT signing options type issue
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRATION,
    issuer: 'better-auth-service',
  });
};

// Generate refresh token
export const generateRefreshToken = async (user: User): Promise<string> => {
  // Create a cryptographically strong refresh token
  const refreshToken = crypto.randomBytes(64).toString('hex');
  
  // Create a hash of the refresh token to store in Redis
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  
  // Generate token family to track potential token theft
  const tokenFamily = uuidv4();
  
  // Store the hash in Redis with expiration
  const expiresIn = getExpirationSeconds(JWT_REFRESH_EXPIRATION);
  
  await redisClient.set(
    `refresh_token:${refreshTokenHash}`,
    JSON.stringify({
      userId: user.id,
      tokenFamily,
      used: false,
    }),
    'EX',
    expiresIn
  );
  
  return refreshToken;
};

// Verify access token
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // We're intentionally ignoring the error and just returning null
    // when the token is invalid
    return null;
  }
};

// Verify refresh token
export const verifyRefreshToken = async (token: string): Promise<{userId: string, tokenFamily: string} | null> => {
  try {
    // Create hash of the refresh token
    const refreshTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Get token data from Redis
    const tokenData = await redisClient.get(`refresh_token:${refreshTokenHash}`);
    
    if (!tokenData) {
      return null;
    }
    
    const parsedData = JSON.parse(tokenData);
    
    // Check if token has been used already (potential token theft)
    if (parsedData.used) {
      // Token reuse detected - revoke all tokens in this family
      await revokeTokenFamily(parsedData.tokenFamily);
      return null;
    }
    
    // Mark this token as used
    await redisClient.set(
      `refresh_token:${refreshTokenHash}`,
      JSON.stringify({ ...parsedData, used: true }),
      'KEEPTTL'
    );
    
    return {
      userId: parsedData.userId,
      tokenFamily: parsedData.tokenFamily
    };
  } catch (error) {
    // Any errors in token verification result in a null return
    // This could be a Redis error or JSON parsing error
    console.error('Refresh token verification error:', error);
    return null;
  }
};

// Revoke all tokens in a family (used when token theft is detected)
export const revokeTokenFamily = async (tokenFamily: string): Promise<void> => {
  // This would be more efficient with a secondary index in a real database
  // For this implementation, we'll use a Redis set to track token families
  await redisClient.set(`revoked_family:${tokenFamily}`, '1', 'EX', getExpirationSeconds(JWT_REFRESH_EXPIRATION));
};

// Revoke a specific token
export const revokeToken = async (token: string): Promise<boolean> => {
  try {
    const refreshTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const result = await redisClient.del(`refresh_token:${refreshTokenHash}`);
    return result === 1;
  } catch (error) {
    // Any Redis errors result in a false return
    console.error('Token revocation error:', error);
    return false;
  }
};

// Helper to convert JWT expiration time format to seconds
const getExpirationSeconds = (expirationString: string): number => {
  const match = expirationString.match(/^(\d+)([smhd])$/);
  
  if (!match) {
    return 60 * 60; // Default to 1 hour if format is invalid
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch(unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    default: return 60 * 60;
  }
};