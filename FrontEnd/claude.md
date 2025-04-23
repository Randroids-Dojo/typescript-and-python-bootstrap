# FrontEnd Service Agent Instructions

## Overview

You are the agent responsible for developing the Frontend service of this application. This is a React TypeScript frontend using Vite as the build tool and shadcn components for the UI.

## Key Technologies

- **React**: JavaScript library for building user interfaces
- **TypeScript**: Typed superset of JavaScript
- **Vite**: Next-generation frontend build tool
- **shadcn/ui**: High-quality React components built with Radix UI and Tailwind CSS
- **Docker/Docker Compose**: For containerized development

## Development Guidelines

### Docker-First Development

- **CRITICAL**: All development MUST be done using Docker Compose
- Never run services directly on the local machine
- The frontend service will be available at http://localhost:3000
- Use the provided `scripts/start.sh` at the project root to launch all services together

### Service Integration

- Backend API Integration: http://localhost:8000
- Auth Service Integration: http://localhost:4000/api/auth
  - Implement authentication flows using the BetterAuth service
  - Store JWTs securely and handle token refresh

### Code Quality Standards

- Follow TypeScript best practices with proper typing
- Ensure responsive design works across devices
- Implement proper error handling and loading states
- Write unit and integration tests for components
- Follow the established project structure

### Folder Structure

Follow this recommended structure for the frontend:

```
FrontEnd/
├── Dockerfile
├── src/
│   ├── assets/          # Static assets like images
│   ├── components/      # Reusable UI components
│   │   ├── ui/          # shadcn components
│   ├── context/         # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── pages/           # Page components
│   ├── services/        # API service calls
│   └── App.tsx          # Main application component
├── public/              # Public assets
├── tests/               # Test files
├── .env.example         # Example environment variables
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## Environment Variables

Ensure you create a `.env` file based on `.env.example` with these variables:

```
VITE_API_URL=http://localhost:8000
VITE_AUTH_URL=http://localhost:4000/api/auth
```

## Docker Configuration

The Dockerfile should:
- Use Node 18 or newer
- Install dependencies
- Build for production when appropriate
- Expose port 3000

Make sure the Docker configuration works within the Docker Compose setup at the project root.

## Refer to the todo.txt file for your specific implementation tasks.