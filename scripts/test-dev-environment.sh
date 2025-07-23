#!/bin/bash

# Development Environment Test Script
# This script tests the complete development setup

echo "🧪 Testing Development Environment Setup"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    local endpoint=$3
    
    echo -n "Checking $service_name (port $port)... "
    
    if curl -f -s "$endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e "${RED}✗ Not running${NC}"
        return 1
    fi
}

# Function to check Docker service
check_docker_service() {
    local service_name=$1
    
    echo -n "Checking Docker service: $service_name... "
    
    if docker-compose -f docker-compose.dev.yml ps | grep -q "$service_name.*Up"; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e "${RED}✗ Not running${NC}"
        return 1
    fi
}

echo ""
echo "1. Checking Docker Services"
echo "---------------------------"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ docker-compose not found${NC}"
    exit 1
fi

# Check individual Docker services
check_docker_service "cafe-postgres-dev"
POSTGRES_STATUS=$?

check_docker_service "cafe-localstack"
LOCALSTACK_STATUS=$?

check_docker_service "cafe-server-dev"
APP_STATUS=$?

echo ""
echo "2. Checking Service Endpoints"
echo "-----------------------------"

# Check PostgreSQL
echo -n "Checking PostgreSQL connection... "
if docker exec cafe-postgres-dev pg_isready -U cafe_user -d cafe_server_dev > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connected${NC}"
    POSTGRES_CONN=0
else
    echo -e "${RED}✗ Connection failed${NC}"
    POSTGRES_CONN=1
fi

# Check LocalStack S3
check_service "LocalStack S3" "4566" "http://localhost:4566/_localstack/health"
LOCALSTACK_HEALTH=$?

# Check Application
check_service "Application" "3000" "http://localhost:3000/"
APP_HEALTH=$?

echo ""
echo "3. Testing S3 Operations"
echo "------------------------"

# Test S3 bucket operations
echo -n "Testing S3 bucket operations... "
if aws --endpoint-url=http://localhost:4566 s3 ls s3://cafe-server-dev-bucket > /dev/null 2>&1; then
    echo -e "${GREEN}✓ S3 bucket accessible${NC}"
    S3_OPS=0
else
    echo -e "${RED}✗ S3 bucket not accessible${NC}"
    S3_OPS=1
fi

echo ""
echo "4. Testing API Endpoints"
echo "------------------------"

if [ $APP_HEALTH -eq 0 ]; then
    # Test file upload endpoint
    echo -n "Testing upload URL generation... "
    UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:3000/api/s3/upload-url \
      -H "Content-Type: application/json" \
      -d '{
        "fileName": "test.txt",
        "fileType": "text/plain",
        "fileSize": 100,
        "description": "Test file"
      }')
    
    if echo "$UPLOAD_RESPONSE" | grep -q "uploadUrl"; then
        echo -e "${GREEN}✓ Working${NC}"
        API_UPLOAD=0
    else
        echo -e "${RED}✗ Failed${NC}"
        API_UPLOAD=1
    fi
    
    # Test file listing endpoint
    echo -n "Testing file listing... "
    if curl -f -s http://localhost:3000/api/s3/files > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Working${NC}"
        API_LIST=0
    else
        echo -e "${RED}✗ Failed${NC}"
        API_LIST=1
    fi
    
    # Test storage stats endpoint
    echo -n "Testing storage stats... "
    if curl -f -s http://localhost:3000/api/s3/stats > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Working${NC}"
        API_STATS=0
    else
        echo -e "${RED}✗ Failed${NC}"
        API_STATS=1
    fi
else
    echo -e "${YELLOW}⚠ Skipping API tests (application not running)${NC}"
    API_UPLOAD=1
    API_LIST=1
    API_STATS=1
fi

echo ""
echo "5. Database Schema Check"
echo "------------------------"

if [ $POSTGRES_CONN -eq 0 ]; then
    echo -n "Checking database tables... "
    TABLES=$(docker exec cafe-postgres-dev psql -U cafe_user -d cafe_server_dev -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null | wc -l)
    
    if [ "$TABLES" -gt 0 ]; then
        echo -e "${GREEN}✓ Tables found ($TABLES)${NC}"
        DB_SCHEMA=0
    else
        echo -e "${YELLOW}⚠ No tables found (run 'npm run db:push')${NC}"
        DB_SCHEMA=1
    fi
else
    echo -e "${YELLOW}⚠ Skipping database schema check${NC}"
    DB_SCHEMA=1
fi

echo ""
echo "📊 Test Results Summary"
echo "======================="

# Calculate overall status
TOTAL_TESTS=9
PASSED_TESTS=0

[ $POSTGRES_STATUS -eq 0 ] && ((PASSED_TESTS++))
[ $LOCALSTACK_STATUS -eq 0 ] && ((PASSED_TESTS++))
[ $APP_STATUS -eq 0 ] && ((PASSED_TESTS++))
[ $POSTGRES_CONN -eq 0 ] && ((PASSED_TESTS++))
[ $LOCALSTACK_HEALTH -eq 0 ] && ((PASSED_TESTS++))
[ $APP_HEALTH -eq 0 ] && ((PASSED_TESTS++))
[ $S3_OPS -eq 0 ] && ((PASSED_TESTS++))
[ $API_UPLOAD -eq 0 ] && ((PASSED_TESTS++))
[ $API_LIST -eq 0 ] && ((PASSED_TESTS++))

echo "Tests passed: $PASSED_TESTS/$TOTAL_TESTS"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎉 All tests passed! Development environment is ready.${NC}"
    exit 0
elif [ $PASSED_TESTS -gt 5 ]; then
    echo -e "${YELLOW}⚠ Most tests passed. Check failing services above.${NC}"
    exit 1
else
    echo -e "${RED}❌ Multiple tests failed. Please check your setup.${NC}"
    exit 1
fi
