# S3-Prisma Integration Guide

This document explains how the S3 controller has been integrated with the Prisma database to provide a comprehensive file storage solution that combines the benefits of S3 for binary storage with PostgreSQL for rich metadata and organization.

## Overview

The updated architecture provides:

- **Database-driven metadata**: All file information is stored in PostgreSQL
- **Hierarchical organization**: Files can be organized in nested folders
- **Rich search capabilities**: Search by name, type, tags, size, dates
- **Data consistency**: S3 and database operations are coordinated
- **Type safety**: Full TypeScript integration throughout

## Architecture Changes

### Before (Old Approach)
- File metadata stored in S3 object metadata
- Limited search and filtering capabilities
- No folder organization
- Metadata retrieval required S3 API calls

### After (New Approach)
- File metadata stored in PostgreSQL with full CRUD operations
- Rich search, filtering, and pagination
- Hierarchical folder structure with unlimited nesting
- Fast metadata queries without S3 calls
- S3 used purely for binary storage with organized paths

## Database Schema

The integration uses two main models:

### Folder Model
```prisma
model Folder {
  id          String   @id @default(uuid())
  name        String
  description String?
  parentId    String?  // Self-referencing for hierarchy
  parent      Folder?  @relation("FolderHierarchy")
  children    Folder[] @relation("FolderHierarchy")
  files       File[]   @relation("FolderFiles")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### File Model
```prisma
model File {
  id           String   @id @default(uuid())
  name         String   // Original filename
  storagePath  String   @unique // S3 key/path
  mimeType     String
  size         Int
  checksum     String?  // For integrity verification
  folderId     String?  // Optional folder association
  folder       Folder?  @relation("FolderFiles")
  description  String?
  tags         String[] // Array of tags
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

## API Endpoints

### File Upload Process

#### 1. Request Upload URL
```http
POST /api/s3/upload-url
Content-Type: application/json

{
  "fileName": "document.pdf",
  "fileType": "application/pdf",
  "fileSize": 51200,
  "folderId": "folder-uuid-here",  // optional
  "description": "Important document",  // optional
  "tags": ["work", "contracts"]  // optional
}
```

**Response:**
```json
{
  "uploadUrl": "https://s3.amazonaws.com/bucket/presigned-url",
  "fileId": "file-uuid",
  "key": "folders/folder-id/timestamp-uuid.pdf",
  "originalFileName": "document.pdf",
  "expiresIn": 900,
  "instructions": {
    "method": "PUT",
    "headers": { "Content-Type": "application/pdf" }
  }
}
```

#### 2. Upload File to S3
```http
PUT {uploadUrl}
Content-Type: application/pdf

[binary file data]
```

#### 3. Confirm Upload Completion
```http
POST /api/s3/confirm-upload
Content-Type: application/json

{
  "fileId": "file-uuid-from-step-1"
}
```

**Response:**
```json
{
  "message": "Upload confirmed and file metadata updated",
  "file": {
    "id": "file-uuid",
    "name": "document.pdf",
    "size": 51200,
    "checksum": "abc123...",
    "createdAt": "2025-01-20T10:00:00Z"
  }
}
```

### File Download

#### Get Download URL
```http
GET /api/s3/download-url/{fileId}?download=true
```

**Response:**
```json
{
  "downloadUrl": "https://s3.amazonaws.com/bucket/presigned-download-url",
  "file": {
    "id": "file-uuid",
    "name": "document.pdf",
    "size": 51200,
    "mimeType": "application/pdf",
    "description": "Important document",
    "tags": ["work", "contracts"]
  },
  "expiresIn": 3600,
  "downloadType": "attachment"
}
```

### File Information

#### Get File Details
```http
GET /api/s3/info/{fileId}?includeFolder=true
```

**Response:**
```json
{
  "file": {
    "id": "file-uuid",
    "name": "document.pdf",
    "storagePath": "folders/folder-id/timestamp-uuid.pdf",
    "mimeType": "application/pdf",
    "size": 51200,
    "checksum": "abc123...",
    "description": "Important document",
    "tags": ["work", "contracts"],
    "folder": {
      "id": "folder-uuid",
      "name": "Work Documents",
      "description": "Work-related files"
    },
    "createdAt": "2025-01-20T10:00:00Z",
    "updatedAt": "2025-01-20T10:05:00Z"
  },
  "s3Verification": {
    "exists": true,
    "s3Size": 51200,
    "s3LastModified": "2025-01-20T10:05:00Z"
  }
}
```

### File Listing and Search

#### List Files with Filters
```http
GET /api/s3/files?folderId={id}&mimeType=image&search=photo&page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)
- `folderId`: Filter by folder ID ("root" for root level)
- `mimeType`: Filter by MIME type (partial match)
- `search`: Search in file names (case-insensitive)
- `sortBy`: Sort field (name, size, createdAt, updatedAt)
- `sortOrder`: Sort direction (asc, desc)

**Response:**
```json
{
  "files": [
    {
      "id": "file-uuid",
      "name": "photo.jpg",
      "mimeType": "image/jpeg",
      "size": 204800,
      "folder": {
        "id": "folder-uuid",
        "name": "Photos"
      },
      "tags": ["vacation", "beach"],
      "createdAt": "2025-01-20T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filters": {
    "folderId": "folder-uuid",
    "mimeType": "image",
    "search": "photo"
  }
}
```

### File Deletion

#### Delete File
```http
DELETE /api/s3/delete/{fileId}
```

**Response:**
```json
{
  "message": "File deleted successfully from both storage and database",
  "file": {
    "id": "file-uuid",
    "name": "document.pdf",
    "storagePath": "folders/folder-id/timestamp-uuid.pdf"
  },
  "deletedAt": "2025-01-20T10:30:00Z"
}
```

### Storage Statistics

#### Get Storage Statistics
```http
GET /api/s3/stats?folderId={id}  // optional folder filter
```

**Response:**
```json
{
  "statistics": {
    "totalFiles": 150,
    "totalSize": 524288000,
    "averageSize": 3495253,
    "filesByType": {
      "image/jpeg": 45,
      "application/pdf": 30,
      "text/plain": 15
    },
    "sizeByType": {
      "image/jpeg": 204800000,
      "application/pdf": 153600000,
      "text/plain": 5120000
    }
  }
}
```

## Storage Path Organization

Files are stored in S3 with organized paths:

- **Root files**: `root/timestamp-uuid.extension`
- **Folder files**: `folders/{folderId}/timestamp-uuid.extension`

This provides:
- Clear organization in S3 bucket
- Easy identification of file location
- Collision-free naming with timestamps and UUIDs

## Benefits of the Integration

### 1. Rich Metadata Management
- Store comprehensive file information in PostgreSQL
- Support for descriptions, tags, and custom metadata
- Fast queries without S3 API calls

### 2. Hierarchical Organization
- Unlimited folder nesting
- Easy folder-based filtering and navigation
- Maintains parent-child relationships

### 3. Advanced Search Capabilities
- Full-text search in file names
- Filter by MIME type, size, dates
- Tag-based categorization
- Pagination and sorting

### 4. Data Consistency
- Coordinated operations between S3 and database
- Cleanup handles both storage locations
- Verification of S3 existence when needed

### 5. Performance Optimization
- Database indexes for fast queries
- Minimal S3 API calls for metadata operations
- Efficient pagination and filtering

## Error Handling

The integration provides comprehensive error handling:

### Upload Errors
- Validates file types and sizes before S3 upload
- Checks folder existence before creating records
- Handles S3 upload failures with database cleanup

### Download Errors
- Verifies file exists in database first
- Provides meaningful error messages for missing files
- Handles S3 access issues gracefully

### Consistency Checks
- Optional S3 verification in file info endpoint
- Orphaned record detection and cleanup capabilities
- Graceful degradation when S3 is unavailable

## Testing

Run the comprehensive integration test:

```bash
npm run test:s3-integration
# or
npx ts-node scripts/test-s3-prisma-integration.ts
```

This test covers:
- Complete upload workflow
- File information retrieval
- Download URL generation
- Search and filtering
- Storage statistics
- Cleanup operations

## Migration from Old Approach

If you have existing files using the old S3-only approach:

1. **Backup existing files**: Export current S3 object list
2. **Run migration script**: Create database records for existing files
3. **Update client code**: Switch to new API endpoints
4. **Verify integration**: Test upload/download workflows
5. **Clean up**: Remove old API endpoints

## Environment Variables

Ensure your `.env` file includes:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# S3 Configuration
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET_NAME="your-bucket-name"
```

## Next Steps

1. **Set up database**: Run `npm run db:generate && npm run db:push`
2. **Test integration**: Run the test script to verify functionality
3. **Update frontend**: Modify client code to use new API endpoints
4. **Monitor performance**: Check database query performance and optimize as needed
5. **Add monitoring**: Implement logging and monitoring for file operations

The S3-Prisma integration provides a robust, scalable solution for file storage that combines the best of both worlds: S3's reliable binary storage and PostgreSQL's powerful metadata management.
