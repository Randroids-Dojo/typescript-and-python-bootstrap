#!/bin/bash
cd "$(dirname "$0")/myapp"
docker compose up -d
echo "Application started! Available at:"
echo "- Frontend: http://localhost:3001"
echo "- Backend API: http://localhost:8001"
echo "- Auth Service: http://localhost:4000/api/auth"
echo ""
echo "Run ./stop.sh to stop the application"
