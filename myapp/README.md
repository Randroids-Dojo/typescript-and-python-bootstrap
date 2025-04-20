# Hello World Full Stack Application

A complete full stack application with frontend, backend, and authentication components.

## Tech Stack

- **Frontend**: React with TypeScript (using Vite)
- **Backend**: FastAPI (Python)
- **Authentication**: BetterAuth service
- **Local Development**: Docker & Docker Compose
- **Deployment**: Azure (Container Registry, PostgreSQL, App Service)
- **CI/CD**: GitHub Actions workflow

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

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js and npm (for local development)
- Python 3.11+ (for local development)

### Local Development

1. Clone this repository
2. Create a `.env` file by copying from `.env.example` and fill in the secrets
3. Start the application with Docker Compose:

```bash
docker-compose up --build
```

4. Access the application:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:8001
   - Auth Service: http://localhost:4000

### Deployment to Azure

1. Set up the required Azure resources:
   - Azure Container Registry
   - Azure Database for PostgreSQL
   - Azure Key Vault
   - Azure App Service Plan

2. Add the required GitHub Secrets:
   - `ACR_LOGIN_SERVER`: Your Azure Container Registry server URL
   - `ACR_USER`: Your Azure Container Registry username
   - `ACR_PASS`: Your Azure Container Registry password
   - `AZURE_CREDENTIALS`: JSON output from running `az ad sp create-for-rbac`
   - `WEBAPP_NAME`: The name of your Azure Web App

3. Push to the main branch to trigger the GitHub Actions workflow

4. Access the deployed application at `https://[WEBAPP_NAME].azurewebsites.net`