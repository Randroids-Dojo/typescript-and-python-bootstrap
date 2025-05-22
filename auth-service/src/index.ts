import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { auth } from "./auth"

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(express.json())
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || [
    "http://localhost:5173",
    "http://localhost:80",
    "http://localhost:3000"
  ],
  credentials: true
}))

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "auth-service" })
})

// Token verification endpoint for FastAPI backend
app.get("/auth/verify-token", async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Invalid authorization header" })
  }

  const token = authHeader.substring(7)
  
  try {
    // For now, just validate that we have a token
    // In production, you'd validate with Better Auth's session
    if (token) {
      res.json({ 
        valid: true, 
        session: { 
          user: { 
            id: "temp-user-id",
            email: "user@example.com" 
          } 
        } 
      })
    } else {
      res.status(401).json({ valid: false })
    }
  } catch (error) {
    console.error("Token verification error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Better Auth routes
app.get("/auth/signup", async (req, res) => {
  res.json({ message: "Signup endpoint - to be implemented" })
})

app.post("/auth/signup", async (req, res) => {
  // Mock signup for now
  const { email, password } = req.body
  if (email && password) {
    res.json({ 
      user: { id: "new-user-id", email },
      token: "mock-token"
    })
  } else {
    res.status(400).json({ error: "Email and password required" })
  }
})

app.post("/auth/signin", async (req, res) => {
  // Mock signin for now
  const { email, password } = req.body
  if (email && password) {
    res.json({ 
      user: { id: "user-id", email },
      token: "mock-token"
    })
  } else {
    res.status(400).json({ error: "Email and password required" })
  }
})

app.get("/auth/session", async (req, res) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith("Bearer ")) {
    res.json({ 
      user: { id: "user-id", email: "user@example.com" }
    })
  } else {
    res.status(401).json({ error: "Not authenticated" })
  }
})

app.post("/auth/signout", async (req, res) => {
  res.json({ success: true })
})

// Start server
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`)
})