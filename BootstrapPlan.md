# Code Agent Guide: Full Stack "Hello, World" Bootstrap Environment

## Overview

This guide will help you create a simple but complete full stack application with frontend, backend, and authentication components. The application will run locally with Docker Compose and can be deployed to Azure with minimal configuration changes.

## Project Requirements

- **Frontend**: React with TypeScript (using Vite)
- **Backend**: FastAPI (Python)
- **Authentication**: BetterAuth service 
- **Local Development**: Docker & Docker Compose
- **Deployment**: Azure (Container Registry, PostgreSQL, App Service)
- **CI/CD**: GitHub Actions workflow

## 1. Set Up Project Structure

Create a monorepo with the following folder structure:

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
├── .env.example          # Template
└── .github/
    └── workflows/deploy.yml
```

## 2. Local Development Environment

### Create Docker Compose File

Create a `docker-compose.yml` file at the project root with the following content:

```yaml
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: devuser
      POSTGRES_PASSWORD: devpass
      POSTGRES_DB: myapp_dev
    volumes: 
      - db-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  auth-service:
    build: ./auth-service
    env_file: .env
    ports: 
      - "4000:4000"
    depends_on: 
      - db

  backend:
    build: ./backend
    env_file: .env
    ports: 
      - "8001:8000"  # host:container
    depends_on: 
      - db
      - redis
      - auth-service
    volumes:
      - ./backend:/app  # For development hot reload

  frontend:
    build: 
      context: ./frontend
      target: development
    env_file: .env
    ports: 
      - "3001:5173"  # host:container (Vite uses 5173 by default)
    depends_on: 
      - auth-service
      - backend
    volumes:
      - ./frontend:/app  # For development hot reload
      - /app/node_modules

volumes:
  db-data:
```

### Create Environment Variables Template

Create a `.env.example` file at the project root:

```
# Database
DATABASE_URL=postgresql://devuser:devpass@db:5432/myapp_dev

# Redis
REDIS_URL=redis://redis:6379

# Authentication
BETTER_AUTH_SECRET=development_secret_key_replace_in_production
BETTER_AUTH_URL=http://auth-service:4000
BETTER_AUTH_GITHUB_CLIENT_ID=your_github_client_id
BETTER_AUTH_GITHUB_CLIENT_SECRET=your_github_client_secret

# URLs
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:8001
AUTH_URL=http://localhost:4000

# Vite Environment Variables (must be prefixed with VITE_)
VITE_API_URL=http://localhost:8001
VITE_AUTH_URL=http://localhost:4000/api/auth
```

Copy this file to `.env` and adjust values as needed. Never commit the `.env` file to source control.

## 3. Backend (FastAPI) Implementation

### Set Up FastAPI Backend

1. Create `backend/requirements.txt`:

```
fastapi==0.103.1
uvicorn==0.23.2
gunicorn==21.2.0
psycopg2-binary==2.9.7
sqlalchemy==2.0.21
alembic==1.12.0
python-dotenv==1.0.0
redis==5.0.0
fastapi-cache2==0.2.1
python-jose==3.3.0
passlib==1.7.4
bcrypt==4.0.1
python-multipart==0.0.6
```

2. Create `backend/app/main.py`:

```python
from fastapi import FastAPI, HTTPException, Depends, Cookie
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import os
import datetime
from fastapi.responses import JSONResponse

app = FastAPI(title="Hello World API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3001")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    """Health check endpoint for the application"""
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        conn.close()
    except Exception as e:
        raise HTTPException(500, f"Database unreachable: {str(e)}")
    return {"status": "OK", "service": "backend"}

