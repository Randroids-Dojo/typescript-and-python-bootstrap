# Full-Stack TypeScript & Python Bootstrap

A minimal full-stack web application template with authentication, user profiles, and a shared counter feature.

## Tech Stack

- **Frontend**: React TypeScript with Vite, Tailwind CSS, Shadcn UI
- **Authentication**: Better Auth (Node.js service)
- **Backend API**: FastAPI (Python)
- **Database**: PostgreSQL
- **Cache**: Redis
- **Reverse Proxy**: Nginx
- **Containerization**: Docker & Docker Compose

## Features

- User registration and login
- User profile management
- Global counter that any logged-in user can increment
- Fully containerized development environment
- Production-ready Docker configurations
- Azure deployment ready

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and adjust if needed:
   ```bash
   cp .env.example .env
   ```

3. Start all services with Docker Compose:
   ```bash
   docker-compose up
   ```

4. Access the application:
   - Frontend: http://localhost
   - API Docs: http://localhost/api/docs
   - Auth Service: http://localhost/auth

## Project Structure

```
.
├── frontend/           # React TypeScript Vite app
├── auth-service/       # Better Auth Node.js service
├── backend/           # FastAPI Python backend
├── nginx/             # Nginx reverse proxy config
├── docker-compose.yml # Development configuration
└── docker-compose.prod.yml # Production configuration
```

## Development

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Auth Service Development
```bash
cd auth-service
npm install
npm run dev
```

## API Endpoints

### Authentication (Better Auth)
- `POST /auth/signup` - User registration
- `POST /auth/signin` - User login
- `POST /auth/signout` - User logout
- `GET /auth/session` - Get current session

### Backend API
- `GET /api/health` - Health check
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/counter` - Get counter value
- `POST /api/counter/increment` - Increment counter

## Production Deployment

### Build for Production
```bash
docker-compose -f docker-compose.prod.yml build
```

### Deploy to Azure
1. Create Azure resources:
   - Azure Container Registry
   - Azure Database for PostgreSQL
   - Azure Cache for Redis
   - Azure Container Instances or App Service

2. Update production environment variables in `.env`

3. Push images to registry and deploy

## Environment Variables

See `.env.example` for all available configuration options.

## License

MIT