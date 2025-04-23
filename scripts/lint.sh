#!/bin/bash

echo "Checking code style and quality..."

# Frontend linting
echo "Linting Frontend..."
docker compose run --rm frontend npm run lint

# Backend linting
echo "Linting Backend..."
docker compose run --rm backend python run_lint.py

# Auth linting
echo "Linting Auth..."
docker compose run --rm auth npm run lint

echo "All linting checks completed."