# Simple authentication dependency
def get_current_user(
    session_token: str = Cookie(None, alias="better-auth.session_token")
):
    if not session_token:
        raise HTTPException(401, "Not authenticated")

    # Validate session
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        cur.execute(
            "SELECT user_id, expires_at FROM sessions WHERE id=%s",
            (session_token,)
        )
        rec = cur.fetchone()
        cur.close()
        conn.close()
    except Exception as e:
        raise HTTPException(500, f"Database error: {str(e)}")

    if not rec or rec[1] < datetime.datetime.utcnow():
        raise HTTPException(401, "Invalid or expired session")

    user_id = rec[0]
    
    # Fetch user
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        cur.execute(
            "SELECT id, email FROM users WHERE id=%s", (user_id,)
        )
        u = cur.fetchone()
        cur.close()
        conn.close()
    except Exception as e:
        raise HTTPException(500, f"Database error: {str(e)}")

    if not u:
        raise HTTPException(401, "User not found")

    return {"id": u[0], "email": u[1]}

@app.get("/")
def root():
    """Hello World endpoint"""
    return {"message": "Hello, World!"}

@app.get("/api/user")
def get_user(user=Depends(get_current_user)):
    """Protected route that returns the current user's details"""
    return {"id": user["id"], "email": user["email"]}

@app.get("/api/hello")
def hello(user=Depends(get_current_user)):
    """Protected Hello World endpoint that requires authentication"""
    return {"message": f"Hello, {user['email']}!"}
```

3. Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose application port
EXPOSE 8000

# Run the application with Gunicorn
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8000"]
```

4. Create a simple Alembic migration setup (optional for Hello World but good practice):

```bash
mkdir -p backend/alembic/versions
touch backend/alembic/env.py
touch backend/alembic.ini
```

## 4. Auth Service Implementation

### Set Up BetterAuth Service

1. Create `auth-service/package.json`:

```json
{
  "name": "auth-service",
  "version": "1.0.0",
  "description": "Authentication service for the Hello World app",
  "main": "dist/server.js",
  "scripts": {
    "start": "node dist/server.js",
    "dev": "ts-node-dev src/server.ts",
    "build": "tsc",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "better-auth": "^1.0.0",
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/pg": "^8.10.2",
    "ts-node": "^10.9.1",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.2.2"
  }
}
```

2. Create `auth-service/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
```

3. Create `auth-service/src/auth.ts`:

```typescript
import { betterAuth } from "better-auth";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: {
      clientId: process.env.BETTER_AUTH_GITHUB_CLIENT_ID!,
      clientSecret: process.env.BETTER_AUTH_GITHUB_CLIENT_SECRET!,
    },
  },
  trustedOrigins: [process.env.FRONTEND_URL!],
});
```

4. Create `auth-service/src/server.ts`:

```typescript
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

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

app.listen(PORT, () => {
  console.log(`BetterAuth service running on port ${PORT}`);
});
```

5. Create `auth-service/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Expose application port
EXPOSE 4000

# Run the application
CMD ["node", "dist/server.js"]
```

## 5. Frontend (React + TypeScript with Vite) Implementation

### Set Up React Frontend with Vite

1. Initialize a new Vite project with React and TypeScript template:

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
```

2. Add necessary dependencies:

```bash
npm install better-auth @daveyplate/better-auth-ui react-router-dom axios
```

3. Create `frontend/src/lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_URL || "http://localhost:4000/api/auth",
});
```

4. Create `frontend/src/lib/api.ts`:

```typescript
import axios from "axios";

// Configure axios
axios.defaults.withCredentials = true;  // include auth cookies in requests

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

export const api = {
  getHello: async () => {
    const response = await axios.get(`${API_URL}/api/hello`);
    return response.data;
  },
  
  getUser: async () => {
    const response = await axios.get(`${API_URL}/api/user`);
    return response.data;
  }
};
```

5. Create `frontend/src/components/ProtectedRoute.tsx`:

```typescript
import React from "react";
import { useSession } from "better-auth/client";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: session, isLoading } = useSession();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (session === null) {
    return <Navigate to="/auth/signIn" replace />;
  }
  
  return <>{children}</>;
}
```

6. Create `frontend/src/pages/AuthPage.tsx`:

```typescript
import React from "react";
import { useParams } from "react-router-dom";
import { AuthCard } from "@daveyplate/better-auth-ui";

