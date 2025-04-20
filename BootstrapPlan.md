0. Prerequisites
	•	Local: Docker & Docker Compose, Node 18+, Python 3.11+, npm/yarn, az CLI (logged in), GitHub repo with Secrets configured.
	•	Azure: Resource Group, Azure Container Registry (ACR), Azure Database for PostgreSQL (Flexible Server), Key Vault, App Service Plan (Linux), Service Principal or Publish Profile for CI/CD.

⸻

1. Monorepo & Folder Structure

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
├── frontend/             # React (TS)
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml    # Local dev
├── docker-compose.prod.yml # Prod multi‑service (images & ports)
├── .env.example          # Template
└── .github/
    └── workflows/deploy.yml



⸻

2. Local Development with Docker Compose

Create docker-compose.yml:

version: '3.8'
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: devuser
      POSTGRES_PASSWORD: devpass
      POSTGRES_DB: myapp_dev
    volumes: [ db-data:/var/lib/postgresql/data ]

  redis:
    image: redis:7-alpine

  auth-service:
    build: ./auth-service
    env_file: .env
    ports: ["4000:4000"]
    depends_on: [db]

  backend:
    build: ./backend
    env_file: .env
    ports: ["8001:8000"]     # exposed port 8000 ➔ host 8001
    depends_on: [db, redis, auth-service]

  frontend:
    build: ./frontend
    env_file: .env
    ports: ["3001:80"]       # Nginx port 80 ➔ host 3001
    depends_on: [auth-service, backend]

volumes:
  db-data:

	1.	Copy real dev values into .env (never commit credentials).
	2.	Run docker-compose up --build.
	•	Auth API at http://localhost:4000/api/auth
	•	FastAPI at http://localhost:8001
	•	React UI at http://localhost:3001

⸻

3. Auth‑Service (BetterAuth) Setup

3.1 Initialize

cd auth-service
npm init -y
npm install better-auth pg express typescript ts-node @types/express @types/pg
npx tsc --init

3.2 Configure src/auth.ts

import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,       // e.g. http://localhost:4000
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: {
      clientId: process.env.BETTER_AUTH_GITHUB_CLIENT_ID!,
      clientSecret: process.env.BETTER_AUTH_GITHUB_CLIENT_SECRET!,
    },
  },
  // allow React dev origin in dev
  trustedOrigins: [process.env.FRONTEND_URL!],
});

3.3 Server Entry src/server.ts

import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";

const app = express();
app.use(express.raw({ type: "*/*" }));
app.all("/api/auth/*", toNodeHandler(auth.handler));
app.get("/health", (_, res) => res.send("OK"));

const PORT = +process.env.PORT! || 4000;
app.listen(PORT, () => console.log(`BetterAuth on port ${PORT}`));

3.4 Migrate Database

npx @better-auth/cli migrate

3.5 Dockerfile

# auth-service/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build    # compile TS → dist/
EXPOSE 4000
CMD ["node","dist/server.js"]



⸻

4. FastAPI Backend Integration

4.1 Dependencies

cd backend
pip install fastapi uvicorn gunicorn psycopg2-binary sqlalchemy alembic python-dotenv bcrypt

4.2 CORS & Health Check app/main.py

