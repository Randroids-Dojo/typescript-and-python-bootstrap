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

## Running Tests and Linting

Before committing any changes, always run tests and linting:

```bash
# Run tests
npm test

# Run linting
npm run lint
```

## API Documentation

### BetterAuth API

BetterAuth provides the following endpoints:

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/auth/register` | POST | Create a new user account | `{ email, password }` | `{ success, user, tokens }` |
| `/api/auth/login` | POST | Authenticate user | `{ email, password }` | `{ success, user, tokens }` |
| `/api/auth/refresh` | POST | Refresh access token | `{ refreshToken }` | `{ success, tokens }` |
| `/api/auth/logout` | POST | Logout user | `{ refreshToken }` | `{ success }` |
| `/api/auth/me` | GET | Get user profile | none | `{ success, user }` |
| `/api/auth/validate` | POST | Validate token | `{ token }` | `{ success, isValid, claims }` |

### Frontend Integration

To integrate with the frontend, use the auth-client.ts:

```typescript
// Example usage in React component
import { authClient } from '@auth/client';

// Login
const handleLogin = async (email, password) => {
  const result = await authClient.login(email, password);
  if (result.success) {
    // Store tokens and redirect
    localStorage.setItem('accessToken', result.tokens.accessToken);
    sessionStorage.setItem('user', JSON.stringify(result.user));
    // Use httpOnly cookies for refreshToken (handled by the API)
  }
};

// Get user profile
const getUserProfile = async () => {
  const result = await authClient.getUser();
  if (result.success) {
    setUserProfile(result.user);
  }
};

// Logout
const handleLogout = async () => {
  await authClient.logout();
  localStorage.removeItem('accessToken');
  sessionStorage.removeItem('user');
};
```

### Backend Integration

For backend services to validate tokens:

```python
# Example Python FastAPI integration
from app.auth.client import validate_token

async def get_current_user(token: str = Depends(oauth2_scheme)):
    validation = await validate_token(token)
    if not validation["success"] or not validation["isValid"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return validation["claims"]
```