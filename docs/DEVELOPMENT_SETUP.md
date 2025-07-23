# Development Environment Setup Guide

This guide will help you set up the complete development environment using Docker Compose with PostgreSQL and LocalStack (S3 simulation).

## 🏗️ Architecture Overview

**Development Stack:**
- **Application**: Node.js/Express with TypeScript
- **Database**: PostgreSQL (Docker container)
- **File Storage**: LocalStack S3 simulation (Docker container)
- **Database Admin**: pgAdmin (optional, Docker container)

**Production Stack:**
- **Application**: Same Node.js/Express app
- **Database**: AWS RDS PostgreSQL
- **File Storage**: AWS S3

## 🚀 Quick Start

### 1. Prerequisites

Ensure you have installed:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (for local development without Docker)

### 2. Initial Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd cafe-server

# Copy environment configuration
npm run setup:dev
# This creates .env from .env.example

# Edit .env if needed (default values work for Docker setup)
nano .env
```

### 3. Start Development Environment

```bash
# Start all services (PostgreSQL, LocalStack, Application)
npm run docker:dev

# Or manually with docker-compose
docker-compose -f docker-compose.dev.yml up --build
```

This will start:
- **PostgreSQL** on `localhost:5432`
- **LocalStack S3** on `localhost:4566`
- **Application** on `localhost:3000`
- **pgAdmin** on `localhost:8080` (optional, use `--profile pgadmin`)

### 4. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

### 5. Test the Setup

```bash
# Test S3-Prisma integration
npm run test:s3-integration

# Check LocalStack health
npm run localstack:health

# Check application health
curl http://localhost:3000/
```

## 🐳 Docker Services

### Application Service (`cafe-server-dev`)
- **Port**: 3000
- **Hot Reload**: Enabled with volume mounts
- **Environment**: Configured for LocalStack and PostgreSQL
- **Health Check**: HTTP check on port 3000

### PostgreSQL Service (`postgres`)
- **Port**: 5432
- **Database**: `cafe_server_dev`
- **User**: `cafe_user`
- **Password**: `cafe_password`
- **Volume**: Persistent data storage
- **Health Check**: pg_isready check

### LocalStack Service (`localstack`)
- **Port**: 4566 (main LocalStack port)
- **Services**: S3 only
- **Bucket**: `cafe-server-dev-bucket` (auto-created)
- **Credentials**: `test/test` (LocalStack default)
- **Health Check**: LocalStack health endpoint

### S3 Setup Service (`s3-setup`)
- **Purpose**: Initialize S3 bucket and CORS policy
- **Runs**: Once after LocalStack is healthy
- **Creates**: Development S3 bucket with proper configuration

## 🔧 Configuration Details

### Environment Variables

The application uses different configurations for development and production:

#### Development (LocalStack)
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_BUCKET_NAME=cafe-server-dev-bucket
AWS_ENDPOINT_URL=http://localhost:4566
AWS_S3_FORCE_PATH_STYLE=true
```

#### Production (Real AWS)
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-real-access-key
AWS_SECRET_ACCESS_KEY=your-real-secret-key
AWS_S3_BUCKET_NAME=your-production-bucket
# Remove AWS_ENDPOINT_URL and AWS_S3_FORCE_PATH_STYLE
```

### Database Configuration

#### Development (Docker PostgreSQL)
```env
DATABASE_URL=postgresql://cafe_user:cafe_password@localhost:5432/cafe_server_dev
```

#### Production (AWS RDS)
```env
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/database_name
```

## 📝 Available Scripts

### Docker Management
```bash
npm run docker:dev           # Start all services
npm run docker:dev:down      # Stop all services
npm run docker:dev:logs      # View logs from all services
npm run docker:dev:reset     # Reset all data and restart
```

### Database Operations
```bash
npm run db:generate          # Generate Prisma client
npm run db:push             # Push schema to database
npm run db:migrate          # Run database migrations
npm run db:reset            # Reset database
npm run db:studio           # Open Prisma Studio
```

### Development Tools
```bash
npm run dev                 # Start app locally (requires local DB)
npm run test:s3-integration # Test S3-Prisma integration
npm run localstack:health   # Check LocalStack status
```

## 🔍 Debugging and Troubleshooting

### Check Service Status
```bash
# View logs from all services
docker-compose -f docker-compose.dev.yml logs

# View logs from specific service
docker-compose -f docker-compose.dev.yml logs cafe-server-dev
docker-compose -f docker-compose.dev.yml logs postgres
docker-compose -f docker-compose.dev.yml logs localstack
```

### Common Issues

#### 1. Port Conflicts
If ports 3000, 5432, or 4566 are already in use:
```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :5432
sudo lsof -i :4566

