import { betterAuth } from "better-auth"
import { Pool } from "pg"

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    "postgresql://app_user:app_password@postgres:5432/app_db"
})

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:80",
  basePath: "/auth",
  secret: process.env.BETTER_AUTH_SECRET || "development-secret-key",
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // 1 day
    cookieName: "auth.session",
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // 5 minutes
    }
  },

  // Additional configuration
  account: {
    accountLinking: {
      enabled: true,
    }
  },

  // Advanced configuration for cookie handling
  advanced: {
    cookiePrefix: "",
    useSecureCookies: false, // Set to true in production with HTTPS
    crossSubdomainCookies: false
  },

  // CORS configuration will be handled by Express
  cors: {
    enabled: false
  }
})