from fastapi import FastAPI, HTTPException, Depends, Cookie
from fastapi.middleware.cors import CORSMiddleware
import psycopg2, os, datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL")],
    allow_credentials=True,
    allow_methods=["GET","POST","PUT","DELETE"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        conn.close()
    except:
        raise HTTPException(500, "Database unreachable")
    return {"status":"OK"}

4.3 Session Dependency

from fastapi import HTTPException, Cookie
import psycopg2, os, datetime

def get_current_user(
    session_token: str = Cookie(alias="better-auth.session_token")
):
    if not session_token:
        raise HTTPException(401, "Not authenticated")

    # Validate session
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    cur.execute(
      "SELECT user_id, expires_at FROM sessions WHERE id=%s",
      (session_token,)
    )
    rec = cur.fetchone()
    cur.close(); conn.close()

    if not rec or rec[1] < datetime.datetime.utcnow():
        raise HTTPException(401, "Invalid or expired session")

    user_id = rec[0]
    # Fetch user
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    cur.execute(
      "SELECT id, email FROM users WHERE id=%s", (user_id,)
    )
    u = cur.fetchone()
    cur.close(); conn.close()

    if not u:
        raise HTTPException(401, "User not found")

    return {"id": u[0], "email": u[1]}

4.4 Protect Routes

from fastapi import Depends

@app.get("/profile")
def profile(user=Depends(get_current_user)):
    return {"email": user["email"]}

@app.get("/api/user")
def get_user(user=Depends(get_current_user)):
    # Additional user fields if needed
    return {"id": user["id"], "email": user["email"]}

4.5 Dockerfile (with Gunicorn)

# backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["gunicorn","-w","4","-k","uvicorn.workers.UvicornWorker","app.main:app","--bind","0.0.0.0:8000"]



⸻

5. React Frontend Integration

5.1 Dependencies

cd frontend
npm install better-auth @daveyplate/better-auth-ui react-router-dom axios

5.2 Auth Client src/lib/auth-client.ts

import { createAuthClient } from "better-auth/client";
export const authClient = createAuthClient({
  baseURL: process.env.REACT_APP_AUTH_URL || "http://localhost:4000/api/auth",
});

5.3 App Provider src/main.tsx

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { authClient } from "./lib/auth-client";
import { BrowserRouter, useNavigate, NavLink } from "react-router-dom";

function Providers({children}) {
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

ReactDOM.createRoot(...).render(
  <BrowserRouter>
    <Providers><App/></Providers>
  </BrowserRouter>
);

5.4 Auth UI Route src/pages/AuthPage.tsx

import { useParams } from "react-router-dom";
import { AuthCard } from "@daveyplate/better-auth-ui";

export default function AuthPage(){
  const { page } = useParams();  // "signIn" or "signUp"
  return <AuthCard pathname={page} />;
}

Note: BetterAuth routes are signIn/signUp (match casing).

5.5 Session Hook & ProtectedRoute

// src/components/ProtectedRoute.tsx
import { useSession } from "better-auth/client";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({children}) {
  const { data: session } = useSession();
  if (session === null) return <Navigate to="/auth/signIn" replace />;
  return <>{children}</>;
}

5.6 Axios Defaults

import axios from "axios";
axios.defaults.withCredentials = true;  // include BetterAuth cookie

5.7 Dockerfile

# frontend/Dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
RUN printf 'server{listen 80; location /{try_files $uri $uri/ /index.html;}}' \
    > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]



⸻

6. CI/CD with GitHub Actions

.github/workflows/deploy.yml

name: Build & Deploy

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login to ACR
        uses: azure/docker-login@v1
        with:
          login-server: myregistry.azurecr.io
          username: ${{ secrets.ACR_USER }}
          password: ${{ secrets.ACR_PASS }}

      # Build & push images with commit SHA tag
      - uses: docker/build-push-action@v4
        with:
          context: ./auth-service
          push: true
          tags: myregistry.azurecr.io/betterauth:${{ github.sha }}

      - uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: myregistry.azurecr.io/myapp-backend:${{ github.sha }}

      - uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: myregistry.azurecr.io/myapp-frontend:${{ github.sha }}

      # Run Alembic migrations
      - name: DB migrations
        run: |
          docker run --rm \
            -e DATABASE_URL=${{ secrets.DB_URL }} \
            myregistry.azurecr.io/myapp-backend:${{ github.sha }} \
            alembic upgrade head

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: myapp-multicontainer
          slot-name: Production
          images: |
            myregistry.azurecr.io/betterauth:${{ github.sha }}
            myregistry.azurecr.io/myapp-backend:${{ github.sha }}
            myregistry.azurecr.io/myapp-frontend:${{ github.sha }}
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}



