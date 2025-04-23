#!/bin/bash

echo "Running tests for all services..."

# Run frontend tests
echo "Running Frontend tests..."
docker-compose run --rm frontend npm test

# Run backend tests
echo "Running Backend tests..."
docker-compose run --rm backend pytest

# Run auth tests
echo "Running Auth tests..."
docker-compose run --rm auth npm test

echo "All tests completed."
