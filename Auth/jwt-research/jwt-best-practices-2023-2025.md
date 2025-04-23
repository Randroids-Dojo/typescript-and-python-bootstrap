# JWT Authentication Best Practices (2023-2025)
## For Node.js Express Applications

### 1. JWT Token Structure and Security Considerations

#### Token Structure
- **Header**: Algorithm (alg) and token type (typ)
- **Payload**:
  - Standard claims: `iss` (issuer), `sub` (subject), `exp` (expiration), `iat` (issued at), `jti` (JWT ID)
  - Custom claims: Keep minimal, only essential user data (user_id, role)
- **Signature**: Created using a strong secret or private key

#### Security Parameters
- **Algorithm**: Use `RS256` (asymmetric) over `HS256` (symmetric) for production environments
- **Key Length**: Minimum 2048 bits for RSA keys, 256 bits for HMAC secrets
- **Token Size**: Keep tokens compact (<8KB) to prevent header overflow issues

#### Best Practices
- Generate cryptographically strong secrets using crypto libraries (not hardcoded strings)
- Store secrets in environment variables or secure vaults (AWS Secrets Manager, HashiCorp Vault)
- Rotate signing keys periodically (90-day rotation recommended)
- Use key identifiers (kid) in JWT header when using multiple keys
- Never include sensitive data in JWT payloads (passwords, PII)

```javascript
// Example of secure JWT creation with Node.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Generate strong secret
const generateSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Create token with secure configuration
const createToken = (userId, role) => {
  const payload = {
    sub: userId,
    role: role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    jti: crypto.randomUUID()
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, { 
    algorithm: 'RS256',
    issuer: 'better-auth-service'
  });
};
```

### 2. Access Token and Refresh Token Implementation

#### Access Tokens
- **Purpose**: Short-lived tokens for API access (5-30 minutes)
- **Stateless**: No database lookups needed to validate
- **Claims**: Include minimal user context needed for authorization

#### Refresh Tokens
- **Purpose**: Long-lived tokens to obtain new access tokens (1-30 days)
- **Stateful**: Should be stored in database for revocation capability
- **Security**: Higher entropy, tracked on server, revocable
- **Rotation**: Implement one-time use with automatic rotation

#### Implementation Strategy
- Use access tokens for API authorization
- Store refresh token hashes in database with user reference
- Implement refresh token rotation (family approach) for enhanced security

```javascript
// Access token and refresh token implementation
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const tokenService = {
  // Generate both access and refresh tokens
  generateTokens: async (user) => {
    // Access token - short lived
    const accessToken = jwt.sign(
      { 
        sub: user.id,
        role: user.role
      },
      process.env.JWT_ACCESS_SECRET,
      { 
        expiresIn: '15m',
        algorithm: 'RS256',
        jti: crypto.randomUUID()
      }
    );
    
    // Refresh token - longer lived
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    // Store refresh token hash in database
    await db.refreshTokens.create({
      token: refreshTokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
      family: crypto.randomUUID(), // token family for rotation
      used: false
    });
    
    return {
      accessToken,
      refreshToken
    };
  },
  
  // Refresh access token using refresh token
  refreshAccessToken: async (refreshToken) => {
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    // Find token in database
    const tokenRecord = await db.refreshTokens.findOne({ 
      where: { 
        token: refreshTokenHash,
        used: false,
        expiresAt: { $gt: new Date() }
      }
    });
    
    if (!tokenRecord) {
      throw new Error('Invalid refresh token');
    }
    
    // Mark current token as used
    await db.refreshTokens.update(
      { used: true },
      { where: { id: tokenRecord.id } }
    );
    
    // Get user and generate new tokens
    const user = await db.users.findByPk(tokenRecord.userId);
    return generateTokens(user);
  }
};
```

### 3. Token Storage Best Practices

#### Client-Side Storage
- **Access Tokens**:
  - Store in memory or React state (preferred)
  - Short-lived JavaScript variables
  - Avoid localStorage due to XSS vulnerability
  - If needed, store in HttpOnly cookies with Secure and SameSite flags
  
- **Refresh Tokens**:
  - Store only in HttpOnly cookies with:
    - `Secure: true` (HTTPS only)
    - `SameSite: strict` (prevents CSRF)
    - `HttpOnly: true` (inaccessible to JavaScript)
    - Limited path (e.g., `/api/auth/refresh`)
  - Never store in localStorage or sessionStorage

#### Server-Side Storage
- **Access Tokens**: Stateless, not stored server-side
- **Refresh Tokens**:
  - Store hashed values only (SHA-256)
  - Include user ID, expiration, and usage status
  - Add token family ID for rotation tracking
  - Index database columns for fast lookup
  - Implement automatic cleanup of expired tokens

