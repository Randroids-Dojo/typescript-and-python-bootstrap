import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import rateLimit from "express-rate-limit"
import { toNodeHandler } from "better-auth/node"
import { auth } from "./auth"

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// CORS middleware first
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || [
    "http://localhost:5173",
    "http://localhost:80",
    "http://localhost:3000"
  ],
  credentials: true
}))

// Health check endpoints
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "auth-service" })
})

app.get("/auth/health", (_req, res) => {
  res.json({ status: "ok", service: "auth-service" })
})

// Rate limiting for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs
  message: 'Too many authentication requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip health check endpoints
  skip: (req) => req.path === '/auth/health'
})

// Mount Better Auth handler BEFORE express.json()
const authHandler = toNodeHandler(auth)
app.use('/auth', authRateLimit)
app.use((req, res, next) => {
  if (req.path.startsWith("/auth/")) {
    authHandler(req, res)
    return
  }
  next()
})

// Other middleware after Better Auth
app.use(express.json())

// Rate limiting for token validation endpoint
const tokenValidationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Higher limit for token validation (backend service calls)
  message: 'Too many token validation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// Custom endpoint for backend to validate Bearer tokens
app.get("/api/validate-token", tokenValidationRateLimit, async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" })
    return
  }

  const token = authHeader.substring(7)
  
  try {
    // Use Better Auth's API to validate the session
    // The token is the session cookie value - Better Auth uses 'better-auth.session_token'
    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: `better-auth.session_token=${encodeURIComponent(token)}`
      })
    })
    
    if (session) {
      res.json({ 
        valid: true,
        session: {
          id: session.session.id,
          userId: session.session.userId,
          expiresAt: session.session.expiresAt
        },
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          emailVerified: session.user.emailVerified
        }
      })
    } else {
      res.status(401).json({ valid: false, error: "Invalid session" })
    }
  } catch (error) {
    console.error("Token validation error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})


// Start server
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`)
})