#!/bin/bash

# LocalStack initialization script
# This script runs when LocalStack is ready

echo "🚀 LocalStack initialization started..."

# Wait a moment for LocalStack to be fully ready
sleep 2

# Create the S3 bucket if it doesn't exist
echo "📦 Creating S3 bucket: cafe-server-dev-bucket"
awslocal s3 mb s3://cafe-server-dev-bucket 2>/dev/null || echo "Bucket already exists"

# Set bucket policy for public read if needed
echo "🔒 Setting up bucket permissions..."
awslocal s3api put-bucket-acl --bucket cafe-server-dev-bucket --acl private

# List buckets to verify
echo "📋 Available S3 buckets:"
awslocal s3 ls

echo "✅ LocalStack S3 initialization completed!"

# Keep the script running to show logs
tail -f /dev/null