```javascript
// Server-side: Setting secure cookies
const setTokenCookies = (res, tokens) => {
  // Access token - short lived, less restrictive
  res.cookie('access_token', tokens.accessToken, {
    maxAge: 15 * 60 * 1000, // 15 minutes
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api'
  });
  
  // Refresh token - longer lived, more restrictive
  res.cookie('refresh_token', tokens.refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh' // Restricted path
  });
};
```

### 4. Token Rotation and Revocation

#### Token Rotation
- **Refresh Token Rotation**: Issue new refresh token with each use
- **Token Families**: Group refresh tokens by "family" to detect theft
- **Detection Strategy**:
  - If a refresh token is used twice, revoke entire token family
  - Track token usage status to detect replay attacks

#### Revocation Strategies
- **Absolute Revocation**: Maintain a blocklist of revoked JWTs (by jti)
- **User-Based Revocation**: Track "issued after" timestamp for each user
- **Global Version**: Implement global token version in JWT validation
- **Redis Integration**: Use Redis for high-performance blocklist checks

```javascript
// Detect and handle token reuse (security breach)
const detectTokenReuse = async (refreshToken) => {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const token = await db.refreshTokens.findOne({ where: { token: tokenHash } });
  
  if (token && token.used) {
    // Token reuse detected! Potential token theft
    console.log(`Token reuse detected for user ${token.userId}, family ${token.family}`);
    
    // Revoke all tokens in this family
    await db.refreshTokens.update(
      { revoked: true },
      { where: { family: token.family } }
    );
    
    // Log user out of all sessions
    await db.users.update(
      { tokenVersion: db.sequelize.literal('tokenVersion + 1') },
      { where: { id: token.userId } }
    );
    
    throw new Error('Security breach detected');
  }
};
```

### 5. Protection Against Common Attacks

#### CSRF Protection
- Use SameSite=Strict cookies for refresh tokens
- Implement CSRF tokens for sensitive operations
- Use the "double submit cookie" pattern for added protection
- Validate Origin/Referer headers on sensitive endpoints

#### XSS Protection
- Never store tokens in localStorage
- Implement Content-Security-Policy headers
- Sanitize user inputs using libraries like DOMPurify
- Use httpOnly cookies for token storage when possible

#### Token Theft Mitigation
- Bind tokens to device fingerprints or IP addresses
- Implement silent token refresh patterns
- Track user sessions and allow users to view/revoke active sessions
- Use short-lived access tokens (15 minutes or less)

```javascript
// CSRF protection middleware for Express
import csurf from 'csurf';

// Setup CSRF protection
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Apply to routes needing protection
app.post('/api/auth/change-password', csrfProtection, (req, res) => {
  // Token will be validated automatically by middleware
});

// XSS protection headers middleware
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self';");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

### 6. Rate Limiting and Brute Force Protection

#### Rate Limiting Implementation
- Use token bucket or sliding window algorithms
- Apply tiered rate limits based on endpoint sensitivity
- Add incremental delays after failed authentication attempts
- Track limits by IP, user ID, and device fingerprint

#### Brute Force Protection
- Implement account lockout after multiple failed attempts
- Use exponential backoff for progressive delays
- Send notifications on suspicious login activities
- Track failed attempts by username to prevent user enumeration

```javascript
// Rate limiting with Express
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// General API rate limiter
const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// More strict limiter for authentication endpoints
const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  standardHeaders: true,
  message: 'Too many login attempts, please try again later',
  // Track by forwarded IP if behind reverse proxy
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for']
});

// Apply rate limiters
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

### 7. Passwordless Authentication Options

#### Email Magic Links
- Generate secure one-time tokens with short expiration (10-15 minutes)
- Include user ID and expiration in signed tokens
- Store tokens hashed in database with TTL
- Verify token and IP address match on callback

#### Time-based One-time Passwords (TOTP)
- Implement TOTP using libraries like `speakeasy`
- Generate and validate tokens using shared secrets
- Allow recovery codes for account recovery
- Support registration with QR codes for authenticator apps

#### WebAuthn/FIDO2 Implementation
- Support biometric authentication (fingerprint, face ID)
- Implement using `@simplewebauthn/server` library
- Store authenticator details in user records
- Offer as primary or secondary authentication factor

