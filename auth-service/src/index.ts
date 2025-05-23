import express from "express"
import cors from "cors"
import dotenv from "dotenv"
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
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "auth-service" })
})

app.get("/auth/health", (req, res) => {
  res.json({ status: "ok", service: "auth-service" })
})

// Mount Better Auth handler BEFORE express.json()
const authHandler = toNodeHandler(auth)
app.use((req, res, next) => {
  if (req.path.startsWith("/auth/")) {
    return authHandler(req, res)
  }
  next()
})

// Other middleware after Better Auth
app.use(express.json())

// Custom endpoint for backend to validate Bearer tokens
app.get("/api/validate-token", async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" })
  }

  const token = authHeader.substring(7)
  
  try {
    // Use Better Auth's API to validate the session
    // The token might be URL encoded, so decode it
    const decodedToken = decodeURIComponent(token)
    const session = await auth.api.getSession({
      headers: {
        cookie: `better-auth.session_token=${decodedToken}`
      }
    })
    
    if (session) {
      res.json({ 
        valid: true,
        session: session.session,
        user: session.user
      })
    } else {
      res.status(401).json({ valid: false, error: "Invalid session" })
    }
  } catch (error) {
    console.error("Token validation error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Custom sign-in endpoint that returns the full session token for API usage
app.post("/api/sign-in", async (req, res) => {
  try {
    // Forward the request to Better Auth
    const response = await fetch(`http://localhost:${PORT}/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    })
    
    if (!response.ok) {
      return res.status(response.status).json(await response.json())
    }
    
    const data = await response.json()
    const setCookie = response.headers.get('set-cookie')
    
    // Extract the session token from the cookie
    let sessionToken = null
    if (setCookie) {
      const match = setCookie.match(/better-auth\.session_token=([^;]+)/)
      if (match) {
        sessionToken = match[1]
      }
    }
    
    // Return the response with the full session token
    res.json({
      ...data,
      sessionToken // This is the full cookie value that can be used as a Bearer token
    })
  } catch (error) {
    console.error('Sign-in error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`)
})