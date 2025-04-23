#!/bin/bash

echo "Starting all services..."
docker compose up -d

echo "Services started:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8000"
echo "- Auth Service: http://localhost:4000/api/auth"
