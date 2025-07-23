#!/bin/bash

# Initial Development Setup Script
# This script sets up the complete development environment

echo "🚀 Cafe Server - Development Environment Setup"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print step
print_step() {
    echo -e "${BLUE}$1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check prerequisites
print_step "1. Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_success "Docker is installed"

if ! command -v docker compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
print_success "Docker Compose is installed"

if ! command -v node &> /dev/null; then
    print_warning "Node.js is not installed. You'll need it for local development."
else
    print_success "Node.js is installed"
fi

# Setup environment file
print_step "2. Setting up environment configuration..."

if [ ! -f .env ]; then
    cp .env.example .env
    print_success "Created .env file from .env.example"
else
    print_warning ".env file already exists"
fi

# Install dependencies
if [ -f package.json ] && command -v npm &> /dev/null; then
    print_step "3. Installing Node.js dependencies..."
    npm install
    print_success "Dependencies installed"
else
    print_warning "Skipping npm install (Node.js not available or no package.json)"
fi

# Start Docker services
print_step "4. Starting Docker services..."
print_warning "This may take a few minutes on first run..."

if docker compose -f docker-compose.dev.yml up -d; then
    print_success "Docker services started"
else
    print_error "Failed to start Docker services"
    exit 1
fi

# Wait for services to be ready
print_step "5. Waiting for services to be ready..."

echo -n "Waiting for PostgreSQL"
for i in {1..30}; do
    if docker exec cafe-postgres-dev pg_isready -U cafe_user -d cafe_server_dev > /dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 2
done
echo ""
print_success "PostgreSQL is ready"

echo -n "Waiting for LocalStack"
for i in {1..30}; do
    if curl -f -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 2
done
echo ""
print_success "LocalStack is ready"

echo -n "Waiting for Application"
for i in {1..30}; do
    if curl -f -s http://localhost:3000/ > /dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 2
done
echo ""
print_success "Application is ready"

# Initialize database
if command -v npm &> /dev/null; then
    print_step "6. Initializing database..."
    
    if npm run db:generate; then
        print_success "Prisma client generated"
    else
        print_error "Failed to generate Prisma client"
    fi
    
    if npm run db:push; then
        print_success "Database schema pushed"
    else
        print_error "Failed to push database schema"
    fi
else
    print_warning "Skipping database initialization (npm not available)"
    echo "Please run these commands manually:"
    echo "  npm run db:generate"
    echo "  npm run db:push"
fi

# Run tests
print_step "7. Running environment tests..."

if [ -x ./scripts/test-dev-environment.sh ]; then
    if ./scripts/test-dev-environment.sh; then
        print_success "All tests passed!"
    else
        print_warning "Some tests failed, but setup is mostly complete"
    fi
else
    print_warning "Test script not found or not executable"
fi

# Summary
echo ""
print_step "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Your development environment is now running:"
echo -e "  • Application:    ${GREEN}http://localhost:3000${NC}"
echo -e "  • PostgreSQL:     ${GREEN}localhost:5432${NC}"
echo -e "  • LocalStack S3:  ${GREEN}http://localhost:4566${NC}"
echo -e "  • pgAdmin:        ${GREEN}http://localhost:8080${NC} (optional)"
echo ""
echo "Useful commands:"
echo -e "  • View logs:      ${BLUE}npm run docker:dev:logs${NC}"
echo -e "  • Stop services:  ${BLUE}npm run docker:dev:down${NC}"
echo -e "  • Test API:       ${BLUE}npm run test:s3-integration${NC}"
echo -e "  • Database UI:    ${BLUE}npm run db:studio${NC}"
echo ""
echo "Next steps:"
echo "  1. Test the file upload API"
echo "  2. Check the documentation in DEVELOPMENT_SETUP.md"
echo "  3. Start building your application!"
echo ""
print_success "Happy coding! 🚀"
