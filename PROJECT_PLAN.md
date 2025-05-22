# Full-Stack Monolithic Web App Architecture Plan

## Overview

This project creates a minimal full-stack web application using:
- React TypeScript frontend with Vite
- FastAPI Python backend
- Better Auth authentication service
- Docker Compose for local development
- PostgreSQL database and Redis cache
- Shadcn UI components
- Ready for Azure deployment

## Architecture

Since Better Auth is a TypeScript/Node.js solution and we want a Python FastAPI backend, we'll use a hybrid monolithic architecture:

1. **Frontend**: React TypeScript with Vite (serves the UI)
2. **Auth Service**: Node.js service running Better Auth (handles authentication)
3. **API Backend**: FastAPI Python service (handles business logic)
4. **Database**: PostgreSQL (shared between services)
5. **Cache**: Redis (for session storage and caching)
6. **Reverse Proxy**: Nginx (routes requests to appropriate services)

## Project Structure

```
app-bootstrap/
├── frontend/                    # React TypeScript Vite app
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── lib/               # Utilities and auth client
│   │   ├── pages/            # Page components
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── auth-service/               # Node.js Better Auth service
│   ├── src/
│   │   ├── auth.ts           # Better Auth configuration
│   │   └── index.ts          # Express server
│   ├── package.json
│   └── tsconfig.json
├── backend/                    # FastAPI Python service
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── models/
│   │   ├── routers/
│   │   └── database.py
│   ├── requirements.txt
│   └── Dockerfile
├── nginx/                      # Nginx configuration
│   └── nginx.conf
├── docker-compose.yml          # Local development setup
├── docker-compose.prod.yml     # Production setup
└── .env.example
```

## Core Features

### Minimal Features Implementation
- User signup and login
- Persist basic user profile data
- Global counter that any logged-in user can increment

## Docker Compose Configuration

### Development Setup (docker-compose.yml)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: app_db
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: app_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  auth-service:
    build: ./auth-service
    environment:
      DATABASE_URL: postgresql://app_user:app_password@postgres:5432/app_db
      BETTER_AUTH_SECRET: your-secret-key
      BETTER_AUTH_URL: http://localhost:3000
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    ports:
      - "3001:3001"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://app_user:app_password@postgres:5432/app_db
      REDIS_URL: redis://redis:6379
      AUTH_SERVICE_URL: http://auth-service:3001
    depends_on:
      - postgres
      - redis
      - auth-service
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    environment:
      VITE_API_URL: http://localhost:80/api
      VITE_AUTH_URL: http://localhost:80/auth
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - backend
      - auth-service

volumes:
  postgres_data:
