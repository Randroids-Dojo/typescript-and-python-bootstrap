Complete Step‑by‑Step Production Deployment Guide
Tech stack: React (TypeScript) frontend • FastAPI backend • PostgreSQL • Redis • Docker Compose • BetterAuth • GitHub Actions • Azure App Service • Azure Database for PostgreSQL • Azure Key Vault

⸻

0. Prerequisites
	•	Local: Docker & Docker Compose, Node 18+, Python 3.11+, npm/yarn
	•	Azure: CLI (az), Resource Group, Service Principal for CI/CD, Azure Container Registry (ACR)

⸻

1. Monorepo & Folder Layout

myapp/
├── backend/              # FastAPI service
│   ├── app/
│   ├── requirements.txt
│   └── Dockerfile
├── auth-service/         # BetterAuth service
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── frontend/             # React app
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml    # Local dev orchestration
└── .env.example          # DEV secrets template



⸻

2. Local Dev: Docker Compose

Create docker-compose.yml at repo root:

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
    ports: ["8000:8000"]
    depends_on: [db, redis, auth-service]

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [auth-service, backend]

volumes: { db-data: {} }

	•	Copy real DEV values into .env (not committed).
	•	Run: docker-compose up --build →
	•	Auth at http://localhost:4000/api/auth
	•	API at http://localhost:8000
	•	React at http://localhost:3000

⸻

3. BetterAuth Service Setup

3.1 Initialize

cd auth-service
npm init -y
npm install better-auth pg express

3.2 Configure (auth-service/src/auth.ts)

import { betterAuth } from "better-auth";
import pkg from "pg"; const { Pool } = pkg;

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,      // e.g. http://localhost:4000
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});

3.3 Migrate DB

npx @better-auth/cli migrate

Creates users, sessions, etc., in your Postgres.

3.4 Express Server (auth-service/src/server.ts)

import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";

const app = express();
app.use(express.raw({ type: "*/*" }));
app.all("/api/auth/*", toNodeHandler(auth.handler));
app.get("/health", (_, res) => res.send("OK"));
app.listen(4000, () => console.log("BetterAuth on :4000"));

3.5 Dockerfile

# auth-service/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build       # if using TS; else skip
EXPOSE 4000
CMD ["node","dist/server.js"]  # or ["node","src/server.js"]



⸻

4. FastAPI Backend Integration

4.1 Remove Custom JWT Code
	•	Delete old /login, /refresh, JWT utils, refresh-token tables.

4.2 Install Dependencies

cd backend
pip install fastapi uvicorn psycopg2-binary sqlalchemy python-dotenv

4.3 CORS & Health Check (backend/app/main.py)

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
        raise HTTPException(500, "DB unreachable")
    return {"status":"OK"}

4.4 Session Dependency

from fastapi import HTTPException, Cookie
def get_current_user(better_auth_token: str = Cookie(alias="better-auth.session_token")):
    if not better_auth_token:
        raise HTTPException(401,"Not authenticated")
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    cur.execute("SELECT user_id, expires_at FROM sessions WHERE id=%s", (better_auth_token,))
    rec = cur.fetchone()
    cur.close(); conn.close()
    if not rec or rec[1] < datetime.utcnow():
        raise HTTPException(401,"Invalid or expired session")
    user_id = rec[0]
    # Fetch user details
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    cur.execute("SELECT id, email FROM users WHERE id=%s", (user_id,))
    u = cur.fetchone()
    cur.close(); conn.close()
    return {"id":u[0],"email":u[1]}

4.5 Protect Routes

from fastapi import Depends

@app.get("/profile")
def profile(user=Depends(get_current_user)):
    return {"email":user["email"]}



⸻

5. React Frontend Integration

5.1 Install

cd frontend
npm install better-auth @daveyplate/better-auth-ui react-router-dom

5.2 Auth Client (frontend/src/lib/auth-client.ts)

import { createAuthClient } from "better-auth/client";
export const authClient = createAuthClient({
  baseURL: process.env.REACT_APP_AUTH_URL || "/api/auth"
});

5.3 Wrap App (frontend/src/main.tsx)

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { authClient } from "./lib/auth-client";
import { BrowserRouter, useNavigate, NavLink } from "react-router-dom";

function Providers({children}) {
  const navigate = useNavigate();
  return (
    <AuthUIProvider authClient={authClient} navigate={navigate} Link={NavLink}>
      {children}
    </AuthUIProvider>
  );
}

ReactDOM.createRoot(...).render(
  <BrowserRouter><Providers><App/></Providers></BrowserRouter>
);

5.4 Auth UI
	•	Route: /auth/:page → render:

import { AuthCard } from "@daveyplate/better-auth-ui";
function AuthPage() {
  const { page } = useParams(); // "sign-in" or "sign-up"
  return <AuthCard pathname={page} />;
}


	•	Custom UI: use authClient.signIn.email({ email, password }) and authClient.signOut().

5.5 Remove Token Storage
	•	No more localStorage or manual refreshing. BetterAuth sets an HttpOnly cookie (better-auth.session_token).

5.6 Session Hook

const { data: session } = authClient.useSession();
if (!session) navigate("/auth/sign-in");

5.7 Fetch with Credentials

axios.defaults.withCredentials = true;



⸻

6. Dockerizing All Services

6.1 Backend Dockerfile

# backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["gunicorn","-w","4","-k","uvicorn.workers.UvicornWorker","main:app"]

6.2 Frontend Dockerfile