export default function AuthPage() {
  const { page } = useParams<{ page: string }>();
  return (
    <div className="auth-container">
      <AuthCard pathname={page || "signIn"} />
    </div>
  );
}
```

7. Create `frontend/src/pages/HomePage.tsx`:

```typescript
import React, { useEffect, useState } from "react";
import { useSession } from "better-auth/client";
import { api } from "../lib/api";

export default function HomePage() {
  const { data: session } = useSession();
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  
  useEffect(() => {
    if (session) {
      api.getHello()
        .then(data => setMessage(data.message))
        .catch(err => setError(err.message || "Failed to fetch hello message"));
    }
  }, [session]);
  
  if (!session) {
    return (
      <div className="home-page">
        <h1>Hello, World!</h1>
        <p>Please sign in to see your personalized message.</p>
      </div>
    );
  }
  
  return (
    <div className="home-page">
      <h1>Hello, World!</h1>
      {message && <p className="message">{message}</p>}
      {error && <p className="error">{error}</p>}
      <p>You are signed in as: {session.user.email}</p>
    </div>
  );
}
```

8. Update `frontend/src/App.tsx`:

```typescript
import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { authClient } from "./lib/auth-client";
import { BrowserRouter, useNavigate, NavLink } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import "./App.css";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth/:page" element={<AuthPage />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <div>Protected Dashboard</div>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <header>
            <nav>
              <NavLink to="/">Home</NavLink>
              <NavLink to="/dashboard">Dashboard</NavLink>
            </nav>
          </header>
          <main>
            <AppRoutes />
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  
  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={navigate}
      Link={NavLink}
    >
      {children}
    </AuthUIProvider>
  );
}

export default App;
```

9. Update `frontend/src/main.tsx`:

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

10. Create `frontend/.env.development`:

```
VITE_API_URL=http://localhost:8001
VITE_AUTH_URL=http://localhost:4000/api/auth
```

11. Update `frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true
    }
  }
})
```

12. Create multi-stage `frontend/Dockerfile`:

```dockerfile
# Development stage
FROM node:18-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev"]

# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Configure nginx for SPA routing
RUN printf 'server {\n  listen 80;\n  location / {\n    root /usr/share/nginx/html;\n    try_files $uri $uri/ /index.html;\n  }\n}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

## 6. CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Build & Deploy

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login to Azure Container Registry
        uses: azure/docker-login@v1
        with:
          login-server: ${{ secrets.ACR_LOGIN_SERVER }}
          username: ${{ secrets.ACR_USER }}
          password: ${{ secrets.ACR_PASS }}

      # Build & push auth-service image
      - name: Build and push auth-service
        uses: docker/build-push-action@v4
        with:
          context: ./auth-service
          push: true
          tags: ${{ secrets.ACR_LOGIN_SERVER }}/auth-service:${{ github.sha }}

      # Build & push backend image
      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: ${{ secrets.ACR_LOGIN_SERVER }}/backend:${{ github.sha }}

      # Build & push frontend image
      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          target: production
          push: true
          tags: ${{ secrets.ACR_LOGIN_SERVER }}/frontend:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      # Create production docker-compose.yml with the correct image tags
      - name: Create production docker-compose.yml
        run: |
          cat > docker-compose.prod.yml << EOF
          version: '3.8'
          services:
            auth-service:
              image: ${{ secrets.ACR_LOGIN_SERVER }}/auth-service:${{ github.sha }}
              restart: always
            
            backend:
              image: ${{ secrets.ACR_LOGIN_SERVER }}/backend:${{ github.sha }}
              restart: always
            
            frontend:
              image: ${{ secrets.ACR_LOGIN_SERVER }}/frontend:${{ github.sha }}
              restart: always
          EOF

      # Deploy to Azure App Service
      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: ${{ secrets.WEBAPP_NAME }}
          slot-name: Production
          images: |
            ${{ secrets.ACR_LOGIN_SERVER }}/auth-service:${{ github.sha }}
            ${{ secrets.ACR_LOGIN_SERVER }}/backend:${{ github.sha }}
            ${{ secrets.ACR_LOGIN_SERVER }}/frontend:${{ github.sha }}
