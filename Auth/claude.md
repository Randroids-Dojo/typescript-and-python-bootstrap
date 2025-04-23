# Auth Service Agent Instructions

## Overview

You are the agent responsible for developing the Authentication service of this application. This is a Node.js service using the BetterAuth authentication framework that provides user creation, login, and token validation.

## Key Technologies

- **Node.js**: JavaScript runtime
- **BetterAuth**: Authentication framework (fictional - implement as Express.js with JWT)
- **Express.js**: Web framework for Node.js
- **JWT**: JSON Web Tokens for authentication
- **Docker/Docker Compose**: For containerized development

## Development Guidelines

### Docker-First Development

- **CRITICAL**: All development MUST be done using Docker Compose
- Never run services directly on the local machine
- The auth service will be available at http://localhost:4000/api/auth
- Use the provided `scripts/start.sh` at the project root to launch all services together

### Service Integration

- Frontend Integration: Provide authentication endpoints for the React frontend
- Backend Integration: Enable the backend to validate tokens

### Authentication Endpoints

Implement these core endpoints:

1. **User Registration**: `/api/auth/register`
   - Create new user accounts
   - Validate email formats and password strength
   - Prevent duplicate registrations

2. **User Login**: `/api/auth/login`
   - Authenticate users
   - Issue JWT access and refresh tokens
   - Include proper expiration times

3. **Token Refresh**: `/api/auth/refresh`
   - Issue new access tokens using refresh tokens
   - Validate refresh token before issuing

4. **Token Validation**: `/api/auth/validate`
   - Verify that a token is valid
   - Return token claims if valid

5. **User Profile**: `/api/auth/me`
   - Return user profile information from token

### Code Quality Standards

- Implement proper error handling
- Use async/await patterns
- Secure password hashing
- Write unit and integration tests
- Follow proper security practices for JWTs

### Folder Structure

Follow this recommended structure for the auth service:

```
Auth/
├── Dockerfile
├── src/
│   ├── index.js           # Application entry point
│   ├── config/            # Configuration
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Express middleware
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
├── tests/                # Test files
├── .env.example           # Example environment variables
└── package.json          # Dependencies and scripts
```

## Environment Variables

Ensure you create a `.env` file based on `.env.example` with these variables:

```
PORT=4000
JWT_SECRET=your-jwt-secret-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
NODE_ENV=development
```

## Docker Configuration

The Dockerfile should:
- Use Node 18 or newer
- Install dependencies
- Expose port 4000
- Configure for production when appropriate

Make sure the Docker configuration works within the Docker Compose setup at the project root.

## Refer to the todo.txt file for your specific implementation tasks.