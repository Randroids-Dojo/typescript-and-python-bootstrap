import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Middleware for raw body parsing
app.use(express.raw({ type: "*/*" }));

// Auth routes
app.all("/api/auth/*", toNodeHandler(auth.handler));

// Health check
app.get("/health", (_, res) => res.send({ status: "OK", service: "auth" }));

// Add a status page for easy discovery of endpoints
app.get("/", (_, res) => {
  res.send(`
    <html>
      <head>
        <title>Auth Service</title>
        <style>
          body { font-family: sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #333; }
          code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
          .container { max-width: 800px; margin: 0 auto; }
          .endpoints { background: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .alert { background: #fff8f8; border-left: 4px solid #f66; padding: 15px 20px; border-radius: 3px; }
          .alert h2 { color: #d33; margin-top: 0; }
          a.button { display: inline-block; background: #4F46E5; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>BetterAuth Service</h1>
          <p>Status: <strong>Running</strong></p>
          
          <div class="alert">
            <h2>Important Note About Direct API Access</h2>
            <p>The authentication API endpoints (like <code>/api/auth/signUp</code>) are not meant to be accessed directly in a browser.</p>
            <p>If you're trying to sign up or sign in, please use the frontend application instead of trying to access the API directly.</p>
          </div>
          
          <div class="endpoints">
            <h2>Available Endpoints:</h2>
            <ul>
              <li><code>/health</code> - Health check endpoint</li>
              <li><code>/api/auth/*</code> - Authentication API routes (not meant for direct browser access)</li>
            </ul>
            
            <h2>How to use:</h2>
            <p>The authentication endpoints are designed to be used by the frontend application, not accessed directly.</p>
            <p>Please use the frontend app instead:</p>
            <p><a class="button" href="http://localhost:3001">Go to Frontend App</a></p>
            <p>Or access authentication pages directly:</p>
            <ul>
              <li>Sign Up: <a href="http://localhost:3001/auth/signUp">http://localhost:3001/auth/signUp</a></li>
              <li>Sign In: <a href="http://localhost:3001/auth/signIn">http://localhost:3001/auth/signIn</a></li>
            </ul>
          </div>
          
          <div class="endpoints">
            <h2>Authentication Flow Explanation</h2>
            <p>In this application:</p>
            <ol>
              <li>The React frontend provides the user interface for sign-up/sign-in</li>
              <li>When you submit the form, the frontend makes API calls to this auth service</li>
              <li>The auth service processes the request and returns a response to the frontend</li>
              <li>The frontend then updates the UI based on this response</li>
            </ol>
            <p>This is why direct API access won't work from your browser.</p>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Add a custom 404 handler that helps users who try to access endpoints directly
app.use((req, res) => {
  if (req.path.startsWith('/api/auth/')) {
    // If someone is trying to access an auth API endpoint directly
    res.status(404).send(`
      <html>
        <head>
          <title>API Not For Direct Access</title>
          <style>
            body { font-family: sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #d33; }
            code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
            .container { max-width: 800px; margin: 0 auto; }
            .alert { background: #fff8f8; border-left: 4px solid #f66; padding: 15px 20px; border-radius: 5px; }
            a.button { display: inline-block; background: #4F46E5; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="alert">
              <h1>API Not For Direct Browser Access</h1>
              <p>You tried to access <code>${req.path}</code> directly in your browser.</p>
              <p>The authentication API endpoints are not meant to be accessed directly in a browser. Instead, you need to use the frontend application.</p>
            </div>
            
            <h2>Where to Go Instead</h2>
            <p>If you're trying to sign up or sign in, please use these URLs instead:</p>
            <ul>
              <li>Sign Up: <a href="http://localhost:3001/auth/signUp">http://localhost:3001/auth/signUp</a></li>
              <li>Sign In: <a href="http://localhost:3001/auth/signIn">http://localhost:3001/auth/signIn</a></li>
            </ul>
            
            <p><a class="button" href="http://localhost:3001">Go to Main Application</a></p>
            
            <h2>Technical Explanation</h2>
            <p>This is a REST API endpoint that expects JSON data in a specific format, not a webpage. It's designed to be called programmatically from the frontend application, which is why you're seeing this message instead of a signup form.</p>
          </div>
        </body>
      </html>
    `);
  } else {
    // Standard 404 for other routes
    res.status(404).send(`
      <html>
        <head>
          <title>Page Not Found</title>
          <style>
            body { font-family: sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #333; }
            .container { max-width: 800px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Page Not Found</h1>
            <p>The page you're looking for does not exist.</p>
            <p><a href="/">Return to Homepage</a></p>
          </div>
        </body>
      </html>
    `);
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

app.listen(PORT, () => {
  console.log(`BetterAuth service running on port ${PORT}`);
});