# Prisma Database Setup - Cafe Server

## Overview

This document explains the Prisma ORM setup for the Cafe Server project, which implements a scalable file storage system with hierarchical folder structure.

## Database Schema

### Tables

#### Folders (`folders`)
- Hierarchical folder structure with self-referencing relationships
- Supports unlimited nesting depth
- Each folder can contain files and subfolders

**Fields:**
- `id` (String, UUID, Primary Key)
- `name` (String) - Folder name
- `description` (String?, Optional) - Folder description
- `parentId` (String?, Optional) - Reference to parent folder (NULL = root level)
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Relations:**
- `parent` - Parent folder (self-referencing)
- `children` - Child folders (self-referencing)
- `files` - Files contained in this folder

#### Files (`files`)
- Represents actual files in the storage system
- Can be associated with a folder or exist at root level

**Fields:**
- `id` (String, UUID, Primary Key)
- `name` (String) - Original filename
- `storagePath` (String, Unique) - Storage location path/key
- `mimeType` (String) - File MIME type
- `size` (Int) - File size in bytes
- `checksum` (String?, Optional) - File integrity checksum
- `folderId` (String?, Optional) - Reference to containing folder (NULL = root level)
- `description` (String?, Optional) - File description
- `tags` (String[]) - Array of tags for categorization
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Relations:**
- `folder` - Containing folder (optional)

### Indexes

Performance-optimized indexes for common queries:

**Folders:**
- `parentId` - For hierarchical queries
- `name` - For name-based searches

**Files:**
- `folderId` - For folder-based queries
- `name` - For name-based searches
- `mimeType` - For type-based filtering
- `createdAt` - For date-based sorting

## Architecture

### Modular Design

```
src/database/
├── prisma.ts           # Prisma client singleton
├── index.ts            # Main database exports
├── types/
│   └── index.ts        # TypeScript type definitions
└── services/
    ├── simpleFolderService.ts  # Folder operations
    └── fileService.ts          # File operations
```

### Design Principles

1. **Singleton Pattern**: Single Prisma client instance for connection pooling
2. **Repository Pattern**: Service classes abstract database operations
3. **Type Safety**: Comprehensive TypeScript types
4. **Error Handling**: Consistent error handling across services
5. **Scalability**: Optimized queries with proper indexing

## Services

### FolderService

Handles all folder-related operations:

- `createFolder(input)` - Create new folder
- `getFolderById(id, options)` - Get folder with optional relations
- `getRootFolders(options)` - Get all root-level folders
- `updateFolder(id, input)` - Update folder
- `deleteFolder(id, recursive)` - Delete folder (optionally recursive)
- `searchFolders(filters)` - Search folders with pagination

### FileService

Handles all file-related operations:

- `createFile(input)` - Create new file record
- `getFileById(id, options)` - Get file with optional relations
- `getFileByStoragePath(path)` - Get file by storage path
- `getFilesByFolder(folderId)` - Get all files in a folder
- `updateFile(id, input)` - Update file metadata
- `deleteFile(id)` - Delete file record
- `searchFiles(filters)` - Search files with pagination
- `getFilesByMimeType(pattern)` - Filter by MIME type
- `getFileStats(folderId?)` - Get file statistics

## Usage Examples

### Basic Operations

```typescript
import { folderService, fileService } from './src/database';

// Create a root folder
const rootFolder = await folderService.createFolder({
  name: 'Documents',
  description: 'Main documents folder'
});

// Create a subfolder
const subfolder = await folderService.createFolder({
  name: 'Images',
  description: 'Image files',
  parentId: rootFolder.id
});

// Create a file
const file = await fileService.createFile({
  name: 'photo.jpg',
  storagePath: 's3://bucket/files/photo.jpg',
  mimeType: 'image/jpeg',
  size: 1024000,
  folderId: subfolder.id,
  tags: ['photo', 'vacation']
});
```

### Advanced Queries

```typescript
// Get folder with all children and files
const folderWithContents = await folderService.getFolderById(folderId, {
  includeChildren: true,
  includeFiles: true
});

// Search files by criteria
const searchResults = await fileService.searchFiles({
  mimeType: 'image',
  tags: ['vacation'],
  minSize: 1000,
  maxSize: 5000000
}, {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

// Get file statistics
const stats = await fileService.getFileStats(folderId);
console.log(`Total files: ${stats.totalFiles}, Total size: ${stats.totalSize} bytes`);
```

## Database Commands

### Development Workflow

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database (development)
npm run db:push

# Create and apply migration
npm run db:migrate

# Reset database
npm run db:reset

# Open Prisma Studio
npm run db:studio

# Seed database (if seed file exists)
npm run db:seed
```

### Environment Setup

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/cafe_server?schema=public"

# Or for development with Docker
DATABASE_URL="postgresql://postgres:password@localhost:5432/cafe_server?schema=public"
```

## Scalability Considerations

### Performance Optimizations

1. **Indexes**: Strategic indexes on frequently queried fields
2. **Connection Pooling**: Singleton Prisma client for efficient connections
3. **Pagination**: Built-in pagination for large result sets
4. **Selective Relations**: Optional relation loading to avoid N+1 queries

### Future Enhancements

1. **Full-Text Search**: Add PostgreSQL full-text search for file content
2. **Soft Deletes**: Implement soft deletion for data recovery
3. **Audit Trail**: Track all changes for compliance
4. **Caching**: Add Redis caching layer for frequently accessed data
5. **Bulk Operations**: Optimize for bulk file operations

## Error Handling

All services implement consistent error handling:

- **Validation Errors**: Clear messages for invalid input
- **Not Found Errors**: Specific messages for missing resources
- **Constraint Violations**: Handling for unique constraints and foreign keys
- **Database Errors**: Proper error transformation and logging

## Testing

The modular service design enables easy unit testing:

```typescript
// Mock Prisma client for testing
jest.mock('./src/database/prisma', () => ({
  prisma: {
    folder: {
      create: jest.fn(),
      findUnique: jest.fn(),
      // ... other methods
    }
  }
}));
```

## Migration Strategy

For production deployments:

1. **Development**: Use `db:push` for rapid iteration
2. **Staging**: Use `db:migrate` to create migration files
3. **Production**: Apply migrations with `prisma migrate deploy`

This setup provides a solid foundation for a scalable file storage system with room for future enhancements while maintaining type safety and performance.
