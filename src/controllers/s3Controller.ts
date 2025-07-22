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

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";

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

// Helper function to generate unique file name
const generateUniqueFileName = (originalName: string): string => {
  const fileExtension = originalName.split(".").pop();
  const uniqueId = uuidv4();
  const timestamp = Date.now();
  return `${timestamp}-${uniqueId}.${fileExtension}`;
};

// 🔗 Generate pre-signed URL for upload
export const getUploadUrl = async (req: Request, res: Response) => {
  const { fileName, fileType, fileSize } = req.body;

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

  // Generate unique file name to prevent collisions
  const uniqueFileName = generateUniqueFileName(fileName);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: uniqueFileName,
    ContentType: fileType,
    ContentLength: fileSize, // Optional: specify expected file size
    Metadata: {
      "original-name": fileName,
      "upload-timestamp": new Date().toISOString(),
    },
  });

  try {
    // Generate presigned URL with 15 minutes expiration (more secure)
    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: 900, // 15 minutes
      signableHeaders: new Set(["content-type"]), // Enforce content-type
    });

    res.status(200).json({
      uploadUrl: signedUrl,
      key: uniqueFileName,
      originalFileName: fileName,
      expiresIn: 900,
      maxFileSize: MAX_FILE_SIZE,
      message: "Upload URL generated successfully",
      instructions: {
        method: "PUT",
        headers: {
          "Content-Type": fileType,
        },
        note: "Upload the file directly to the uploadUrl using a PUT request with the specified Content-Type header",
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

// � Generate pre-signed URL for download
export const getDownloadUrl = async (req: Request, res: Response) => {
  const { key } = req.params;
  const { download = false } = req.query; // Optional: force download vs inline display

  if (!key) {
    return res.status(400).json({
      error: "File key is required",
    });
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: download === "true" ? "attachment" : "inline", // Controls browser behavior
  });

  try {
    // Generate presigned URL with 1 hour expiration for downloads
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    res.status(200).json({
      downloadUrl: signedUrl,
      key,
      expiresIn: 3600,
      downloadType: download === "true" ? "attachment" : "inline",
      message: "Download URL generated successfully",
    });
  } catch (error) {
    console.error("Error generating download URL:", error);

    // Check if it's a NoSuchKey error
    if (error instanceof Error && error.name === "NoSuchKey") {
      return res.status(404).json({
        error: "File not found",
        key,
      });
    }

    res.status(500).json({
      error: "Failed to generate download URL",
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// ❌ Delete file
export const deleteFile = async (req: Request, res: Response) => {
  const { key } = req.params;

  if (!key) {
    return res.status(400).json({
      error: "File key is required",
    });
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    await s3.send(command);
    res.status(200).json({
      message: "File deleted successfully",
      key,
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error deleting file:", error);

    // S3 doesn't return an error for deleting non-existent objects
    // but we can still log and return success
    res.status(500).json({
      error: "Delete operation failed",
      key,
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// 📋 Get file information
export const getFileInfo = async (req: Request, res: Response) => {
  const { key } = req.params;

  if (!key) {
    return res.status(400).json({
      error: "File key is required",
    });
  }

  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    const data = await s3.send(command);

    res.status(200).json({
      key,
      size: data.ContentLength,
      contentType: data.ContentType,
      lastModified: data.LastModified,
      etag: data.ETag,
      metadata: data.Metadata,
      message: "File information retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting file info:", error);

    if (error instanceof Error && error.name === "NotFound") {
      return res.status(404).json({
        error: "File not found",
        key,
      });
    }

    res.status(500).json({
      error: "Failed to get file information",
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// 📂 List files in bucket (with pagination)
export const listFiles = async (req: Request, res: Response) => {
  const { maxKeys = 50, continuationToken, prefix = "" } = req.query;

  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    MaxKeys: Math.min(parseInt(maxKeys as string) || 50, 100), // Limit to max 100
    ContinuationToken: continuationToken as string,
    Prefix: prefix as string,
  });

  try {
    const data = await s3.send(command);

    const files =
      data.Contents?.map((object) => ({
        key: object.Key,
        size: object.Size,
        lastModified: object.LastModified,
        etag: object.ETag,
      })) || [];

    res.status(200).json({
      files,
      count: files.length,
      isTruncated: data.IsTruncated,
      nextContinuationToken: data.NextContinuationToken,
      prefix: prefix || "",
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
