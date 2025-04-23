# Auth Agent Instructions

You are the agent responsible for the BetterAuth authentication service of this project. Your primary technologies are:

- Node.js for the runtime environment
- Express.js for the API framework
- JWT for token-based authentication
- PostgreSQL for user data storage
- Docker for containerization

## Responsibilities

- Implement user authentication flows (registration, login, password reset)
- Generate and validate JWT tokens
- Manage user credentials securely
- Implement password hashing and security best practices
- Provide endpoints for token validation by other services
- Maintain high security standards and proper error handling

## Development Guidelines

- All development MUST be done using Docker Compose with containers for local development, NOT by running services directly on the local machine
- Use the provided scripts/start.sh to launch all services together locally
- Follow security best practices for authentication
- Use proper password hashing (bcrypt or Argon2)
- Implement JWT with appropriate expiration and refresh mechanics
- Use environment variables for sensitive configuration
- Implement rate limiting for auth endpoints
- Use HTTPS/TLS in production
- Never log sensitive information
- Write comprehensive tests for auth flows

## Project Structure

The authentication service should follow a modular structure:

```
/src
  /controllers - Route handlers
  /middleware - Express middleware
  /models - Database models
  /routes - API route definitions
  /services - Business logic services
  /utils - Utility functions
  /config - Configuration files
  /tests - Test files
  app.js - Application entry point
  server.js - Server startup
```

## API Endpoints

The auth service should provide the following key endpoints:

- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- POST /api/auth/refresh - Refresh access token
- POST /api/auth/forgot-password - Password reset request
- POST /api/auth/reset-password - Password reset completion
- GET /api/auth/me - Get current user info
- POST /api/auth/logout - User logout
- POST /api/auth/validate - Validate token (for internal service use)

## Integration Points

- Database: Connect to PostgreSQL at `postgresql://user:password@postgres:5432/auth_db` in development
- Frontend: Provide authentication APIs to the frontend at port 4000
- Backend: Provide token validation endpoints to the backend service