```

## 7. Azure Deployment Setup

### Prerequisites for Azure

1. Create an Azure Resource Group
2. Create an Azure Container Registry (ACR)
3. Create an Azure Database for PostgreSQL (Flexible Server)
4. Create an Azure Key Vault
5. Create an Azure App Service Plan (Linux)

### Azure Resources Configuration

#### 1. Create Azure Resources with Azure CLI

```bash
# Set variables
RESOURCE_GROUP="myapp-rg"
LOCATION="eastus"
ACR_NAME="myappregistry"
POSTGRES_SERVER_NAME="myapp-pg"
KEYVAULT_NAME="myapp-kv"
APP_SERVICE_PLAN="myapp-plan"
WEBAPP_NAME="myapp-hello-world"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create container registry
az acr create --name $ACR_NAME --resource-group $RESOURCE_GROUP --sku Basic --admin-enabled true

# Create PostgreSQL server
az postgres flexible-server create \
  --name $POSTGRES_SERVER_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user myapp_admin \
  --admin-password "SecurePassword123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15

# Create a database
az postgres flexible-server db create \
  --server-name $POSTGRES_SERVER_NAME \
  --resource-group $RESOURCE_GROUP \
  --database-name myapp_prod

# Create Key Vault
az keyvault create --name $KEYVAULT_NAME --resource-group $RESOURCE_GROUP --location $LOCATION

# Create App Service Plan (Linux)
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

# Create Web App for Containers
az webapp create \
  --name $WEBAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --multicontainer-config-type compose \
  --multicontainer-config-file docker-compose.prod.yml
```

#### 2. Set Key Vault Secrets

```bash
# Generate a secure secret for BetterAuth
BETTER_AUTH_SECRET=$(openssl rand -base64 32)

# Set secrets in Key Vault
az keyvault secret set --vault-name $KEYVAULT_NAME --name DATABASE-URL \
  --value "postgresql://myapp_admin:SecurePassword123!@$POSTGRES_SERVER_NAME.postgres.database.azure.com:5432/myapp_prod"

az keyvault secret set --vault-name $KEYVAULT_NAME --name BETTER-AUTH-SECRET \
  --value "$BETTER_AUTH_SECRET"

az keyvault secret set --vault-name $KEYVAULT_NAME --name BETTER-AUTH-URL \
  --value "https://$WEBAPP_NAME.azurewebsites.net/api/auth"

az keyvault secret set --vault-name $KEYVAULT_NAME --name BETTER-AUTH-GITHUB-CLIENT-ID \
  --value "your_github_client_id"

az keyvault secret set --vault-name $KEYVAULT_NAME --name BETTER-AUTH-GITHUB-CLIENT-SECRET \
  --value "your_github_client_secret"
```

#### 3. Configure Web App Settings

```bash
# Enable system-assigned managed identity
az webapp identity assign --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP

# Get the managed identity principal ID
PRINCIPAL_ID=$(az webapp identity show --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --query principalId --output tsv)

# Grant Key Vault access policy to the managed identity
az keyvault set-policy --name $KEYVAULT_NAME --resource-group $RESOURCE_GROUP \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list

# Set App Service configuration settings
az webapp config appsettings set --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP \
  --settings \
  DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://$KEYVAULT_NAME.vault.azure.net/secrets/DATABASE-URL)" \
  FRONTEND_URL="https://$WEBAPP_NAME.azurewebsites.net" \
  VITE_API_URL="https://$WEBAPP_NAME.azurewebsites.net" \
  VITE_AUTH_URL="https://$WEBAPP_NAME.azurewebsites.net/api/auth" \
  BETTER_AUTH_SECRET="@Microsoft.KeyVault(SecretUri=https://$KEYVAULT_NAME.vault.azure.net/secrets/BETTER-AUTH-SECRET)" \
  BETTER_AUTH_URL="@Microsoft.KeyVault(SecretUri=https://$KEYVAULT_NAME.vault.azure.net/secrets/BETTER-AUTH-URL)" \
  BETTER_AUTH_GITHUB_CLIENT_ID="@Microsoft.KeyVault(SecretUri=https://$KEYVAULT_NAME.vault.azure.net/secrets/BETTER-AUTH-GITHUB-CLIENT-ID)" \
  BETTER_AUTH_GITHUB_CLIENT_SECRET="@Microsoft.KeyVault(SecretUri=https://$KEYVAULT_NAME.vault.azure.net/secrets/BETTER-AUTH-GITHUB-CLIENT-SECRET)"

