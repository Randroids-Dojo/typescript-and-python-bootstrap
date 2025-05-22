#!/bin/bash

echo "Starting Bootstrap App..."
echo "========================"
echo ""
echo "Building and starting all services with Docker Compose..."
echo ""

# Start services
docker-compose up --build

echo ""
echo "Services stopped."