```

## Authentication Flow

1. **Frontend** → Makes auth requests to `/auth/*` endpoints
2. **Nginx** → Routes `/auth/*` to the auth-service
3. **Better Auth** → Handles signup/login, creates sessions in Redis
4. **Frontend** → Receives auth tokens/cookies
5. **Frontend** → Includes auth tokens when calling `/api/*` endpoints
6. **FastAPI** → Validates tokens by checking with auth-service
7. **Auth Service** → Provides token validation endpoint for FastAPI

## Database Schema

```sql
-- Better Auth will create its own tables for users, sessions, etc.

-- Additional app-specific tables:
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) UNIQUE NOT NULL, -- References Better Auth user
    display_name VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE global_counter (
    id INTEGER PRIMARY KEY DEFAULT 1,
    count INTEGER DEFAULT 0,
    last_updated_by VARCHAR(255),
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT single_row CHECK (id = 1)
);
```

## API Endpoints

### FastAPI Backend Endpoints

```
GET  /api/health          # Health check
GET  /api/user/profile    # Get current user profile
PUT  /api/user/profile    # Update user profile
GET  /api/counter         # Get global counter value
POST /api/counter/increment # Increment counter (requires auth)
```

### Better Auth Endpoints (handled by auth-service)

```
POST /auth/signup         # User registration
POST /auth/signin         # User login
POST /auth/signout        # User logout
GET  /auth/session        # Get current session
POST /auth/verify-token   # Verify token (for backend)
```

## Frontend Component Structure

```
frontend/src/
├── components/
│   ├── ui/                   # Shadcn components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   └── input.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   └── features/
│       ├── UserProfile.tsx
│       └── GlobalCounter.tsx
├── pages/
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Signup.tsx
│   └── Dashboard.tsx
├── lib/
│   ├── auth-client.ts        # Better Auth client
│   ├── api.ts               # API client for FastAPI
│   └── utils.ts
└── App.tsx
```

## Nginx Configuration

```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:5173;
    }

    upstream auth_service {
        server auth-service:3001;
    }

    upstream backend {
        server backend:8000;
    }

    server {
        listen 80;

        # Frontend (development with HMR)
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }

        # Auth service routes
        location /auth {
            proxy_pass http://auth_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # API routes
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

## Azure Deployment Strategy

### Resources Required
- Azure Container Instances or Azure App Service
- Azure Database for PostgreSQL
- Azure Cache for Redis
- Azure Container Registry

### Production Configuration (docker-compose.prod.yml)

```yaml
version: '3.8'

services:
  auth-service:
    image: ${REGISTRY}/auth-service:${TAG}
    environment:
      DATABASE_URL: ${AZURE_POSTGRES_URL}
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      BETTER_AUTH_URL: ${APP_URL}
      REDIS_URL: ${AZURE_REDIS_URL}

  backend:
    image: ${REGISTRY}/backend:${TAG}
    environment:
      DATABASE_URL: ${AZURE_POSTGRES_URL}
      REDIS_URL: ${AZURE_REDIS_URL}
      AUTH_SERVICE_URL: http://auth-service:3001

  frontend:
    image: ${REGISTRY}/frontend:${TAG}
    environment:
      VITE_API_URL: ${APP_URL}/api
      VITE_AUTH_URL: ${APP_URL}/auth

  nginx:
    image: ${REGISTRY}/nginx:${TAG}
    ports:
      - "80:80"
```

## Implementation Steps

1. **Set up project structure** - Create all directories and base files
2. **Configure Better Auth** - Set up auth-service with Express and Better Auth
3. **Create FastAPI backend** - Implement API endpoints with auth validation
4. **Build React frontend** - Create components with Shadcn UI
5. **Configure Docker** - Set up all Dockerfiles and docker-compose
6. **Test locally** - Ensure all services work together
7. **Prepare for Azure** - Create production configs and CI/CD pipeline

## Key Implementation Details

### Auth Service Configuration

```typescript
// auth-service/src/auth.ts
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL
  }),
  emailAndPassword: {
    enabled: true
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24      // 1 day
  }
});
```

### FastAPI Auth Middleware

```python
# backend/app/auth.py
import httpx
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{AUTH_SERVICE_URL}/auth/verify-token",
            headers={"Authorization": f"Bearer {token}"}
        )
    
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    
    return response.json()
```

### Frontend Auth Client

```typescript
// frontend/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_URL
});

export const { useSession, signIn, signUp, signOut } = authClient;
```

## Environment Variables

### .env.example

```env
# Database
POSTGRES_DB=app_db
POSTGRES_USER=app_user
POSTGRES_PASSWORD=app_password
DATABASE_URL=postgresql://app_user:app_password@postgres:5432/app_db

# Redis
REDIS_URL=redis://redis:6379

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Services
AUTH_SERVICE_URL=http://auth-service:3001
VITE_API_URL=http://localhost:80/api
VITE_AUTH_URL=http://localhost:80/auth

# Azure (Production)
AZURE_POSTGRES_URL=
AZURE_REDIS_URL=
REGISTRY=
TAG=latest
APP_URL=
```

## Summary

This architecture provides:

1. **Clean separation of concerns** - Auth, API, and Frontend are separate but work together
2. **Scalability** - Each service can be scaled independently
3. **Security** - Better Auth handles authentication properly with sessions in Redis
4. **Developer experience** - Hot reloading for all services in development
5. **Production ready** - Docker images ready for Azure deployment

The monolithic nature comes from:
- All services deployed together
- Shared database
- Single entry point through Nginx
- Coordinated deployment

This bootstrap provides minimal features while establishing patterns for:
- Authentication flow
- API structure
- State management
- Database interactions
- Caching strategy
- UI component library