# Cafe Server - File Storage API Documentation

**Base URL:** `http://localhost:3000/api/s3`

This API provides comprehensive file storage management with AWS S3 (or LocalStack for development) integrated with PostgreSQL database for metadata storage. The system supports organized file storage with folders, comprehensive search, and detailed file metadata.

---

## 🔄 File Upload Workflow

The file upload process uses a **two-step approach**:

1. **Request Upload URL** - Get a presigned URL and create database record
2. **Upload File** - Upload directly to S3/LocalStack using the presigned URL
3. **Confirm Upload** - (Optional) Verify upload and update metadata

---

## 📤 Upload Operations

### 1. Request Upload URL

**Endpoint:** `POST /upload-url`

**Purpose:** Generate a presigned URL for direct S3 upload and create database record

**Request Body:**
```json
{
  "fileName": "document.pdf",           // Required: Original filename
  "fileType": "application/pdf",        // Required: MIME type
  "fileSize": 51200,                   // Optional: File size in bytes
  "folderId": "folder-uuid-here",      // Optional: Parent folder ID
  "description": "My document",        // Optional: File description
  "tags": ["work", "important"]        // Optional: Array of tags
}
```

**Response (200):**
```json
{
  "uploadUrl": "http://localhost:4566/cafe-server-dev-bucket/root/123456789-uuid.pdf?...",
  "fileId": "file-uuid-generated",
  "key": "root/123456789-uuid.pdf",
  "originalFileName": "document.pdf",
  "expiresIn": 900,
  "maxFileSize": 52428800,
  "message": "Upload URL generated successfully and file record created",
  "instructions": {
    "method": "PUT",
    "headers": {
      "Content-Type": "application/pdf"
    },
    "note": "Upload the file directly to the uploadUrl using a PUT request. After successful upload, call /confirm-upload with the fileId to finalize the process."
  }
}
```

**Usage Example:**
```javascript
// Step 1: Request upload URL
const uploadResponse = await fetch('/api/s3/upload-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName: 'my-file.pdf',
    fileType: 'application/pdf',
    fileSize: 51200,
    description: 'Important document'
  })
});

const { uploadUrl, fileId } = await uploadResponse.json();

// Step 2: Upload file to S3
await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/pdf' },
  body: fileBlob
});

// Step 3: Confirm upload (optional)
await fetch('/api/s3/confirm-upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fileId })
});
```

### 2. Confirm Upload

**Endpoint:** `POST /confirm-upload`

**Purpose:** Verify file upload completion and update metadata

**Request Body:**
```json
{
  "fileId": "file-uuid-from-upload-url"
}
```

**Response (200):**
```json
{
  "message": "Upload confirmed and file metadata updated",
  "file": {
    "id": "file-uuid",
    "name": "document.pdf",
    "size": 51200,
    "mimeType": "application/pdf",
    "checksum": "md5-hash-if-calculated",
    "createdAt": "2025-07-23T06:00:00.000Z",
    "updatedAt": "2025-07-23T06:00:00.000Z"
  },
  "uploadConfirmedAt": "2025-07-23T06:00:00.000Z"
}
```

---

## 📥 Download Operations

### 1. Get Download URL

**Endpoint:** `GET /download-url/{fileId}`

**Purpose:** Generate presigned URL for file download

**Path Parameters:**
- `fileId` (string): File UUID

**Query Parameters:**
- `download` (boolean): `true` for attachment download, `false` for inline display

**Response (200):**
```json
{
  "downloadUrl": "http://localhost:4566/cafe-server-dev-bucket/path/file.pdf?...",
  "file": {
    "id": "file-uuid",
    "name": "document.pdf",
    "size": 51200,
    "mimeType": "application/pdf",
    "description": "My document",
    "tags": ["work", "important"],
    "createdAt": "2025-07-23T06:00:00.000Z"
  },
  "expiresIn": 3600,
  "downloadType": "attachment",
  "message": "Download URL generated successfully"
}
```

**Usage Example:**
```javascript
// Get download URL for browser viewing
const response = await fetch(`/api/s3/download-url/${fileId}?download=false`);
const { downloadUrl } = await response.json();

// Open in new tab or embed
window.open(downloadUrl);
```

---

## 📋 File Information

### 1. Get File Info

**Endpoint:** `GET /info/{fileId}`

**Purpose:** Get detailed file information with S3 verification

**Path Parameters:**
- `fileId` (string): File UUID

**Query Parameters:**
- `includeFolder` (boolean): Include folder information in response

**Response (200):**
```json
{
  "file": {
    "id": "file-uuid",
    "name": "document.pdf",
    "storagePath": "root/123456789-uuid.pdf",
    "mimeType": "application/pdf",
    "size": 51200,
    "checksum": "md5-hash",
    "folderId": null,
    "description": "My document",
    "tags": ["work", "important"],
    "createdAt": "2025-07-23T06:00:00.000Z",
    "updatedAt": "2025-07-23T06:00:00.000Z",
    "folder": null  // or folder object if includeFolder=true
  },
  "s3Verification": {
    "exists": true,
    "s3Size": 51200,
    "s3LastModified": "2025-07-23T06:00:00.000Z",
    "s3ETag": "\"etag-hash\""
  },
  "message": "File information retrieved successfully"
}
```

---

## 📂 File Listing & Search

### 1. List Files

**Endpoint:** `GET /files`