# frontend/Dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html  # or /app/build
EXPOSE 80

6.3 Compose for Production (optional)

version: '3.8'
services:
  betterauth:
    image: myregistry.azurecr.io/betterauth:latest
    env_file: .env.prod
  api:
    image: myregistry.azurecr.io/myapp-backend:latest
    env_file: .env.prod
    depends_on: [betterauth]
  frontend:
    image: myregistry.azurecr.io/myapp-frontend:latest



⸻

7. CI/CD with GitHub Actions

# .github/workflows/deploy.yml
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Azure ACR Login
        uses: azure/docker-login@v1
        with:
          login-server: myregistry.azurecr.io
          username: ${{ secrets.ACR_USER }}
          password: ${{ secrets.ACR_PASS }}

      # Build & push images
      - uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: myregistry.azurecr.io/myapp-backend:${{ github.sha }}
      - uses: docker/build-push-action@v4
        with:
          context: ./auth-service
          push: true
          tags: myregistry.azurecr.io/betterauth:${{ github.sha }}
      - uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: myregistry.azurecr.io/myapp-frontend:${{ github.sha }}

      # DB migrations
      - name: Run migrations
        run: |
          docker run --rm -e DATABASE_URL=${{ secrets.DB_URL }} \
            myregistry.azurecr.io/myapp-backend:${{ github.sha }} \
            alembic upgrade head

      # Deploy to Azure
      - uses: azure/webapps-deploy@v2
        with:
          app-name: myapp-multicontainer
          slot-name: Production
          images: |
            myregistry.azurecr.io/betterauth:${{ github.sha }}
            myregistry.azurecr.io/myapp-backend:${{ github.sha }}
            myregistry.azurecr.io/myapp-frontend:${{ github.sha }}
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}



⸻

8. Azure Production Deployment

8.1 Provision Resources

az group create -n myapp-rg -l centralus
az acr create -n myregistry -g myapp-rg --sku Basic
az postgres flexible-server create -n myapp-pg -g myapp-rg -u pguser -p pgpass --tier GeneralPurpose --zone-redundant Enabled
az keyvault create -n myapp-kv -g myapp-rg
az webapp plan create -n myapp-plan -g myapp-rg --is-linux --sku B1
az webapp create -n myapp-multicontainer -g myapp-rg -p myapp-plan --multicontainer-config-type compose --multicontainer-config-file docker-compose.prod.yml

8.2 Key Vault Secrets

az keyvault secret set --vault-name myapp-kv --name BETTER_AUTH_SECRET --value "$(openssl rand -base64 32)"
az keyvault secret set --vault-name myapp-kv --name DATABASE_URL --value "postgresql://pguser:pgpass@myapp-pg.postgres.database.azure.com:5432/myapp"
az keyvault secret set --vault-name myapp-kv --name BETTER_AUTH_URL --value "https://myapp-multicontainer.azurewebsites.net"
az keyvault secret set --vault-name myapp-kv --name BETTER_AUTH_GITHUB_CLIENT_ID --value "<...>"
az keyvault secret set --vault-name myapp-kv --name BETTER_AUTH_GITHUB_CLIENT_SECRET --value "<...>"

8.3 App Service Configuration

In Azure Portal → your Web App → Configuration →
	•	Enable System‑Assigned Managed Identity
	•	Add App Settings referencing Key Vault:
	•	DATABASE_URL = @Microsoft.KeyVault(SecretUri=https://myapp-kv.vault.azure.net/secrets/DATABASE_URL/)
	•	BETTER_AUTH_SECRET = @Microsoft.KeyVault(.../BETTER_AUTH_SECRET/)
	•	BETTER_AUTH_URL = @Microsoft.KeyVault(.../BETTER_AUTH_URL/)
	•	GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET similarly
	•	Under Container Settings, ensure the three images are set (or use the compose file).

8.4 Networking & Cookies
	•	If frontend, API, and auth share the same hostname (myapp-multicontainer.azurewebsites.net), BetterAuth’s cookie will be sent automatically.
	•	If using subdomains (e.g. api. and auth.), set in BetterAuth config:

advanced: {
  crossSubDomainCookies: { enabled:true, domain:".myapp.com" }
}


	•	Always serve over HTTPS (Azure provides a certificate on *.azurewebsites.net).

⸻

9. Monitoring, Health & Backups
	1.	Health Probes: In App Service → Monitoring → Health check → /health
	2.	Logs & Metrics: Enable Application Insights → collect exceptions, requests
	3.	Alerts: CPU > 80%, HTTP 5xx > 5% → email/pager alerts
	4.	DB Backups: Azure Postgres Flexible Server includes daily backups + PITR (7–35 days retention) with zone‑redundant HA. Test restores in a staging environment.

⸻

10. Performance & Caching
	1.	Response Caching (FastAPI + Redis):

from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
@app.on_event("startup")
async def startup():
    FastAPICache.init(RedisBackend(redis_client), prefix="fastapi")
@app.get("/items/{id}")
@cache(expire=60)
async def read_item(id:int): ...


	2.	DB Connection Pooling (SQLAlchemy):

engine = create_engine(os.getenv("DATABASE_URL"), pool_size=5, max_overflow=5)


	3.	React Code Splitting:

const Dashboard = lazy(() => import("./Dashboard"));
<Suspense fallback={<Spinner/>}><Dashboard/></Suspense>


	4.	Frontend Resilience: Axios with withCredentials and global retry logic (BetterAuth handles sessions).