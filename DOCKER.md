# Docker Setup for Cafe Server

This document explains how to run the Cafe Server using Docker and Docker Compose.

## Prerequisites

- Docker
- Docker Compose
- `.env` file with required environment variables

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=your-bucket-name

# Database Configuration (for development)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=cafe_server_dev
DB_USER=cafe_user
DB_PASSWORD=cafe_password

# pgAdmin Configuration (optional)
PGADMIN_EMAIL=admin@cafe.local
PGADMIN_PASSWORD=admin123
```

You can use `.env.example` as a template.

## Quick Start

### Production Mode

```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f cafe-server

# Stop the application
docker-compose down
```

### Development Mode

```bash
# Start in development mode with hot reloading
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Or use the development-specific compose file
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f cafe-server-dev
```

### Development Mode with Database

```bash
# Start in development mode with PostgreSQL
docker-compose -f docker-compose.dev.yml up -d

# Start with pgAdmin for database management
docker-compose -f docker-compose.dev.yml --profile pgadmin up -d

# View logs
docker-compose logs -f cafe-server-dev
```

### Development Mode with LocalStack (for local AWS S3 testing)

### Development Mode with All Services

```bash
# Start with all services (app, database, pgAdmin, and LocalStack)
docker-compose -f docker-compose.dev.yml --profile pgadmin --profile localstack up -d

# This will start the application, PostgreSQL, pgAdmin, and LocalStack S3 service
```

## Available Commands

### Build Commands

```bash
# Build the production image
docker-compose build

# Build the development image
docker-compose -f docker-compose.dev.yml build

# Force rebuild without cache
docker-compose build --no-cache
```

### Management Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View running containers
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Execute commands in running container
docker-compose exec cafe-server bash
```

## Services

### cafe-server (Production)
- **Port**: 3000
- **Environment**: Production
- **Features**: Optimized build, security hardening
- **Health Check**: Enabled

### cafe-server-dev (Development)
- **Port**: 3000
- **Environment**: Development
- **Features**: Hot reloading, source code mounting
- **Health Check**: Enabled
- **Dependencies**: PostgreSQL

### postgres (Development)
- **Port**: 5432
- **Database**: cafe_server_dev
- **User**: cafe_user
- **Features**: Data persistence, health checks
- **Initialization**: Custom scripts in `docker/postgres/init/`

### pgadmin (Optional)
- **Port**: 8080
- **Purpose**: Database management interface
- **Profile**: `pgadmin`
- **Default Login**: admin@cafe.local / admin123

### localstack (Optional)
- **Port**: 4566
- **Purpose**: Local AWS services for testing
- **Services**: S3
- **Profile**: `localstack`

## File Structure

```
├── Dockerfile              # Production Docker image
├── Dockerfile.dev          # Development Docker image
├── docker-compose.yml      # Production compose configuration
├── docker-compose.dev.yml  # Development compose configuration
├── docker-compose.override.yml # Development overrides
├── .dockerignore           # Files to exclude from Docker build
└── DOCKER.md              # This file
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using port 3000
   lsof -i :3000
   
   # Kill the process or change the port in docker-compose.yml
   ```

2. **Environment Variables Not Loading**
   - Ensure `.env` file exists in the root directory
   - Check that variable names match exactly
   - Restart containers after changing `.env`

3. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

4. **Container Won't Start**
   ```bash
   # Check logs for errors
   docker-compose logs cafe-server
   
   # Check container status
   docker-compose ps
   ```

### Database Management

```bash
# Connect to PostgreSQL from host
psql -h localhost -p 5432 -U cafe_user -d cafe_server_dev

# Execute SQL commands in container
docker-compose exec postgres psql -U cafe_user -d cafe_server_dev

# Backup database
docker-compose exec postgres pg_dump -U cafe_user cafe_server_dev > backup.sql

# Restore database
docker-compose exec -T postgres psql -U cafe_user -d cafe_server_dev < backup.sql

# Access pgAdmin web interface
# Open http://localhost:8080 in your browser
# Login with: admin@cafe.local / admin123
```

### Debugging

```bash
# Enter running container
docker-compose exec cafe-server sh

# Run container interactively
docker-compose run --rm cafe-server sh

# Check environment variables inside container
docker-compose exec cafe-server env
```

## Production Deployment

For production deployment, consider:

1. **Security**
   - Use secrets management instead of `.env` files
   - Run containers as non-root user (already configured)
   - Keep base images updated

2. **Performance**
   - Use multi-stage builds for smaller images
   - Configure resource limits
   - Set up proper logging

3. **Monitoring**
   - Health checks are already configured
   - Consider adding metrics endpoints
   - Set up log aggregation

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [LocalStack Documentation](https://docs.localstack.cloud/)
