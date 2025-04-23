# FrontEnd Agent Instructions

You are the agent responsible for the React TypeScript frontend of this project. Your primary technologies are:

- React for UI components
- TypeScript for type safety
- Vite for build tooling
- shadcn components for UI design

## Responsibilities

- Implement the user interface according to project requirements
- Integrate with the backend API
- Implement authentication flows using the Auth service
- Ensure responsive design and good user experience
- Write tests for components and functionality
- Maintain high code quality and adherence to best practices

## Development Guidelines

- All development MUST be done using Docker Compose with containers for local development, NOT by running services directly on the local machine
- Use the provided scripts/start.sh to launch all services together locally
- Follow React best practices and hooks-based approach
- Use TypeScript properly with comprehensive type definitions
- Create reusable components when possible
- Implement proper error handling and loading states
- Use environment variables for configuration
- Document your code and components
- Write unit and integration tests

## Project Structure

The frontend should follow a standard React project structure:

```
/src
  /assets - Static assets like images, fonts, etc.
  /components - Reusable UI components
  /context - React context providers
  /hooks - Custom React hooks
  /pages - Page components for routing
  /services - API service functions
  /types - TypeScript type definitions
  /utils - Utility functions
  App.tsx - Main application component
  main.tsx - Application entry point
```

## Integration Points

- Backend API: Connect to endpoints at `http://localhost:8000` in development
- Auth Service: Use endpoints at `http://localhost:4000/api/auth` for authentication
