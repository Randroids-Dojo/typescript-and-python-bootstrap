# TypeScript and Python Bootstrap Project

A full stack "Hello, World" application with frontend, backend, and authentication components.

## Project Overview

This project provides a complete starter template for a full stack web application using:

- **Frontend**: React with TypeScript (using Vite)
- **Backend**: FastAPI (Python)
- **Authentication**: BetterAuth service 
- **Local Development**: Docker & Docker Compose
- **Deployment**: Azure (Container Registry, PostgreSQL, App Service)
- **CI/CD**: GitHub Actions workflow

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git

### Quick Start

1. Clone this repository
2. Run the start script:

```bash
./start.sh
```

3. Access the application:
   - Main App: http://localhost:3001
   - Sign Up: http://localhost:3001/auth/signUp
   - Sign In: http://localhost:3001/auth/signIn
   - Backend API: http://localhost:8001
   - Auth Service: http://localhost:4000

4. To stop the application:

```bash
./stop.sh
```

### Manual Setup

If you prefer to run commands manually:

1. Start the application with Docker Compose:

```bash
docker-compose -f myapp/docker-compose.yml up -d
```

2. View logs:

```bash
docker-compose -f myapp/docker-compose.yml logs -f
```

3. Stop the application:

```bash
docker-compose -f myapp/docker-compose.yml down
```

## Project Structure

```
myapp/
├── backend/              # FastAPI
│   ├── app/
│   │   └── main.py
│   ├── alembic/          # migrations
│   ├── requirements.txt
│   └── Dockerfile
├── auth-service/         # BetterAuth
│   ├── src/
│   │   ├── auth.ts
│   │   └── server.ts
│   ├── package.json
│   └── Dockerfile
├── frontend/             # React (TS) with Vite
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml    # Local dev
├── docker-compose.prod.yml # Production
├── .env.example          # Template
└── .github/
    └── workflows/deploy.yml
```

## Features

- **Authentication**: User registration and login
- **Protected Routes**: Authenticated access to protected pages
- **API Integration**: Backend API connection
- **Docker Setup**: Containerized development environment
- **Error Handling**: Robust error handling and logging

## Authentication Guide

This application includes a complete authentication system. Here's how to use it:

### Signing Up

To create a new account, use one of these methods:

1. Visit the home page (http://localhost:3001) and click "Create Account"
2. Go directly to the sign-up page: http://localhost:3001/auth/signUp
3. Click "Sign Up" in the navigation bar

**Important Note**: Do NOT try to access the auth service API endpoints directly (like http://localhost:4000/api/auth/signUp). These endpoints are meant to be used by the frontend application, not accessed directly in a browser.

### Signing In

To sign in with an existing account:

1. Go to http://localhost:3001/auth/signIn
2. Enter your email and password
3. After signing in, you'll be able to access protected routes like the Dashboard

### How It Works

The authentication flow works as follows:

1. The React frontend provides the UI for authentication
2. When you submit the form, the frontend makes API calls to the auth service
3. The auth service processes the request and issues a session token
4. The token is stored as a cookie and used for subsequent requests

For more detailed information, see the [AUTH_GUIDE.md](AUTH_GUIDE.md) file.

## Deployment

The application includes a GitHub Actions workflow for continuous deployment to Azure.

## Troubleshooting

If you encounter any issues:

1. Check container logs:
   ```
   docker-compose -f myapp/docker-compose.yml logs
   ```

2. Verify all services are running:
   ```
   docker ps
   ```

3. Rebuild containers if needed:
   ```
   docker-compose -f myapp/docker-compose.yml up -d --build
   ```

4. Check the `/errors` page in the frontend application for detailed error logs

## License

This project is available under the MIT License.