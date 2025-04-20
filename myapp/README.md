# MyApp - Full-Stack TypeScript and Python Application

A modern full-stack application with:
- React (TypeScript) frontend
- FastAPI backend
- BetterAuth authentication service
- PostgreSQL database
- Redis caching
- Docker Compose for local development
- GitHub Actions for CI/CD
- Azure App Service for deployment

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- npm or yarn
- Azure CLI (for deployment)

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd myapp
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file to configure your environment variables. Key variables include:
   - `DATABASE_URL`: Connection string for PostgreSQL
   - `BETTER_AUTH_SECRET`: Secret key used by the BetterAuth service to sign tokens and secure sessions
   - `BETTER_AUTH_GITHUB_CLIENT_ID` and `BETTER_AUTH_GITHUB_CLIENT_SECRET`: Credentials obtained from GitHub to enable OAuth login

4. Start the application using Docker Compose:
   ```bash
   docker-compose up --build
   ```

5. Access the services:
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - Auth Service: http://localhost:4000/api/auth

## Development

### Frontend (React TypeScript)

For local development without Docker:

```bash
cd frontend
npm install
npm start
```

### Backend (FastAPI)

For local development without Docker:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Auth Service

For local development without Docker:

```bash
cd auth-service
npm install
npm run dev
```

## Deployment

The project includes GitHub Actions workflows for CI/CD deployment to Azure. Configure the following secrets in your GitHub repository:

- `ACR_USER`: Azure Container Registry username
- `ACR_PASS`: Azure Container Registry password
- `AZURE_PUBLISH_PROFILE`: Azure Web App publish profile

## Architecture

The application follows a microservices architecture:

- **Frontend**: React app for user interface
- **Backend**: FastAPI service for business logic and data access
- **Auth Service**: BetterAuth service for authentication and user management
- **Database**: PostgreSQL for data storage
- **Cache**: Redis for caching and session storage

## License

MIT