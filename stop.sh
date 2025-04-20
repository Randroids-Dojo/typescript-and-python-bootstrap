#!/bin/bash
cd "$(dirname "$0")/myapp"
docker compose down
echo "Application stopped."
