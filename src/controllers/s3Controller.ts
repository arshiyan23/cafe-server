import { Request, Response } from "express";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { fileService, folderService } from "../database";
import { CreateFileInput, UpdateFileInput } from "../database/types";

dotenv.config();

// S3 Client configuration for development (LocalStack) and production
const s3Config: any = {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

// Use LocalStack endpoint in development
if (process.env.NODE_ENV === "development" && process.env.AWS_ENDPOINT_URL) {
  s3Config.endpoint = process.env.AWS_ENDPOINT_URL;
  s3Config.forcePathStyle = process.env.AWS_S3_FORCE_PATH_STYLE === "true";
  // Disable problematic features for LocalStack
  s3Config.requestHandler = undefined;
}

const s3 = new S3Client(s3Config);

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";

// Helper function to fix LocalStack URLs for client access
const fixLocalStackUrl = (url: string): string => {
  if (
    process.env.NODE_ENV === "development" &&
    url.includes("://localstack:")
  ) {
    let fixedUrl = url.replace("://localstack:", "://localhost:");

    // Remove problematic checksum headers for LocalStack
    fixedUrl = fixedUrl.replace(/[&?]x-amz-checksum-[^&]+/g, "");
    fixedUrl = fixedUrl.replace(/[&?]x-amz-sdk-checksum-algorithm=[^&]+/g, "");

    return fixedUrl;
  }
  return url;
};

// Allowed file types for security
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

// Maximum file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Helper function to validate file type
const isValidFileType = (contentType: string): boolean => {
  return ALLOWED_FILE_TYPES.includes(contentType);
};

// Helper function to generate unique storage path
const generateStoragePath = (
  originalName: string,
  folderId?: string
): string => {
  const fileExtension = originalName.split(".").pop() || "";
  const uniqueId = uuidv4();
  const timestamp = Date.now();
  const folderPrefix = folderId ? `folders/${folderId}/` : "root/";
  return `${folderPrefix}${timestamp}-${uniqueId}.${fileExtension}`;
};

// Helper function to calculate file checksum
const calculateChecksum = (buffer: Buffer): string => {
  return crypto.createHash("md5").update(buffer).digest("hex");
};

// 🔗 Generate pre-signed URL for upload and create database record
export const getUploadUrl = async (req: Request, res: Response) => {
  const { fileName, fileType, fileSize, folderId, description, tags } =
    req.body;

  // Validation
  if (!fileName || !fileType) {
    return res.status(400).json({
      error: "fileName and fileType are required",
    });
  }

  if (!isValidFileType(fileType)) {
    return res.status(400).json({
      error: "File type not allowed",
      allowedTypes: ALLOWED_FILE_TYPES,
    });
  }

  if (fileSize && fileSize > MAX_FILE_SIZE) {
    return res.status(400).json({
      error: `File size too large. Maximum allowed size is ${
        MAX_FILE_SIZE / (1024 * 1024)
      }MB`,
    });
  }

  // Validate folder exists if provided
  if (folderId) {
    try {
      const folder = await folderService.getFolderById(folderId);
      if (!folder) {
        return res.status(404).json({
          error: "Folder not found",
          folderId,
        });
      }
    } catch (error) {
      return res.status(500).json({
        error: "Failed to validate folder",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // Generate unique storage path
  const storagePath = generateStoragePath(fileName, folderId);

  try {
    // Create database record first
    const fileData: CreateFileInput = {
      name: fileName,
      storagePath,
      mimeType: fileType,
      size: fileSize || 0,
      folderId: folderId || null,
      description: description || null,
      tags: Array.isArray(tags) ? tags : [],
    };

    const dbFile = await fileService.createFile(fileData);

    // Create S3 command
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storagePath,
      ContentType: fileType,
      ContentLength: fileSize,
      Metadata: {
        "db-file-id": dbFile.id,
        "original-name": fileName,
        "upload-timestamp": new Date().toISOString(),
      },
    });

    // Generate presigned URL with 15 minutes expiration
    const signedUrl = await getSignedUrl(
      s3,
      command,
      {
        expiresIn: 900, // 15 minutes
        signableHeaders: new Set(["content-type"]),
      } /*  */
    );

    // Fix LocalStack URL for client access in development
    const clientAccessibleUrl = fixLocalStackUrl(signedUrl);

    res.status(200).json({
      uploadUrl: clientAccessibleUrl,
      fileId: dbFile.id,
      key: storagePath,
      originalFileName: fileName,
      expiresIn: 900,
      maxFileSize: MAX_FILE_SIZE,
      message: "Upload URL generated successfully and file record created",
      instructions: {
        method: "PUT",
        headers: {
          "Content-Type": fileType,
        },
        note: "Upload the file directly to the uploadUrl using a PUT request. After successful upload, call /confirm-upload with the fileId to finalize the process.",
      },
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    res.status(500).json({
      error: "Failed to generate upload URL",
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// ✅ Confirm upload completion and update file metadata
export const confirmUpload = async (req: Request, res: Response) => {
  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({
      error: "fileId is required",
    });
  }

  try {
    // Get file record from database
    const dbFile = await fileService.getFileById(fileId);
    if (!dbFile) {
      return res.status(404).json({
        error: "File record not found",
        fileId,
      });
    }

    // Verify file exists in S3 and get actual size/metadata
    const headCommand = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: dbFile.storagePath,
    });

    const s3Data = await s3.send(headCommand);

    // Update database record with actual file size and generate checksum if needed
    const updateData: UpdateFileInput = {
      size: s3Data.ContentLength || dbFile.size,
    };

    // If we can get the file content for checksum calculation (for smaller files)
    if (s3Data.ContentLength && s3Data.ContentLength < 10 * 1024 * 1024) {
      // 10MB limit for checksum
      try {
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: dbFile.storagePath,
        });
        const s3Object = await s3.send(getCommand);
        if (s3Object.Body) {
          const chunks: Buffer[] = [];
          const readable = s3Object.Body as any;

          for await (const chunk of readable) {
            chunks.push(chunk);
          }

          const buffer = Buffer.concat(chunks);
          updateData.checksum = calculateChecksum(buffer);
        }
      } catch (checksumError) {
        console.warn("Could not calculate checksum:", checksumError);
      }
    }

    const updatedFile = await fileService.updateFile(fileId, updateData);

    res.status(200).json({
      message: "Upload confirmed and file metadata updated",
      file: updatedFile,
      uploadConfirmedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error confirming upload:", error);

    if (error instanceof Error && error.name === "NotFound") {
      return res.status(404).json({
        error: "File not found in S3",
        fileId,
      });
    }

    res.status(500).json({
      error: "Failed to confirm upload",
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// 📥 Generate pre-signed URL for download using database record
export const getDownloadUrl = async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const { download = false } = req.query; // Optional: force download vs inline display

  if (!fileId) {
    return res.status(400).json({
      error: "File ID is required",
    });
  }

  try {
    // Get file record from database
    const dbFile = await fileService.getFileById(fileId);
    if (!dbFile) {
      return res.status(404).json({
        error: "File not found in database",
        fileId,
      });
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: dbFile.storagePath,
      ResponseContentDisposition:
        download === "true"
          ? `attachment; filename="${dbFile.name}"`
          : "inline",
    });

    // Generate presigned URL with 1 hour expiration for downloads
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    // Fix LocalStack URL for client access in development
    const clientAccessibleUrl = fixLocalStackUrl(signedUrl);

    res.status(200).json({
      downloadUrl: clientAccessibleUrl,
      file: {
        id: dbFile.id,
        name: dbFile.name,
        size: dbFile.size,
        mimeType: dbFile.mimeType,
        description: dbFile.description,
        tags: dbFile.tags,
        createdAt: dbFile.createdAt,
      },
      expiresIn: 3600,
      downloadType: download === "true" ? "attachment" : "inline",
      message: "Download URL generated successfully",
    });
  } catch (error) {
    console.error("Error generating download URL:", error);

    // Check if it's a NoSuchKey error from S3
    if (error instanceof Error && error.name === "NoSuchKey") {
      return res.status(404).json({
        error: "File not found in storage",
        fileId,
      });
    }

    res.status(500).json({
      error: "Failed to generate download URL",
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// ❌ Delete file from both S3 and database
export const deleteFile = async (req: Request, res: Response) => {
  const { fileId } = req.params;

  if (!fileId) {
    return res.status(400).json({
      error: "File ID is required",
    });
  }

  try {
    // Get file record from database first
    const dbFile = await fileService.getFileById(fileId);
    if (!dbFile) {
      return res.status(404).json({
        error: "File not found in database",
        fileId,
      });
    }

    // Delete from S3 first
    const s3Command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: dbFile.storagePath,
    });

    await s3.send(s3Command);

    // Then delete from database
    await fileService.deleteFile(fileId);

    res.status(200).json({
      message: "File deleted successfully from both storage and database",
      file: {
        id: dbFile.id,
        name: dbFile.name,
        storagePath: dbFile.storagePath,
      },
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error deleting file:", error);

    // If it's a database error, the file might not exist
    if (error instanceof Error && error.message.includes("not found")) {
      return res.status(404).json({
        error: "File not found",
        fileId,
      });
    }

    res.status(500).json({
      error: "Delete operation failed",
      fileId,
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// 📋 Get file information from database with S3 verification
export const getFileInfo = async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const { includeFolder = false } = req.query;

  if (!fileId) {
    return res.status(400).json({
      error: "File ID is required",
    });
  }

  try {
    // Get file record from database
    const dbFile = await fileService.getFileById(fileId, {
      includeFolder: includeFolder === "true",
    });

    if (!dbFile) {
      return res.status(404).json({
        error: "File not found in database",
        fileId,
      });
    }

    // Optionally verify file exists in S3 (adds latency but ensures consistency)
    let s3Verification = null;
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: dbFile.storagePath,
      });
      const s3Data = await s3.send(headCommand);
      s3Verification = {
        exists: true,
        s3Size: s3Data.ContentLength,
        s3LastModified: s3Data.LastModified,
        s3ETag: s3Data.ETag,
      };
    } catch (s3Error) {
      s3Verification = {
        exists: false,
        error: s3Error instanceof Error ? s3Error.name : "Unknown S3 error",
      };
    }

    res.status(200).json({
      file: dbFile,
      s3Verification,
      message: "File information retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting file info:", error);

    res.status(500).json({
      error: "Failed to get file information",
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// 📂 List files from database with optional folder filtering
export const listFiles = async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 50,
    folderId,
    mimeType,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  try {
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit as string) || 50)
    );

    const filters: any = {};

    // Filter by folder
    if (folderId) {
      if (folderId === "root") {
        filters.folderId = null;
      } else {
        filters.folderId = folderId as string;
      }
    }

    // Filter by MIME type
    if (mimeType) {
      filters.mimeType = mimeType as string;
    }

    // Search in file names
    if (search) {
      filters.name = search as string;
    }

    const pagination = {
      page: pageNum,
      limit: limitNum,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    };

    // Use FileService search method
    const result = await fileService.searchFiles(filters, pagination);

    res.status(200).json({
      files: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.hasNext,
        hasPrevPage: result.hasPrev,
      },
      filters: {
        folderId: folderId || null,
        mimeType: mimeType || null,
        search: search || null,
      },
      sort: {
        sortBy: sortBy as string,
        sortOrder: sortOrder as string,
      },
      message: "Files listed successfully",
    });
  } catch (error) {
    console.error("Error listing files:", error);
    res.status(500).json({
      error: "Failed to list files",
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// 📊 Get file storage statistics
export const getStorageStats = async (req: Request, res: Response) => {
  const { folderId } = req.query;

  try {
    const folderIdFilter = folderId === "root" ? null : (folderId as string);
    const stats = await fileService.getFileStats(folderIdFilter);

    res.status(200).json({
      statistics: stats,
      message: "Storage statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting storage stats:", error);
    res.status(500).json({
      error: "Failed to get storage statistics",
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
