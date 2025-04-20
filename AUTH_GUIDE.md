# Authentication Guide for Hello World Full Stack App

## Understanding Authentication Flow

This document explains how authentication works in the Hello World Full Stack application.

### Components Overview

The authentication system consists of three main parts:

1. **Frontend (React)**: Provides the user interface for sign-up and sign-in
2. **Auth Service (BetterAuth)**: Handles authentication logic and manages sessions
3. **Backend API (FastAPI)**: Protected endpoints that require authentication

### Direct URLs vs API Endpoints

An important distinction to understand:

- **Frontend URLs** (directly accessible in browser):
  - http://localhost:3001/auth/signUp
  - http://localhost:3001/auth/signIn

- **Auth Service API Endpoints** (not meant for direct browser access):
  - http://localhost:4000/api/auth/... (these endpoints handle requests from the frontend)

**Note**: If you try to directly access http://localhost:4000/api/auth/signUp in your browser, you'll see a 404 error. This is expected behavior! The auth service endpoints are meant to be used programmatically by the frontend, not accessed directly.

## How to Sign Up

### Method 1: Via the Homepage

1. Visit http://localhost:3001
2. Click on the "Create Account" button
3. Fill out the registration form

### Method 2: Via the Navigation

1. Visit any page in the app
2. Click on "Sign Up" in the top navigation
3. Fill out the registration form

### Method 3: Direct URL

1. Visit http://localhost:3001/auth/signUp
2. Fill out the registration form

## How to Sign In

1. Visit http://localhost:3001/auth/signIn
2. Enter your email and password
3. Click "Sign In"

## How Authentication Works Behind the Scenes

1. **Sign-Up Process**:
   - User enters information in the frontend form
   - Frontend sends data to the auth service API
   - Auth service creates user record in the database
   - Auth service issues a session token

2. **Authentication Flow**:
   - When a user signs in, a session token is stored as a cookie
   - The frontend includes this cookie in requests to protected backend routes
   - The backend validates the token with the auth service
   - If valid, the user is granted access to protected resources

3. **Protected Routes**:
   - Some routes (like /dashboard) require authentication
   - If a user tries to access them without being signed in, they are redirected to the sign-in page

## Troubleshooting

If you're having issues with authentication:

1. **Clear browser cookies and cache**:
   - This can resolve stale session issues

2. **Check if services are running**:
   - Ensure all containers are running with `docker ps`
   - Check logs with `docker-compose -f myapp/docker-compose.yml logs -f auth-service`

3. **API Access**:
   - Remember that API endpoints at http://localhost:4000/api/auth/... are not meant to be directly accessed in a browser

4. **Database Connectivity**:
   - Authentication depends on the Postgres database being accessible
   - Check database connection in logs if authentication is failing

## Development Notes

For developers working on the application:

- Auth service API routes are configured in `auth-service/src/server.ts`
- Frontend authentication client is in `frontend/src/lib/auth-client.ts`
- Protected route component is in `frontend/src/components/ProtectedRoute.tsx`