**Purpose:** List files with pagination, filtering, and search

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (max: 100, default: 50)
- `folderId` (string): Filter by folder ID ("root" for root folder)
- `mimeType` (string): Filter by MIME type (e.g., "image/", "application/pdf")
- `search` (string): Search in file names
- `sortBy` (string): Sort field (default: "createdAt")
- `sortOrder` (string): "asc" or "desc" (default: "desc")

**Response (200):**
```json
{
  "files": [
    {
      "id": "file-uuid",
      "name": "document.pdf",
      "mimeType": "application/pdf",
      "size": 51200,
      "description": "My document",
      "tags": ["work", "important"],
      "createdAt": "2025-07-23T06:00:00.000Z",
      "folder": {
        "id": "folder-uuid",
        "name": "Documents"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filters": {
    "folderId": null,
    "mimeType": null,
    "search": null
  },
  "sort": {
    "sortBy": "createdAt",
    "sortOrder": "desc"
  },
  "message": "Files listed successfully"
}
```

**Usage Examples:**
```javascript
// List all files
const files = await fetch('/api/s3/files').then(r => r.json());

// Search for images in a specific folder
const images = await fetch('/api/s3/files?folderId=folder-uuid&mimeType=image/&search=photo&page=1&limit=20')
  .then(r => r.json());

// List files in root folder
const rootFiles = await fetch('/api/s3/files?folderId=root').then(r => r.json());
```

---

## 📊 Storage Statistics

### 1. Get Storage Stats

**Endpoint:** `GET /stats`

**Purpose:** Get storage usage statistics

**Query Parameters:**
- `folderId` (string): Filter stats by folder ("root" for root folder)

**Response (200):**
```json
{
  "statistics": {
    "totalFiles": 150,
    "totalSize": 1048576000,
    "mimeTypeDistribution": [
      {
        "mimeType": "image/jpeg",
        "count": 45,
        "totalSize": 204800000
      },
      {
        "mimeType": "application/pdf",
        "count": 30,
        "totalSize": 512000000
      },
      {
        "mimeType": "text/plain",
        "count": 75,
        "totalSize": 331776000
      }
    ]
  },
  "message": "Storage statistics retrieved successfully"
}
```

---

## ❌ Delete Operations

### 1. Delete File

**Endpoint:** `DELETE /delete/{fileId}`

**Purpose:** Delete file from both S3 storage and database

**Path Parameters:**
- `fileId` (string): File UUID

**Response (200):**
```json
{
  "message": "File deleted successfully from both storage and database",
  "file": {
    "id": "file-uuid",
    "name": "document.pdf",
    "storagePath": "root/123456789-uuid.pdf"
  },
  "deletedAt": "2025-07-23T06:00:00.000Z"
}
```

---

## 🔧 Technical Details

### Supported File Types
```javascript
const ALLOWED_FILE_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "text/plain", "text/csv",
  "application/json",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];
```

### File Size Limits
- Maximum file size: **50MB** (52,428,800 bytes)
- Checksum calculation: Only for files under 10MB

### File Storage Structure
```
S3 Bucket Structure:
├── root/
│   ├── timestamp-uuid.ext
│   └── timestamp-uuid.ext
└── folders/
    └── {folderId}/
        ├── timestamp-uuid.ext
        └── timestamp-uuid.ext
```

---

## 🚨 Error Responses

### Common Error Codes

**400 Bad Request:**
```json
{
  "error": "fileName and fileType are required"
}
```

**404 Not Found:**
```json
{
  "error": "File not found in database",
  "fileId": "file-uuid"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to generate upload URL",
  "details": "Error details (development only)"
}
```

---

## 🔗 Frontend Integration Examples

### React File Upload Component

```javascript
const FileUpload = () => {
  const uploadFile = async (file) => {
    try {
      // Step 1: Get upload URL
      const uploadResponse = await fetch('/api/s3/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          description: 'User uploaded file'
        })
      });
      
      const { uploadUrl, fileId } = await uploadResponse.json();
      
      // Step 2: Upload to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });
      
      // Step 3: Confirm upload
      await fetch('/api/s3/confirm-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId })
      });
      
      console.log('Upload successful!', fileId);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
  
  return (
    <input 
      type="file" 
      onChange={(e) => uploadFile(e.target.files[0])} 
    />
  );
};
```

### File Gallery Component

```javascript
const FileGallery = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const loadFiles = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/s3/files?page=${page}&search=${search}&limit=20`);
      const data = await response.json();
      setFiles(data.files);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const downloadFile = async (fileId, fileName) => {
    try {
      const response = await fetch(`/api/s3/download-url/${fileId}?download=true`);
      const { downloadUrl } = await response.json();
      
      // Create download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };
  
  return (
    <div>
      {files.map(file => (
        <div key={file.id} className="file-item">
          <h3>{file.name}</h3>
          <p>Size: {file.size} bytes</p>
          <p>Type: {file.mimeType}</p>
          <button onClick={() => downloadFile(file.id, file.name)}>
            Download
          </button>
        </div>
      ))}
    </div>
  );
};
```

---

## 🌐 Environment Configuration

### Development (LocalStack)
- **Endpoint:** `http://localhost:4566`
- **Bucket:** `cafe-server-dev-bucket`
- **Credentials:** `test/test`

### Production (AWS S3)
- **Endpoint:** Native AWS S3
- **Bucket:** Your production bucket
- **Credentials:** Real AWS credentials

---

This API provides a complete file storage solution with database integration, supporting the full file lifecycle from upload to deletion, with comprehensive search and metadata management capabilities.
