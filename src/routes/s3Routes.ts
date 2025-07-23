import express from "express";
import {
  getUploadUrl,
  confirmUpload,
  getDownloadUrl,
  deleteFile,
  getFileInfo,
  listFiles,
  getStorageStats,
} from "../controllers/s3Controller";

const router = express.Router();

// Generate pre-signed URL for upload (creates database record)
router.post("/upload-url", getUploadUrl);

// Confirm upload completion (updates database record)
router.post("/confirm-upload", confirmUpload);

// Generate pre-signed URL for download using file ID
router.get("/download-url/:fileId", getDownloadUrl);

// Get file information using file ID
router.get("/info/:fileId", getFileInfo);

// List files with pagination and filtering
router.get("/files", listFiles);

// Delete file from both S3 and database using file ID
router.delete("/delete/:fileId", deleteFile);

// Get storage statistics
router.get("/stats", getStorageStats);

export default router;
