# TypeScript and Python Bootstrap Project

This is a modern web application template with a React TypeScript frontend, FastAPI Python backend, and BetterAuth authentication service.

## Features

- React TypeScript frontend with Vite
- FastAPI Python backend
- BetterAuth authentication service
- Docker Compose for local development
- Ready for deployment to Azure
- PostgreSQL database and Redis cache

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development outside Docker)
- Python 3.11+ (for local development outside Docker)
- npm/yarn
- Azure CLI (for deployment)

## Getting Started

1. Clone this repository
2. Configure environment variables in `.env` file (copy from `.env.example`)
3. Start the application:

```bash
./start.sh
```

This will start all services in Docker containers:

- Frontend: http://localhost:3001
- Backend API: http://localhost:8001
- Auth Service: http://localhost:4000/api/auth

## Development Workflow

### Frontend (React TypeScript)

The frontend is built with React, TypeScript, and Vite. It's integrated with BetterAuth for authentication.

### Backend (FastAPI)

The backend is built with FastAPI and provides API endpoints for the frontend. It communicates with the database and the auth service.

### Auth Service (BetterAuth)

The auth service handles user authentication and session management.

## Stopping the Application

```bash
./stop.sh
```

## Deployment

This application is ready for deployment to Azure. The GitHub Actions workflow in `.github/workflows/deploy.yml` handles the CI/CD process.

See the `BootstrapPlan.md` file for detailed instructions on Azure setup.
