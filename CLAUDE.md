# Claude Agent Configuration

This file contains instructions for Claude to help maintain this project.

## Commands to Run

When working on this project, these commands should be run to ensure code quality:

### Linting
```bash
./scripts/lint.sh
```

### Testing
```bash
./scripts/test.sh
```

### Starting all services
```bash
./scripts/start.sh
```

### Stopping all services
```bash
./scripts/stop.sh
```

## Development Guidelines

1. All service development must be done using Docker Compose
2. Use the provided scripts for testing, linting, and running services
3. Follow the structure defined in each service's claude.md file
4. Ensure proper integration between services using the defined endpoints