```javascript
// Email Magic Link implementation
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendEmail } from './emailService';

const magicLinkService = {
  // Generate and send magic link
  sendMagicLink: async (email) => {
    const user = await db.users.findOne({ where: { email } });
    if (!user) {
      // Don't reveal user existence, but don't send email
      return { success: true };
    }
    
    // Generate token with short expiration
    const token = jwt.sign(
      { 
        sub: user.id,
        purpose: 'magic-link'
      },
      process.env.JWT_EMAIL_SECRET,
      { expiresIn: '15m' }
    );
    
    // Store token hash in database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await db.emailTokens.create({
      token: tokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      used: false
    });
    
    // Create magic link URL
    const magicLink = `${process.env.APP_URL}/auth/verify?token=${token}`;
    
    // Send email with magic link
    await sendEmail({
      to: user.email,
      subject: 'Your login link',
      text: `Click here to log in: ${magicLink}`,
      html: `<p>Click <a href="${magicLink}">here</a> to log in.</p>`
    });
    
    return { success: true };
  },
  
  // Verify magic link token
  verifyMagicLink: async (token) => {
    try {
      // Verify JWT signature and expiration
      const decoded = jwt.verify(token, process.env.JWT_EMAIL_SECRET);
      
      // Verify token in database
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const storedToken = await db.emailTokens.findOne({
        where: {
          token: tokenHash,
          used: false,
          expiresAt: { $gt: new Date() }
        }
      });
      
      if (!storedToken) {
        throw new Error('Invalid or expired token');
      }
      
      // Mark token as used
      await db.emailTokens.update(
        { used: true },
        { where: { id: storedToken.id } }
      );
      
      // Get user and generate authentication tokens
      const user = await db.users.findByPk(decoded.sub);
      return generateTokens(user);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
};
```

### 8. Multi-factor Authentication Integration

#### MFA Implementation Approaches
- **Time-based One-time Passwords (TOTP)**: Google Authenticator, Authy
- **FIDO2/WebAuthn**: Biometric and security key authentication
- **SMS/Email Codes**: Less secure but widely used (SMS not recommended for high-security applications)

#### Integration with JWT
- Add MFA verification status to JWT claims
- Implement step-up authentication for sensitive operations
- Create separate authentication flows for MFA enrollment

#### Progressive MFA Implementation
- Risk-based authentication triggers (new device, location)
- Score-based approach combining multiple risk factors
- Flexible policies by user role or resource sensitivity

```javascript
// TOTP-based MFA implementation
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const mfaService = {
  // Generate new MFA secret for a user
  generateSecret: async (userId) => {
    const user = await db.users.findByPk(userId);
    
    // Generate new secret
    const secret = speakeasy.generateSecret({
      name: `BetterAuth:${user.email}`
    });
    
    // Store secret in database (encrypted)
    await db.users.update(
      { 
        mfaSecret: encrypt(secret.base32),
        mfaEnabled: false
      },
      { where: { id: userId } }
    );
    
    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    
    return {
      secret: secret.base32,
      qrCode
    };
  },
  
  // Verify MFA token during setup
  verifyAndEnableMfa: async (userId, token) => {
    const user = await db.users.findByPk(userId);
    const secret = decrypt(user.mfaSecret);
    
    // Verify token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1 // Allow 1 step before/after for time drift
    });
    
    if (!verified) {
      throw new Error('Invalid MFA token');
    }
    
    // Enable MFA
    await db.users.update(
      { mfaEnabled: true },
      { where: { id: userId } }
    );
    
    // Generate recovery codes
    const recoveryCodes = Array(10).fill().map(() => 
      crypto.randomBytes(10).toString('hex')
    );
    
    // Store hashed recovery codes
    await Promise.all(recoveryCodes.map(code => 
      db.recoveryCodes.create({
        userId,
        codeHash: crypto.createHash('sha256').update(code).digest('hex'),
        used: false
      })
    ));
    
    return { 
      success: true,
      recoveryCodes
    };
  },
  
  // Verify MFA during login
  verifyMfaToken: async (userId, token) => {
    const user = await db.users.findByPk(userId);
    
    if (!user.mfaEnabled) {
      return { verified: true };
    }
    
    const secret = decrypt(user.mfaSecret);
    
    // Verify token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1
    });
    
    return { verified };
  }
};
```

## Integrated Authentication Middleware Example

```javascript
// JWT authentication middleware for Express
import jwt from 'jsonwebtoken';

export const authenticateJwt = (req, res, next) => {
  try {
    // Get token from Authorization header or cookie
    const token = 
      req.cookies.access_token || 
      (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    // Check if token was issued before password change or logout
    const user = await db.users.findByPk(decoded.sub);
    const tokenIat = decoded.iat;
    
    if (user.tokenVersion > decoded.tokenVersion || 
        tokenIat < user.passwordChangedAt / 1000) {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    // Add user data to request
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      // Add other needed fields
    };
    
    next();
  } catch (error) {
    // Handle different JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// Role-based authorization middleware
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden' });
    }
    
    next();
  };
};
```

## Conclusion

Implementing a secure JWT authentication system requires careful attention to token lifecycle, storage mechanisms, and security practices. The BetterAuth implementation should follow these guidelines to ensure a secure, efficient, and maintainable authentication service.

Remember that authentication security is not a one-time implementation but requires regular updates as best practices evolve and new vulnerabilities are discovered. Stay updated with security bulletins and periodically review authentication implementations against the latest OWASP recommendations.