# 🚀 Quick Start - Docker Development Environment

This project now includes a complete Docker Compose setup for local development with PostgreSQL and LocalStack (S3 simulation).

## ⚡ One-Command Setup

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start everything
npm run docker:dev

# 3. Initialize database (in another terminal)
npm run db:generate && npm run db:push

# 4. Test the setup
npm run test:dev-environment
```

Your development environment is now running:
- **Application**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **LocalStack S3**: http://localhost:4566
- **pgAdmin** (optional): http://localhost:8080

## 🛠️ What's Included

- **PostgreSQL Database**: Persistent storage with pgAdmin interface
- **LocalStack S3**: Complete S3 simulation for file operations
- **Hot Reload**: Code changes automatically restart the application
- **Health Checks**: All services include proper health monitoring
- **Test Scripts**: Comprehensive integration testing

## 📝 Key Commands

```bash
# Start development environment
npm run docker:dev

# View logs from all services
npm run docker:dev:logs

# Stop everything
npm run docker:dev:down

# Reset all data and restart
npm run docker:dev:reset

# Test the complete setup
npm run test:dev-environment

# Test S3-Prisma integration
npm run test:s3-integration
```

## 🔧 Service Configuration

All services are pre-configured for development:

### Database (PostgreSQL)
- **Host**: localhost:5432
- **Database**: cafe_server_dev
- **User**: cafe_user
- **Password**: cafe_password

### File Storage (LocalStack S3)
- **Endpoint**: http://localhost:4566
- **Bucket**: cafe-server-dev-bucket
- **Credentials**: test/test (LocalStack defaults)

### Application
- **Port**: 3000
- **Environment**: Development with hot reload
- **API Base**: http://localhost:3000/api

## 🌟 Features

✅ **Complete S3-Prisma Integration**: Files stored in PostgreSQL with S3 for binaries  
✅ **Folder Organization**: Hierarchical file structure  
✅ **Advanced Search**: Filter by name, type, folder, tags  
✅ **Hot Reload**: Instant code changes  
✅ **Health Monitoring**: All services monitored  
✅ **Test Suite**: Comprehensive integration tests  
✅ **Production Ready**: Easy deployment configuration  

## 📚 Documentation

- [Complete Development Setup Guide](DEVELOPMENT_SETUP.md)
- [S3-Prisma Integration Guide](S3_PRISMA_INTEGRATION.md)
- [API Documentation](API_DOCS.md)

## 🐛 Troubleshooting

**Port conflicts?**
```bash
sudo lsof -i :3000  # Check what's using port 3000
sudo lsof -i :5432  # Check PostgreSQL port
sudo lsof -i :4566  # Check LocalStack port
```

**Services not starting?**
```bash
npm run docker:dev:logs  # Check logs
npm run docker:dev:reset  # Reset everything
```

**Database issues?**
```bash
npm run db:reset  # Reset database schema
npm run db:studio  # Open Prisma Studio
```

**S3 issues?**
```bash
npm run localstack:health  # Check LocalStack
aws --endpoint-url=http://localhost:4566 s3 ls  # List buckets
```

## 🚀 Production Deployment

For production deployment:

1. Use `docker-compose.prod.yml`
2. Configure real AWS credentials
3. Set up RDS PostgreSQL
4. Update environment variables

See [DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md) for detailed production deployment instructions.

## 🎯 Next Steps

1. Start the development environment: `npm run docker:dev`
2. Initialize the database: `npm run db:push`
3. Test the integration: `npm run test:s3-integration`
4. Start building your application!

The complete file storage system with PostgreSQL metadata and S3 binary storage is ready to use! 🎉
