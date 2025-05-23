import { betterAuth } from "better-auth"
import { Pool } from "pg"

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error("DATABASE_URL must be set in production");
    }
    return "postgresql://app_user:app_password@postgres:5432/app_db";
  })()
})

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:80",
  basePath: "/auth",
  
  // Critical: Ensure secret is set properly
  secret: process.env.BETTER_AUTH_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error("BETTER_AUTH_SECRET must be set in production");
    }
    console.warn("⚠️  Using development secret - DO NOT use in production!");
    return "development-secret-key-only-for-local-dev";
  })(),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.NODE_ENV === 'production',
    minPasswordLength: 8, // Increased from default
    maxPasswordLength: 128,
    // Add password strength validation
    password: {
      // Custom validation can be added here
    }
  },
  
  // Add rate limiting
  rateLimit: {
    enabled: true,
    window: 10, // 10 seconds
    max: 100,   // 100 requests per window
    customRules: {
      "/auth/sign-in/email": {
        window: 60,  // 1 minute
        max: 5       // 5 login attempts per minute
      },
      "/auth/sign-up/email": {
        window: 300, // 5 minutes
        max: 3       // 3 signup attempts per 5 minutes
      },
      "/auth/forgot-password": {
        window: 300, // 5 minutes
        max: 2       // 2 password reset attempts per 5 minutes
      }
    }
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7,    // 7 days
    updateAge: 60 * 60 * 24,         // 1 day
    freshAge: 60 * 10,               // 10 minutes for sensitive operations
    cookieName: "auth.session",
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // 5 minutes
    }
  },

  // Security settings
  security: {
    // Configure IP headers if behind proxy
    ipAddress: {
      ipAddressHeaders: ['x-forwarded-for', 'x-real-ip']
    }
  },

  // Trusted origins
  trustedOrigins: process.env.CORS_ORIGIN?.split(",") || [
    "http://localhost:5173",
    "http://localhost:80",
    "http://localhost:3000"
  ],

  // Account settings
  account: {
    accountLinking: {
      enabled: true,
      // Only link accounts from verified emails
      trustedProviders: []
    }
  },

  // Cookie configuration
  advanced: {
    cookiePrefix: "app_",
    useSecureCookies: process.env.NODE_ENV === 'production',
    crossSubdomainCookies: {
      enabled: false, // Enable if needed for subdomains
      domain: process.env.COOKIE_DOMAIN
    },
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
      path: "/"
    },
    // Disable CSRF check only if you have your own implementation
    disableCSRFCheck: false
  },

  // CORS handled by Express
  cors: {
    enabled: false
  }
})