# Configure health check
az webapp config set --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP \
  --generic-configurations '{"healthCheckPath": "/health"}'
```

## 8. Running and Testing

### Local Development

1. Create a `.env` file by copying from `.env.example` and fill in the secrets
2. Start the application with Docker Compose:

```bash
docker-compose up --build
```

3. Access the application:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:8001
   - Auth Service: http://localhost:4000

### Deployment to Azure

1. Add the required GitHub Secrets:
   - `ACR_LOGIN_SERVER`: Your Azure Container Registry server URL
   - `ACR_USER`: Your Azure Container Registry username
   - `ACR_PASS`: Your Azure Container Registry password
   - `AZURE_CREDENTIALS`: JSON output from running `az ad sp create-for-rbac`
   - `WEBAPP_NAME`: The name of your Azure Web App

2. Push to the main branch to trigger the GitHub Actions workflow

3. Access the deployed application at `https://[WEBAPP_NAME].azurewebsites.net`

## 9. Enhancing the Application

For a production application, consider these enhancements:

1. **Response Caching with Redis**:
   ```python
   # In backend/app/main.py
   from fastapi_cache import FastAPICache
   from fastapi_cache.backends.redis import RedisBackend
   from fastapi_cache.decorator import cache
   import aioredis
   
   @app.on_event("startup")
   async def startup():
       redis_client = await aioredis.from_url(os.getenv("REDIS_URL"))
       FastAPICache.init(RedisBackend(redis_client), prefix="fastapi-cache")
       
   @app.get("/api/cached-data")
   @cache(expire=60)
   async def get_cached_data():
       return {"data": "This response will be cached for 60 seconds"}
   ```

2. **Database Connection Pooling**:
   ```python
   # More robust database connection with SQLAlchemy
   from sqlalchemy import create_engine
   from sqlalchemy.ext.declarative import declarative_base
   from sqlalchemy.orm import sessionmaker
   
   SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
   engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_size=5, max_overflow=10)
   SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
   Base = declarative_base()
   ```

3. **Adding Structured Logging**:
   ```python
   # In backend/app/main.py
   import logging
   import json
   
   class JSONFormatter(logging.Formatter):
       def format(self, record):
           record_dict = record.__dict__.copy()
           record_dict["message"] = record.getMessage()
           return json.dumps(record_dict)
   
   # Configure logging
   logger = logging.getLogger("app")
   handler = logging.StreamHandler()
   handler.setFormatter(JSONFormatter())
   logger.addHandler(handler)
   logger.setLevel(logging.INFO)
   
   @app.middleware("http")
   async def log_requests(request, call_next):
       logger.info({
           "request_path": request.url.path,
           "request_method": request.method,
           "client_host": request.client.host,
       })
       response = await call_next(request)
       return response
   ```

## Common Pitfalls and Best Practices

When setting up a full-stack application with authentication, be aware of these common issues and follow the recommended best practices:

### 1. Authentication Flow Confusion

**Problem**: Users trying to access auth API endpoints directly in the browser instead of using the frontend routes.

**Solution**: 
- Clearly document the authentication flow in your README and UI
- Add helpful error pages for direct API access attempts
- Provide direct links to correct login/signup pages in the frontend
- Consider adding a dedicated onboarding or documentation page

### 2. Docker Configuration Issues

**Problem**: Port conflicts, container networking problems, or build failures.

**Solution**:
- Use different host ports to avoid conflicts with local services
- Make sure container-to-container communication uses service names
- Add proper health checks to detect issues early
- Use docker-compose for local development to simplify setup

### 3. Code Organization

**Problem**: Authentication logic scattered throughout the application.

**Solution**:
- Create dedicated auth components and providers
- Centralize authentication logic in specialized modules
- Use a consistent pattern for protected routes
- Document the authentication architecture

