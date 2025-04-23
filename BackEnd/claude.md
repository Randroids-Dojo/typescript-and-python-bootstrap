# BackEnd Service Agent Instructions

## Overview

You are the agent responsible for developing the Backend service of this application. This is a FastAPI Python backend that provides API endpoints for the frontend, interacts with PostgreSQL database via SQLAlchemy, and uses Redis for caching.

## Key Technologies

- **FastAPI**: Modern, high-performance Python web framework
- **SQLAlchemy**: SQL toolkit and ORM for Python
- **PostgreSQL**: Relational database
- **Redis**: In-memory data structure store for caching
- **Docker/Docker Compose**: For containerized development

## Development Guidelines

### Docker-First Development

- **CRITICAL**: All development MUST be done using Docker Compose
- Never run services directly on the local machine
- The backend service will be available at http://localhost:8000
- Use the provided `scripts/start.sh` at the project root to launch all services together

### Service Integration

- Frontend Integration: Provide API endpoints for the React frontend
- Auth Service Integration: http://localhost:4000/api/auth
  - Validate JWTs passed from frontend
  - Create endpoints that respect authentication requirements
- Database: Connect to PostgreSQL at postgres:5432 (Docker service name)
- Cache: Connect to Redis at redis:6379 (Docker service name)

### Code Quality Standards

- Implement proper error handling
- Use FastAPI dependency injection pattern
- Write Pydantic models for request/response validation
- Document all endpoints with OpenAPI
- Write unit and integration tests
- Follow PEP 8 style guidelines

### Folder Structure

Follow this recommended structure for the backend:

```
BackEnd/
├── Dockerfile
├── app/
│   ├── __init__.py
│   ├── main.py             # FastAPI application entry point
│   ├── api/                # API endpoints
│   │   ├── __init__.py
│   │   ├── deps.py         # Dependencies
│   │   └── routes/         # API route modules
│   ├── core/               # Core functionality
│   │   ├── __init__.py
│   │   ├── config.py       # Application configuration
│   │   └── security.py     # Security utilities
│   ├── db/                 # Database models and setup
│   │   ├── __init__.py
│   │   ├── base.py         # Base models
│   │   └── models/         # Database models
│   ├── schemas/            # Pydantic models
│   │   └── __init__.py
│   └── services/           # Business logic
│       └── __init__.py
├── tests/                  # Test files
├── migrations/             # Alembic migrations
├── .env.example            # Example environment variables
├── requirements.txt        # Python dependencies
└── pytest.ini             # Pytest configuration
```

## Environment Variables

Ensure you create a `.env` file based on `.env.example` with these variables:

```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/app
REDIS_URL=redis://redis:6379/0
AUTH_SERVICE_URL=http://auth:4000/api/auth
SECRET_KEY=your-secret-key
```

## Docker Configuration

The Dockerfile should:
- Use Python 3.9 or newer
- Install dependencies
- Expose port 8000
- Configure for FastAPI with Uvicorn

Make sure the Docker configuration works within the Docker Compose setup at the project root.

## Refer to the todo.txt file for your specific implementation tasks.