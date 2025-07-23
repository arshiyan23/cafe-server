# 🐳 Docker Development Environment - Complete Setup

## 🎯 What's Been Configured

Your development environment now includes a complete Docker Compose setup that provides:

### 🏗️ **Infrastructure Services**
- **PostgreSQL Database**: Persistent storage with health checks
- **LocalStack S3**: Complete S3 API simulation
- **pgAdmin**: Database management interface (optional)
- **Application Server**: Hot-reload Node.js/Express app

### 🔧 **Development Features**
- **S3-Prisma Integration**: Files stored in PostgreSQL with S3 for binaries
- **Folder Organization**: Hierarchical file structure
- **Advanced Search**: Filter by name, type, folder, tags, dates
- **Hot Reload**: Instant code changes without restart
- **Health Monitoring**: All services include health checks
- **Comprehensive Testing**: Integration test suites

## 🚀 **Quick Start Commands**

```bash
# 🏃‍♂️ One-command setup (recommended)
npm run setup:dev

# 🐳 Manual Docker commands
npm run docker:dev          # Start all services
npm run docker:dev:down     # Stop all services
npm run docker:dev:logs     # View all logs
npm run docker:dev:reset    # Reset data and restart

# 🗄️ Database commands
npm run db:generate         # Generate Prisma client
npm run db:push            # Push schema to database
npm run db:studio          # Open Prisma Studio

# 🧪 Testing commands
npm run test:dev-environment    # Test complete setup
npm run test:s3-integration    # Test S3-Prisma integration
npm run localstack:health      # Check LocalStack status
```

## 📊 **Service Overview**

| Service | Port | Purpose | Health Check |
|---------|------|---------|--------------|
| **cafe-server-dev** | 3000 | Main application | HTTP `/` |
| **postgres** | 5432 | PostgreSQL database | `pg_isready` |
| **localstack** | 4566 | S3 simulation | LocalStack health |
| **pgadmin** | 8080 | Database UI (optional) | HTTP check |

## 🔗 **Service URLs**

- **Application**: http://localhost:3000
- **API Base**: http://localhost:3000/api
- **S3 (LocalStack)**: http://localhost:4566
- **pgAdmin**: http://localhost:8080 (with `--profile pgadmin`)
- **Database**: localhost:5432

## 📋 **Environment Configuration**

### Development (Auto-configured)
```env
# Database
DATABASE_URL=postgresql://cafe_user:cafe_password@localhost:5432/cafe_server_dev

# S3 (LocalStack)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_BUCKET_NAME=cafe-server-dev-bucket
AWS_ENDPOINT_URL=http://localhost:4566
AWS_S3_FORCE_PATH_STYLE=true
```

### Production (Manual configuration required)
```env
# Database (AWS RDS)
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/dbname

# S3 (Real AWS)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-real-key
AWS_SECRET_ACCESS_KEY=your-real-secret
AWS_S3_BUCKET_NAME=your-production-bucket
# Remove LocalStack-specific variables
```

## 🎯 **API Endpoints Ready to Use**

### File Operations
```bash
# Request upload URL
POST /api/s3/upload-url
{
  "fileName": "document.pdf",
  "fileType": "application/pdf", 
  "fileSize": 51200,
  "folderId": "optional-folder-id",
  "description": "Optional description",
  "tags": ["tag1", "tag2"]
}

# Confirm upload completion
POST /api/s3/confirm-upload
{ "fileId": "file-uuid" }

# Get download URL
GET /api/s3/download-url/{fileId}?download=true

# Get file information
GET /api/s3/info/{fileId}?includeFolder=true

# List files with filters
GET /api/s3/files?folderId=root&mimeType=image&search=photo&page=1&limit=20

# Delete file
DELETE /api/s3/delete/{fileId}

# Get storage statistics
GET /api/s3/stats?folderId=optional-folder-id
```

### Folder Operations (via storage routes)
```bash
# Create folder
POST /api/storage/folders

# List folders  
GET /api/storage/folders

# Get folder details
GET /api/storage/folders/{id}
```

## 🛠️ **Development Workflow**

### 1. **Initial Setup**
```bash
git clone <your-repo>
cd cafe-server
npm run setup:dev  # One command does everything!
```

### 2. **Daily Development**
```bash
# Start services
npm run docker:dev

# Make code changes (hot reload active)
# Files in src/ automatically restart the app

# Test changes
npm run test:s3-integration

# View logs if needed
npm run docker:dev:logs
```

### 3. **Database Changes**
```bash
# Modify prisma/schema.prisma
# Then push changes
npm run db:push

# Or create migrations
npm run db:migrate
```

### 4. **Troubleshooting**
```bash
# Check all services
npm run test:dev-environment

# Reset everything
npm run docker:dev:reset

# Check specific service logs
docker-compose -f docker-compose.dev.yml logs postgres
docker-compose -f docker-compose.dev.yml logs localstack
docker-compose -f docker-compose.dev.yml logs cafe-server-dev
```

## 📁 **File Structure**

```
cafe-server/
├── docker/
│   ├── localstack/init/     # LocalStack initialization
│   └── s3-setup/           # S3 bucket setup
├── scripts/
│   ├── setup-dev.sh        # Complete setup automation
│   ├── test-dev-environment.sh  # Environment testing
│   └── test-s3-prisma-integration.ts  # API testing
├── src/
│   ├── controllers/s3Controller.ts    # S3-Prisma integration
│   ├── database/           # Prisma services & types
│   └── routes/             # API routes
├── docker-compose.dev.yml  # Development environment
├── docker-compose.prod.yml # Production environment
└── .env.example           # Environment template
```

## 🎉 **Ready Features**

✅ **Complete S3-Prisma Integration**  
✅ **Hierarchical Folder Structure**  
✅ **Advanced File Search & Filtering**  
✅ **Hot Reload Development**  
✅ **Health Monitoring**  
✅ **Comprehensive Testing**  
✅ **Production-Ready Configuration**  
✅ **One-Command Setup**  

## 🔄 **Production Deployment**

When ready for production:

1. **Use production compose**: `docker-compose.prod.yml`
2. **Configure real AWS**: Update environment variables
3. **Set up RDS**: PostgreSQL database service
4. **Deploy to cloud**: Use your preferred platform

The application seamlessly switches between development (LocalStack) and production (real AWS) based on environment variables.

## 📚 **Documentation**

- [DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md) - Detailed setup guide
- [S3_PRISMA_INTEGRATION.md](S3_PRISMA_INTEGRATION.md) - Integration details
- [DOCKER_QUICK_START.md](DOCKER_QUICK_START.md) - Quick reference

Your complete file storage system with PostgreSQL metadata and S3 binary storage is now ready for development! 🚀

**Start coding with**: `npm run setup:dev`
