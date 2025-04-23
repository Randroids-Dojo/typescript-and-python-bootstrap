# Frontend Application

A modern React TypeScript application with authentication, a clean UI, and a robust architecture.

## Features

- 🛡️ Secure authentication with BetterAuth integration
- 🎨 Beautiful UI with shadcn/ui components
- 🌓 Light and dark mode support
- 📱 Fully responsive design
- 🔒 Protected routes and session management
- 🚨 Comprehensive error handling
- 🌐 API client for backend communication

## Technologies

- React with TypeScript
- Vite build system
- Tailwind CSS for styling
- shadcn/ui for component library
- React Router for routing
- React Hook Form for form validation
- Zod for schema validation
- Sonner for toast notifications

## Getting Started

### Prerequisites

- Node.js 18 or newer
- Docker and Docker Compose (for running in containers)

### Environment Setup

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

### Running the Application

#### Using Docker (Recommended)

From the project root:

```bash
./scripts/start.sh
```

This will start all services, including the frontend at http://localhost:3000.

#### Development Mode

For local development:

```bash
npm install
npm run dev
```

## Project Structure

```
FrontEnd/
├── Dockerfile              # Docker configuration
├── src/
│   ├── assets/             # Static assets like images
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # shadcn components
│   ├── context/            # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── pages/              # Page components
│   ├── services/           # API service calls
│   └── App.tsx             # Main application component
├── public/                 # Public assets
├── .env.example            # Example environment variables
└── package.json            # Dependencies and scripts
```

## Authentication

The application uses BetterAuth for secure authentication with:

- Secure JWT token management
- Session tracking and management
- Token refresh logic
- Protected routes

## API Integration

The application interfaces with:

- Backend API: http://localhost:8000
- Auth Service: http://localhost:4000/api/auth

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `npm run preview`: Preview production build locally

## Contributing

1. Follow the project folder structure
2. Adhere to the TypeScript and ESLint rules
3. Test thoroughly before submitting changes
4. Make sure components are responsive and accessible

## ESLint Configuration

The project uses a modern ESLint setup for React and TypeScript:

```js
export default tseslint.config({
  extends: [
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
  plugins: {
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
})
```