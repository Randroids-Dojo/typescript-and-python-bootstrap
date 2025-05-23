# Full-Stack TypeScript & Python Bootstrap

> 🤖 **This entire project was generated with [Claude Code Opus 4](https://claude.ai/code)**

A minimal full-stack web application template with authentication, user profiles, and a shared counter feature. This project serves as a bootstrap template for building modern web applications with a complete authentication system and basic user functionality.

## Tech Stack

- **Frontend**: React TypeScript with Vite, Tailwind CSS, Shadcn UI
- **Authentication**: Better Auth (Node.js service)
- **Backend API**: FastAPI (Python)
- **Database**: PostgreSQL
- **Cache**: Redis
- **Reverse Proxy**: Nginx
- **Containerization**: Docker & Docker Compose

## Features

- ✅ User registration and login with Better Auth
- ✅ Persistent user profile management
- ✅ Global counter that any logged-in user can increment
- ✅ Session-based authentication with secure cookies
- ✅ Fully containerized development environment
- ✅ Production-ready Docker configurations
- ✅ Azure deployment ready

## Screenshots

### Login Screen
![Login Screen](screenshots/login.png)
*Clean and simple login interface with email/password authentication*

### Dashboard
![Dashboard](screenshots/dashboard.png)
*Main dashboard showing user profile and global counter features*

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

## How This Project Was Built

This entire project was generated using Claude Code Opus 4 in a single conversation. The AI assistant:

1. **Planned the Architecture**: Designed a full-stack monolithic application with proper separation of concerns
2. **Implemented Authentication**: Integrated Better Auth for secure user authentication with session management
3. **Built the Frontend**: Created a React TypeScript application with Vite, Tailwind CSS, and Shadcn UI components
4. **Developed the Backend**: Built a FastAPI Python backend with async support and proper error handling
5. **Set up Infrastructure**: Configured Docker Compose for local development with PostgreSQL, Redis, and Nginx
6. **Handled Integration**: Ensured all services work together seamlessly with proper CORS, cookies, and authentication flow

### Key Technical Decisions

- **Better Auth**: Chosen for its modern, secure authentication with built-in session management
- **FastAPI**: Selected for its high performance, automatic API documentation, and Python ecosystem
- **Docker Compose**: Used to ensure consistent development environments and easy deployment
- **Nginx**: Acts as a reverse proxy to unify all services under a single port

## Contributing

This project is designed as a bootstrap template. Feel free to fork and adapt it for your own needs!

## License

MIT

---

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>