⸻

7. Production Azure Setup

7.1 Provision Resources

az group create -n myapp-rg -l centralus
az acr create -n myregistry -g myapp-rg --sku Basic
az postgres flexible-server create \
  -n myapp-pg -g myapp-rg -u pguser -p pgpass \
  --tier GeneralPurpose --zone-redundant Enabled
az keyvault create -n myapp-kv -g myapp-rg
az appservice plan create -n myapp-plan -g myapp-rg --sku B1 --is-linux
az webapp create \
  -n myapp-multicontainer -g myapp-rg \
  -p myapp-plan \
  --multicontainer-config-type compose \
  --multicontainer-config-file docker-compose.prod.yml

7.2 Key Vault Secrets

az keyvault secret set --vault-name myapp-kv --name BETTER_AUTH_SECRET \
  --value "$(openssl rand -base64 32)"
az keyvault secret set --vault-name myapp-kv --name DATABASE_URL \
  --value "postgresql://pguser:pgpass@myapp-pg.postgres.database.azure.com:5432/myapp"
az keyvault secret set --vault-name myapp-kv --name BETTER_AUTH_URL \
  --value "https://myapp-multicontainer.azurewebsites.net"
az keyvault secret set --vault-name myapp-kv --name BETTER_AUTH_GITHUB_CLIENT_ID --value "<...>"
az keyvault secret set --vault-name myapp-kv --name BETTER_AUTH_GITHUB_CLIENT_SECRET --value "<...>"

7.3 App Service Configuration
	•	Identity: Enable System‑Assigned Managed Identity.
	•	Access: Grant that identity “Get” permission on each Key Vault secret.
	•	Configuration (App Settings):

DATABASE_URL                 = @Microsoft.KeyVault(SecretUri=https://myapp-kv.vault.azure.net/secrets/DATABASE_URL)
FRONTEND_URL                 = https://myapp-multicontainer.azurewebsites.net
REACT_APP_AUTH_URL            = https://myapp-multicontainer.azurewebsites.net/api/auth
REACT_APP_API_URL             = https://myapp-multicontainer.azurewebsites.net
BETTER_AUTH_SECRET           = @Microsoft.KeyVault(…/BETTER_AUTH_SECRET)
BETTER_AUTH_URL              = @Microsoft.KeyVault(…/BETTER_AUTH_URL)
BETTER_AUTH_GITHUB_CLIENT_ID = @Microsoft.KeyVault(…/BETTER_AUTH_GITHUB_CLIENT_ID)
BETTER_AUTH_GITHUB_CLIENT_SECRET = @Microsoft.KeyVault(…/BETTER_AUTH_GITHUB_CLIENT_SECRET)


	•	Health Check: Set path to /health (FastAPI) and /api/auth/health or separate auth-service health check if deploying two Web Apps.
	•	Scale: Enable “Always On” and configure autoscale rules (CPU > 70% → +1 instance).

⸻

8. Performance & Reliability Enhancements
	1.	Response Caching (FastAPI + Redis):

from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache

@app.on_event("startup")
async def startup():
    FastAPICache.init(RedisBackend(await aioredis.from_url(os.getenv("REDIS_URL"))), prefix="fastapi")

@app.get("/items/{id}")
@cache(expire=60)
async def read_item(id: int):
    return {"id": id}


	2.	Rate Limiting (fastapi-limiter + Redis):

from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

@app.on_event("startup")
async def startup():
    await FastAPILimiter.init(redis_client)

@app.post("/api/protected", dependencies=[Depends(RateLimiter(times=5, minutes=1))])
async def protected(...): ...


	3.	DB Connection Pooling (SQLAlchemy):

engine = create_engine(os.getenv("DATABASE_URL"), pool_size=5, max_overflow=5)


	4.	Gunicorn Worker Tuning: use workers = cores * 2 in the Docker CMD.
	5.	Logging: configure structured JSON logs to stdout for App Insights ingestion.