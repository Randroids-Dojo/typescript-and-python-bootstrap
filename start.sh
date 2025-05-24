#!/bin/bash

echo "Starting Bootstrap App..."
echo "========================"
echo ""
echo "Building and starting all services with Docker Compose..."
echo ""

# Start services in detached mode
docker-compose up --build -d

# Wait for auth-service to be ready
echo "Waiting for auth-service to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if docker ps | grep -q "typescript-and-python-bootstrap-auth-service-1" && \
     docker exec typescript-and-python-bootstrap-auth-service-1 ls &>/dev/null; then
    echo "Auth service is ready."
    break
  fi
  
  echo "Waiting for auth-service to be ready... ($((RETRY_COUNT+1))/$MAX_RETRIES)"
  RETRY_COUNT=$((RETRY_COUNT+1))
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ Error: Auth service did not start within the expected time."
  echo "Running docker-compose logs to help diagnose the issue:"
  docker-compose logs
  exit 1
fi

# Run migrations
echo ""
echo "Running database migrations..."
if docker exec typescript-and-python-bootstrap-auth-service-1 npx tsx src/migrate.ts; then
  echo "✅ Database migrations completed successfully."
else
  echo "❌ Error: Database migrations failed."
  echo "Running docker-compose logs to help diagnose the issue:"
  docker-compose logs
  exit 1
fi

# Show logs after migrations
echo ""
echo "All services started and database initialized successfully."
echo "Showing logs from all containers (press Ctrl+C to stop viewing logs):"
echo ""

# Show logs (this will attach to the containers and show logs)
docker-compose logs -f

echo ""
echo "Services stopped."
