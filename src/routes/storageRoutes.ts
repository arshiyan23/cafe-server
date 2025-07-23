/**
 * Storage Routes
 *
 * Routes for folder and file management operations.
 * Demonstrates the hierarchical file storage system.
 */

import { Router } from "express";
import { storageController } from "../controllers/storageController";

const router = Router();

// Folder routes
router.post("/folders", storageController.createFolder.bind(storageController));
router.get(
  "/folders",
  storageController.getRootFolders.bind(storageController)
);
router.get(
  "/folders/search",
  storageController.searchFolders.bind(storageController)
);
router.get(
  "/folders/:id",
  storageController.getFolderById.bind(storageController)
);
router.put(
  "/folders/:id",
  storageController.updateFolder.bind(storageController)
);
router.delete(
  "/folders/:id",
  storageController.deleteFolder.bind(storageController)
);

// File routes
router.post("/files", storageController.createFile.bind(storageController));
router.get(
  "/files/search",
  storageController.searchFiles.bind(storageController)
);
router.get(
  "/files/stats",
  storageController.getFileStats.bind(storageController)
);
router.get("/files/:id", storageController.getFileById.bind(storageController));
router.put("/files/:id", storageController.updateFile.bind(storageController));
router.delete(
  "/files/:id",
  storageController.deleteFile.bind(storageController)
);

// Folder-file relationship routes
router.get(
  "/folders/:folderId/files",
  storageController.getFilesByFolder.bind(storageController)
);

export default router;