# Stop conflicting services or modify ports in docker-compose.dev.yml
```

#### 2. Database Connection Issues
```bash
# Reset database volume
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up postgres

# Check database logs
docker-compose -f docker-compose.dev.yml logs postgres
```

#### 3. LocalStack S3 Issues
```bash
# Check LocalStack health
curl http://localhost:4566/_localstack/health

# List S3 buckets
aws --endpoint-url=http://localhost:4566 s3 ls

# Reset LocalStack data
docker-compose -f docker-compose.dev.yml restart localstack
```

#### 4. Application Won't Start
```bash
# Check application logs
docker-compose -f docker-compose.dev.yml logs cafe-server-dev

# Rebuild application
docker-compose -f docker-compose.dev.yml up --build cafe-server-dev
```

### Test Individual Components

#### Test Database Connection
```bash
# Connect to PostgreSQL directly
docker exec -it cafe-postgres-dev psql -U cafe_user -d cafe_server_dev

# Run a test query
SELECT version();
```

#### Test S3 Connection
```bash
# Using AWS CLI with LocalStack
aws --endpoint-url=http://localhost:4566 s3 ls s3://cafe-server-dev-bucket

# Test file upload
echo "test content" | aws --endpoint-url=http://localhost:4566 s3 cp - s3://cafe-server-dev-bucket/test.txt
```

## 🌐 Accessing Services

### Application
- **URL**: http://localhost:3000
- **Health Check**: http://localhost:3000/
- **API Base**: http://localhost:3000/api

### Database
- **Host**: localhost
- **Port**: 5432
- **Database**: cafe_server_dev
- **Username**: cafe_user
- **Password**: cafe_password

### pgAdmin (Optional)
```bash
# Start with pgAdmin
docker-compose -f docker-compose.dev.yml --profile pgadmin up

# Access pgAdmin
# URL: http://localhost:8080
# Email: admin@cafe.local
# Password: admin123
```

### LocalStack S3
- **Endpoint**: http://localhost:4566
- **Console**: http://localhost:4566/_localstack/health
- **Bucket**: cafe-server-dev-bucket

## 🚀 API Testing

### Test File Upload Flow
```bash
# 1. Request upload URL
curl -X POST http://localhost:3000/api/s3/upload-url \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.txt",
    "fileType": "text/plain",
    "fileSize": 100,
    "description": "Test file"
  }'

# 2. Upload file to presigned URL (use URL from step 1)
curl -X PUT "PRESIGNED_URL_FROM_STEP_1" \
  -H "Content-Type: text/plain" \
  -d "Hello, LocalStack!"

# 3. Confirm upload (use fileId from step 1)
curl -X POST http://localhost:3000/api/s3/confirm-upload \
  -H "Content-Type: application/json" \
  -d '{"fileId": "FILE_ID_FROM_STEP_1"}'

# 4. List files
curl http://localhost:3000/api/s3/files
```

## 📊 Production Deployment

When deploying to production:

1. **Update Environment Variables**:
   - Use real AWS credentials and RDS connection string
   - Remove LocalStack-specific variables

2. **Database Setup**:
   - Create RDS PostgreSQL instance
   - Run migrations: `npm run db:migrate`

3. **S3 Setup**:
   - Create production S3 bucket
   - Configure proper IAM policies
   - Set up CORS if needed for frontend uploads

4. **Application Deployment**:
   - Build: `npm run build`
   - Start: `npm start`

## 🔒 Security Notes

### Development Environment
- Uses test credentials for LocalStack
- Database has simple passwords
- All services run without TLS

### Production Environment
- Use strong, unique passwords
- Enable SSL/TLS for database connections
- Use IAM roles with minimal required permissions
- Enable S3 bucket encryption
- Set up proper VPC and security groups

## 📈 Monitoring and Logging

### Development Logs
```bash
# Application logs
docker-compose -f docker-compose.dev.yml logs -f cafe-server-dev

# Database logs
docker-compose -f docker-compose.dev.yml logs -f postgres

# S3 (LocalStack) logs
docker-compose -f docker-compose.dev.yml logs -f localstack
```

### Production Monitoring
- Set up CloudWatch for application and RDS monitoring
- Configure S3 access logging
- Use application performance monitoring (APM) tools
- Set up health checks and alerting

This setup provides a complete development environment that closely mirrors production while being easy to set up and manage locally.
