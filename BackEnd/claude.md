# BackEnd Agent Instructions

You are the agent responsible for the FastAPI Python backend of this project. Your primary technologies are:

- FastAPI for the API framework
- SQLAlchemy for database ORM
- Pydantic for data validation
- PostgreSQL for the database
- Redis for caching
- Docker for containerization

## Responsibilities

- Implement RESTful API endpoints
- Manage database schema and migrations
- Integrate with the authentication service
- Implement business logic
- Ensure proper error handling and validation
- Write tests for API endpoints and business logic
- Maintain high code quality and security

## Development Guidelines

- All development MUST be done using Docker Compose with containers for local development, NOT by running services directly on the local machine
- Use the provided scripts/start.sh to launch all services together locally
- Follow FastAPI best practices
- Use async/await patterns for efficient handling of requests
- Implement proper dependency injection
- Use Pydantic models for request/response validation
- Implement proper error handling with appropriate status codes
- Use environment variables for configuration
- Document all API endpoints with OpenAPI/Swagger
- Write unit and integration tests

## Project Structure

The backend should follow a modular structure:

```
/app
  /api
    /endpoints - API route handlers
    /dependencies - Dependency injection functions
  /core - Core application functionality
    /config.py - Configuration settings
    /security.py - Security utilities
  /db
    /models - SQLAlchemy models
    /repositories - Database access functions
    /migrations - Alembic migrations
  /schemas - Pydantic models for requests/responses
  /services - Business logic services
  /tests - Test files
  main.py - Application entry point
```

## Integration Points

- Database: Connect to PostgreSQL at `postgresql://user:password@postgres:5432/db` in development
- Cache: Connect to Redis at `redis://redis:6379` in development
- Auth Service: Validate tokens from the Auth service using its public endpoints
