#!/bin/bash

# Start the full stack Hello World application
echo "Starting the Hello World Full Stack application..."
cd "$(dirname "$0")"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

# Start the application with Docker Compose
echo "Starting containers..."
docker-compose -f myapp/docker-compose.yml up -d

# Wait for services to initialize
echo "Waiting for services to initialize..."
sleep 5

# Check service health
echo "Checking service health..."
echo "Backend health check:"
curl -s http://localhost:8001/health | grep -q "OK" && echo "  ✅ Backend is healthy" || echo "  ❌ Backend is not responding"

echo "Auth service health check:"
curl -s http://localhost:4000/health | grep -q "OK" && echo "  ✅ Auth service is healthy" || echo "  ❌ Auth service is not responding"

echo "Frontend check:"
curl -Is http://localhost:3001 | grep -q "200 OK" && echo "  ✅ Frontend is available" || echo "  ❌ Frontend is not responding"

echo ""
echo "Your application is now running!"
echo "  - Main Application: http://localhost:3001"
echo "  - Direct Sign-Up Page: http://localhost:3001/sign-up"
echo "  - Authentication URLs:"
echo "    - Sign Up: http://localhost:3001/auth/signUp"
echo "    - Sign In: http://localhost:3001/auth/signIn"
echo "  - Backend API: http://localhost:8001"
echo "  - Auth Service: http://localhost:4000"
echo ""
echo "Getting Started:"
echo "  1. Visit http://localhost:3001 and click 'Create Account' or 'Sign In'"
echo "  2. After signing in, you can access protected routes like /dashboard"
echo ""
echo "To view logs, run: docker-compose -f myapp/docker-compose.yml logs -f"
echo "To stop the application, run: docker-compose -f myapp/docker-compose.yml down"