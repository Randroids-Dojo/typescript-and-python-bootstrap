# Project Initialize Agents Command

This command creates or updates the initial instructions and todo lists for each service agent in the project.

## Purpose

The `project:initialize-agents` command sets up guidance files for the frontend, backend, and authentication service agents. These files include:

1. `claude.md` - Contains instructions and guidelines for each agent
2. `todo.txt` - Contains a list of tasks for each agent to complete

## Important Guidelines

When creating or updating agent instructions, emphasize these critical points:

### Docker Compose Development

- All development MUST be done using Docker Compose with containers for local development
- No services should run directly on the local machine
- Use the provided `scripts/start.sh` to launch all services together
- Ensure proper integration with the docker-compose.yml at the root
- Each service should have Docker configuration that works within the Docker Compose setup

### Service Structure

For each service (FrontEnd, BackEnd, Auth):
- Create detailed instructions in `claude.md` that explain technologies, responsibilities, and guidelines
- Create a comprehensive `todo.txt` with step-by-step tasks
- Ensure instructions reference integration with other services
- Document all integration points (URLs, ports, etc.)

### FrontEnd Service

- React TypeScript frontend with Vite
- shadcn components for UI
- Configure for connecting to backend and auth services

### BackEnd Service

- FastAPI Python backend
- PostgreSQL database with SQLAlchemy
- Redis for caching
- Configure for connecting to auth service

### Auth Service

- Node.js BetterAuth service
- JWT-based authentication
- Endpoints for user creation, login, and token validation

## Implementation

The command should:
1. Read the current README.md to understand project structure
2. Create or update the claude.md and todo.txt files for each service
3. Ensure all files contain the latest requirements and best practices
4. Emphasize Docker Compose for local development

## Example Usage

```
claude project:initialize-agents
```