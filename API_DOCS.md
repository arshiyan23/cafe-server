# File Storage API

A secure file storage service using AWS S3 with pre-signed URLs for direct client uploads and downloads.

## 🔐 Security Features

- **File Type Validation**: Only allowed file types can be uploaded
- **File Size Limits**: Maximum 50MB per file
- **Unique File Names**: Automatic generation to prevent conflicts
- **Short-lived URLs**: Upload URLs expire in 15 minutes, download URLs in 1 hour
- **Content-Type Enforcement**: Ensures uploaded files match declared type

## API Endpoints

### 1. Generate Upload URL

**POST** `/api/s3/upload-url`

Generate a pre-signed URL for uploading files directly to S3.

**Request Body:**
```json
{
  "fileName": "document.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024000
}
```

**Response:**
```json
{
  "uploadUrl": "https://your-bucket.s3.region.amazonaws.com/timestamp-uuid.pdf?X-Amz-Algorithm=...",
  "key": "timestamp-uuid.pdf",
  "originalFileName": "document.pdf",
  "expiresIn": 900,
  "maxFileSize": 52428800,
  "message": "Upload URL generated successfully",
  "instructions": {
    "method": "PUT",
    "headers": {
      "Content-Type": "application/pdf"
    },
    "note": "Upload the file directly to the uploadUrl using a PUT request with the specified Content-Type header"
  }
}
```

**Allowed File Types:**
- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Documents: `application/pdf`, `text/plain`, `text/csv`, `application/json`
- Office: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Spreadsheets: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### 2. Generate Download URL

**GET** `/api/s3/download-url/:key?download=true`

Generate a pre-signed URL for downloading files from S3.

**Parameters:**
- `key` - The file key returned from upload
- `download` (query) - Optional: `true` to force download, `false` for inline display

**Response:**
```json
{
  "downloadUrl": "https://your-bucket.s3.region.amazonaws.com/file-key?X-Amz-Algorithm=...",
  "key": "timestamp-uuid.pdf",
  "expiresIn": 3600,
  "downloadType": "attachment",
  "message": "Download URL generated successfully"
}
```

### 3. Get File Information

**GET** `/api/s3/info/:key`

Get metadata about a file without downloading it.

**Response:**
```json
{
  "key": "timestamp-uuid.pdf",
  "size": 1024000,
  "contentType": "application/pdf",
  "lastModified": "2025-01-15T10:30:00.000Z",
  "etag": "\"d41d8cd98f00b204e9800998ecf8427e\"",
  "metadata": {
    "original-name": "document.pdf",
    "upload-timestamp": "2025-01-15T10:30:00.000Z"
  },
  "message": "File information retrieved successfully"
}
```

### 4. List Files

**GET** `/api/s3/files?maxKeys=50&prefix=&continuationToken=`

List files in the bucket with pagination support.

**Query Parameters:**
- `maxKeys` - Number of files to return (max 100, default 50)
- `prefix` - Filter files by prefix
- `continuationToken` - Token for pagination

**Response:**
```json
{
  "files": [
    {
      "key": "timestamp-uuid.pdf",
      "size": 1024000,
      "lastModified": "2025-01-15T10:30:00.000Z",
      "etag": "\"d41d8cd98f00b204e9800998ecf8427e\""
    }
  ],
  "count": 1,
  "isTruncated": false,
  "nextContinuationToken": null,
  "prefix": "",
  "message": "Files listed successfully"
}
```

### 5. Delete File

**DELETE** `/api/s3/delete/:key`

Delete a file from S3.

**Response:**
```json
{
  "message": "File deleted successfully",
  "key": "timestamp-uuid.pdf",
  "deletedAt": "2025-01-15T10:35:00.000Z"
}
```

## Example Usage

### Complete Upload Flow
```javascript
// 1. Get upload URL
const uploadResponse = await fetch('/api/s3/upload-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName: 'my-document.pdf',
    fileType: 'application/pdf',
    fileSize: file.size
  })
});

const { uploadUrl, key } = await uploadResponse.json();

// 2. Upload file directly to S3
const uploadResult = await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': 'application/pdf'
  }
});

if (uploadResult.ok) {
  console.log('File uploaded successfully with key:', key);
}
```

### Download Flow
```javascript
// Get download URL
const downloadResponse = await fetch(`/api/s3/download-url/${fileKey}?download=true`);
const { downloadUrl } = await downloadResponse.json();

// Download or display the file
window.open(downloadUrl, '_blank');
```

### File Management
```javascript
// Get file info
const infoResponse = await fetch(`/api/s3/info/${fileKey}`);
const fileInfo = await infoResponse.json();

// List files
const listResponse = await fetch('/api/s3/files?maxKeys=20');
const { files } = await listResponse.json();

// Delete file
await fetch(`/api/s3/delete/${fileKey}`, { method: 'DELETE' });
```

## Environment Variables

```env
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=your-bucket-name
NODE_ENV=development # or production
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error description",
  "details": "Additional details (development only)"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad request (validation errors)
- `404` - File not found
- `500` - Server error

## Benefits

1. **Security**: 
   - File type validation prevents malicious uploads
   - Short-lived URLs minimize exposure
   - Content-type enforcement

2. **Performance**: 
   - Direct S3 upload/download bypasses your server
   - Reduced bandwidth costs
   - Better scalability

3. **User Experience**:
   - Unique file names prevent conflicts
   - Progress tracking possible with direct uploads
   - Fast download URLs

4. **Management**:
   - File listing and information retrieval
   - Proper metadata storage
   - Comprehensive error handling
