#!/bin/bash

# Stop the full stack Hello World application
echo "Stopping the Hello World Full Stack application..."
cd "$(dirname "$0")"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

# Stop the application with Docker Compose
echo "Stopping containers..."
docker-compose -f myapp/docker-compose.yml down

echo "Application stopped successfully!"