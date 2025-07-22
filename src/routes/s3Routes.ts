import express from "express";
import {
  getUploadUrl,
  getDownloadUrl,
  deleteFile,
  getFileInfo,
  listFiles,
} from "../controllers/s3Controller";

const router = express.Router();

// Generate pre-signed URL for upload
router.post("/upload-url", getUploadUrl);

// Generate pre-signed URL for download
router.get("/download-url/:key", getDownloadUrl);

// Get file information
router.get("/info/:key", getFileInfo);

// List files with pagination
router.get("/files", listFiles);

// Delete file (keeping this as direct operation)
router.delete("/delete/:key", deleteFile);

export default router;
