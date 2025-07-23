/**
 * Storage Controller
 *
 * This controller demonstrates how to use the database services
 * for folder and file operations in a REST API.
 */

import { Request, Response } from "express";
import { folderService, fileService } from "../database";

export class StorageController {
  /**
   * Create a new folder
   * POST /api/folders
   */
  async createFolder(req: Request, res: Response) {
    try {
      const { name, description, parentId } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const folder = await folderService.createFolder({
        name,
        description,
        parentId,
      });

      res.status(201).json(folder);
    } catch (error: any) {
      console.error("Error creating folder:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get folder by ID
   * GET /api/folders/:id
   */
  async getFolderById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { includeChildren, includeFiles, includeParent } = req.query;

      const folder = await folderService.getFolderById(id, {
        includeChildren: includeChildren === "true",
        includeFiles: includeFiles === "true",
        includeParent: includeParent === "true",
      });

      if (!folder) {
        return res.status(404).json({ error: "Folder not found" });
      }

      res.json(folder);
    } catch (error: any) {
      console.error("Error getting folder:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get root folders
   * GET /api/folders
   */
  async getRootFolders(req: Request, res: Response) {
    try {
      const { includeChildren, includeFiles } = req.query;

      const folders = await folderService.getRootFolders({
        includeChildren: includeChildren === "true",
        includeFiles: includeFiles === "true",
      });

      res.json(folders);
    } catch (error: any) {
      console.error("Error getting root folders:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update folder
   * PUT /api/folders/:id
   */
  async updateFolder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, parentId } = req.body;

      const folder = await folderService.updateFolder(id, {
        name,
        description,
        parentId,
      });

      res.json(folder);
    } catch (error: any) {
      console.error("Error updating folder:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete folder
   * DELETE /api/folders/:id
   */
  async deleteFolder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { recursive } = req.query;

      const folder = await folderService.deleteFolder(id, recursive === "true");

      res.json({ message: "Folder deleted successfully", folder });
    } catch (error: any) {
      console.error("Error deleting folder:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Search folders
   * GET /api/folders/search
   */
  async searchFolders(req: Request, res: Response) {
    try {
      const { name, parentId, page, limit } = req.query;

      const results = await folderService.searchFolders({
        name: name as string,
        parentId: parentId as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(results);
    } catch (error: any) {
      console.error("Error searching folders:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create a new file record
   * POST /api/files
   */
  async createFile(req: Request, res: Response) {
    try {
      const {
        name,
        storagePath,
        mimeType,
        size,
        checksum,
        folderId,
        description,
        tags,
      } = req.body;

      if (!name || !storagePath || !mimeType || size === undefined) {
        return res.status(400).json({
          error: "Name, storagePath, mimeType, and size are required",
        });
      }

      const file = await fileService.createFile({
        name,
        storagePath,
        mimeType,
        size,
        checksum,
        folderId,
        description,
        tags,
      });

      res.status(201).json(file);
    } catch (error: any) {
      console.error("Error creating file:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get file by ID
   * GET /api/files/:id
   */
  async getFileById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { includeFolder } = req.query;

      const file = await fileService.getFileById(id, {
        includeFolder: includeFolder === "true",
      });

      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      res.json(file);
    } catch (error: any) {
      console.error("Error getting file:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get files by folder
   * GET /api/folders/:folderId/files
   */
  async getFilesByFolder(req: Request, res: Response) {
    try {
      const { folderId } = req.params;
      const { includeFolder } = req.query;

      const files = await fileService.getFilesByFolder(
        folderId === "root" ? null : folderId,
        {
          includeFolder: includeFolder === "true",
        }
      );

      res.json(files);
    } catch (error: any) {
      console.error("Error getting files by folder:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update file
   * PUT /api/files/:id
   */
  async updateFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, folderId, description, tags } = req.body;

      const file = await fileService.updateFile(id, {
        name,
        folderId,
        description,
        tags,
      });

      res.json(file);
    } catch (error: any) {
      console.error("Error updating file:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete file
   * DELETE /api/files/:id
   */
  async deleteFile(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const file = await fileService.deleteFile(id);

      res.json({ message: "File deleted successfully", file });
    } catch (error: any) {
      console.error("Error deleting file:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Search files
   * GET /api/files/search
   */
  async searchFiles(req: Request, res: Response) {
    try {
      const {
        name,
        mimeType,
        folderId,
        tags,
        minSize,
        maxSize,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const results = await fileService.searchFiles(
        {
          name: name as string,
          mimeType: mimeType as string,
          folderId: folderId as string,
          tags: tags ? (tags as string).split(",") : undefined,
          minSize: minSize ? parseInt(minSize as string) : undefined,
          maxSize: maxSize ? parseInt(maxSize as string) : undefined,
        },
        {
          page: page ? parseInt(page as string) : undefined,
          limit: limit ? parseInt(limit as string) : undefined,
          sortBy: sortBy as string,
          sortOrder: sortOrder as "asc" | "desc",
        }
      );

      res.json(results);
    } catch (error: any) {
      console.error("Error searching files:", error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get file statistics
   * GET /api/files/stats
   */
  async getFileStats(req: Request, res: Response) {
    try {
      const { folderId } = req.query;

      const stats = await fileService.getFileStats(
        folderId ? (folderId as string) : undefined
      );

      res.json(stats);
    } catch (error: any) {
      console.error("Error getting file stats:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

// Export singleton instance
export const storageController = new StorageController();