### 4. UI/UX Considerations

**Problem**: Confusing or frustrating user experience during sign-up/login.

**Solution**:
- Provide clear visual cues and buttons for authentication actions
- Add helpful error messages that explain what went wrong
- Create a streamlined onboarding experience
- Test the authentication flow thoroughly from a user perspective

### 5. TypeScript and Frontend Build Issues

**Problem**: Type errors, export/import issues, or build configuration problems.

**Solution**:
- Use proper TypeScript configuration
- Avoid export syntax errors in modules
- Set up linting and TypeScript checking in the CI pipeline
- Use try/catch blocks for error handling

## Conclusion

Following this guide will create a clean, well-structured "Hello, World" full stack application using Vite for the React frontend. The application runs both locally and on Azure and can be easily extended for more complex projects while maintaining a solid foundation of best practices. By being aware of common pitfalls and following the recommended solutions, you can create a robust and user-friendly application.

## Important Notes and Fixes

1. **Docker Build Fix**: When running Docker Compose for the first time, you may encounter an error related to `npm ci` requiring a package-lock.json file. The solution is to use `npm install` instead of `npm ci` in all Dockerfiles as shown in the updated code above.
   
   This is necessary because `npm ci` requires a pre-existing package-lock.json file, which doesn't exist when first building the containers. Using `npm install` allows the initial build to succeed and will create the package-lock.json file.

2. **Port Conflicts**: If you have a local PostgreSQL instance running, you may encounter a port conflict on 5432. To resolve this, you can change the host port in the docker-compose.yml file:

   ```yaml
   db:
     # ...other config...
     ports:
       - "5433:5432"  # Changed from "5432:5432"
   ```

   This maps port 5433 on your host to port 5432 in the container. No need to change the DATABASE_URL in the .env file as the services inside the Docker network still use the internal port 5432.

3. **User Authentication Implementation**: For proper authentication support and a good user experience, follow these guidelines:

   - Add SessionProvider in your App component:
   ```tsx
   <SessionProvider client={authClient}>
     <AuthUIProvider authClient={authClient} navigate={navigate} Link={NavLink}>
       {children}
     </AuthUIProvider>
   </SessionProvider>
   ```

   - Create a UserStatus component to show login/logout options:
   ```tsx
   const UserStatus: React.FC = () => {
     const { data: session, isLoading, signOut } = useSession();

     if (isLoading) return <div>Loading...</div>;

     if (!session) {
       return (
         <div>
           <Link to="/auth/signIn">Sign In</Link>
           <Link to="/auth/signUp">Register</Link>
         </div>
       );
     }

     return (
       <div>
         <span>Hi, {session.user.email}</span>
         <button onClick={() => signOut()}>Sign Out</button>
       </div>
     );
   };
   ```

   - Include proper sign-in/sign-up routes:
   ```tsx
   <Route path="/auth/:page" element={<AuthPage />} />
   ```

   - **IMPORTANT: Authentication Routing and UX**
     - Remember that auth service API endpoints (like `/api/auth/signUp`) are NOT meant to be accessed directly in a browser
     - Always provide clear frontend routes for authentication (like `/auth/signUp`)
     - Add helpful error pages to both frontend and auth service for better user guidance
     - Consider adding a dedicated sign-up page with clear instructions

   - **Add informative error handling** in the auth service to guide users:
   ```javascript
   // Add as middleware in auth service server.ts
   app.use((req, res, next) => {
     if (req.path.startsWith('/api/auth/') && req.method === 'GET') {
       // Provide a helpful error message instead of 404
       return res.status(404).send(`
         <html>
           <body>
             <h1>Auth API Not For Direct Browser Access</h1>
             <p>Please use the frontend application: 
                <a href="http://localhost:3001/auth/signUp">Sign Up Here</a>
             </p>
           </body>
         </html>
       `);
     }
     next();
   });
   ```

   - **Create comprehensive documentation** (AUTH_GUIDE.md) explaining:
     - The authentication flow
     - How to register and sign in
     - Common troubleshooting steps
     - Why direct API access doesn't work