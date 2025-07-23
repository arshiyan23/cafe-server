/**
 * File Service
 *
 * This service provides all database operations for files including:
 * - CRUD operations
 * - Search and filtering with folder relationships
 * - File metadata management
 * - Validation and error handling
 *
 * Design Principles:
 * - Repository pattern for data access abstraction
 * - Comprehensive error handling
 * - Type safety with TypeScript
 * - Scalable query optimizations
 */

import { prisma } from "../prisma";
import {
  File,
  FileWithFolder,
  CreateFileInput,
  UpdateFileInput,
  FileQueryOptions,
  FileSearchFilters,
  PaginationOptions,
  PaginatedResult,
  DatabaseError,
} from "../types";

export class FileService {
  /**
   * Create a new file
   * @param input - File creation data
   * @returns Created file
   */
  async createFile(input: CreateFileInput): Promise<File> {
    try {
      // Validate folder exists if folderId is provided
      if (input.folderId) {
        const folderExists = await this.folderExists(input.folderId);
        if (!folderExists) {
          throw new Error(`Folder with ID ${input.folderId} not found`);
        }
      }

      // Check for duplicate storage path
      const existingFile = await prisma.file.findUnique({
        where: { storagePath: input.storagePath },
      });

      if (existingFile) {
        throw new Error(
          `File with storage path "${input.storagePath}" already exists`
        );
      }

      return await prisma.file.create({
        data: {
          name: input.name,
          storagePath: input.storagePath,
          mimeType: input.mimeType,
          size: input.size,
          checksum: input.checksum,
          folderId: input.folderId,
          description: input.description,
          tags: input.tags || [],
        },
      });
    } catch (error: any) {
      throw this.handleDatabaseError(error, "Failed to create file");
    }
  }

  /**
   * Get file by ID with optional relations
   * @param id - File ID
   * @param options - Query options for including relations
   * @returns File with requested relations or null
   */
  async getFileById(
    id: string,
    options: FileQueryOptions = {}
  ): Promise<FileWithFolder | null> {
    try {
      const include = {
        folder: options.includeFolder || false,
      };

      return (await prisma.file.findUnique({
        where: { id },
        include,
      })) as FileWithFolder | null;
    } catch (error: any) {
      throw this.handleDatabaseError(error, `Failed to get file with ID ${id}`);
    }
  }

  /**
   * Get file by storage path
   * @param storagePath - File storage path
   * @param options - Query options
   * @returns File or null
   */
  async getFileByStoragePath(
    storagePath: string,
    options: FileQueryOptions = {}
  ): Promise<FileWithFolder | null> {
    try {
      const include = {
        folder: options.includeFolder || false,
      };

      return (await prisma.file.findUnique({
        where: { storagePath },
        include,
      })) as FileWithFolder | null;
    } catch (error: any) {
      throw this.handleDatabaseError(
        error,
        `Failed to get file with storage path ${storagePath}`
      );
    }
  }

  /**
   * Get all files in a folder
   * @param folderId - Folder ID (null for root level files)
   * @param options - Query options
   * @returns Array of files
   */
  async getFilesByFolder(
    folderId: string | null,
    options: FileQueryOptions = {}
  ): Promise<FileWithFolder[]> {
    try {
      const include = {
        folder: options.includeFolder || false,
      };

      return (await prisma.file.findMany({
        where: { folderId },
        include,
        orderBy: { name: "asc" },
      })) as FileWithFolder[];
    } catch (error: any) {
      throw this.handleDatabaseError(error, "Failed to get files by folder");
    }
  }

  /**
   * Update file
   * @param id - File ID
   * @param input - Update data
   * @returns Updated file
   */
  async updateFile(id: string, input: UpdateFileInput): Promise<File> {
    try {
      // Check if file exists
      const existingFile = await this.fileExists(id);
      if (!existingFile) {
        throw new Error(`File with ID ${id} not found`);
      }

      // Validate folder if folderId is being updated
      if (input.folderId !== undefined && input.folderId !== null) {
        const folderExists = await this.folderExists(input.folderId);
        if (!folderExists) {
          throw new Error(`Folder with ID ${input.folderId} not found`);
        }
      }

      return await prisma.file.update({
        where: { id },
        data: input,
      });
    } catch (error: any) {
      throw this.handleDatabaseError(
        error,
        `Failed to update file with ID ${id}`
      );
    }
  }

  /**
   * Delete file
   * @param id - File ID
   * @returns Deleted file
   */
  async deleteFile(id: string): Promise<File> {
    try {
      const file = await this.getFileById(id);
      if (!file) {
        throw new Error(`File with ID ${id} not found`);
      }

      return await prisma.file.delete({
        where: { id },
      });
    } catch (error: any) {
      throw this.handleDatabaseError(
        error,
        `Failed to delete file with ID ${id}`
      );
    }
  }

  /**
   * Search files with filters and pagination
   * @param filters - Search filters
   * @param pagination - Pagination options
   * @returns Paginated file results
   */
  async searchFiles(
    filters: FileSearchFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<FileWithFolder>> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = "name",
        sortOrder = "asc",
      } = pagination;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (filters.name) {
        where.name = { contains: filters.name, mode: "insensitive" };
      }

      if (filters.mimeType) {
        where.mimeType = { contains: filters.mimeType, mode: "insensitive" };
      }

      if (filters.folderId !== undefined) {
        where.folderId = filters.folderId;
      }

      if (filters.tags && filters.tags.length > 0) {
        where.tags = { hasSome: filters.tags };
      }

      if (filters.minSize !== undefined || filters.maxSize !== undefined) {
        where.size = {};
        if (filters.minSize !== undefined) where.size.gte = filters.minSize;
        if (filters.maxSize !== undefined) where.size.lte = filters.maxSize;
      }

      if (filters.createdAfter || filters.createdBefore) {
        where.createdAt = {};
        if (filters.createdAfter) where.createdAt.gte = filters.createdAfter;
        if (filters.createdBefore) where.createdAt.lte = filters.createdBefore;
      }

      // Get total count
      const total = await prisma.file.count({ where });

      // Get paginated results
      const files = (await prisma.file.findMany({
        where,
        include: {
          folder: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      })) as FileWithFolder[];

      return {
        data: files,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      };
    } catch (error: any) {
      throw this.handleDatabaseError(error, "Failed to search files");
    }
  }

  /**
   * Get files by MIME type pattern
   * @param mimeTypePattern - MIME type pattern (e.g., 'image/*', 'application/pdf')
   * @param folderId - Optional folder filter
   * @returns Array of matching files
   */
  async getFilesByMimeType(
    mimeTypePattern: string,
    folderId?: string
  ): Promise<FileWithFolder[]> {
    try {
      const where: any = {
        mimeType: { contains: mimeTypePattern.replace("*", "") },
      };

      if (folderId !== undefined) {
        where.folderId = folderId;
      }

      return (await prisma.file.findMany({
        where,
        include: { folder: true },
        orderBy: { name: "asc" },
      })) as FileWithFolder[];
    } catch (error: any) {
      throw this.handleDatabaseError(
        error,
        `Failed to get files by MIME type ${mimeTypePattern}`
      );
    }
  }

  /**
   * Get file statistics
   * @param folderId - Optional folder filter
   * @returns File statistics
   */
  async getFileStats(folderId?: string | null) {
    try {
      const where = folderId !== undefined ? { folderId } : {};

      const [totalFiles, totalSize, mimeTypeStats] = await Promise.all([
        prisma.file.count({ where }),
        prisma.file.aggregate({
          where,
          _sum: { size: true },
        }),
        prisma.file.groupBy({
          by: ["mimeType"],
          where,
          _count: { mimeType: true },
          _sum: { size: true },
        }),
      ]);

      return {
        totalFiles,
        totalSize: totalSize._sum.size || 0,
        mimeTypeDistribution: mimeTypeStats.map((stat) => ({
          mimeType: stat.mimeType,
          count: stat._count.mimeType,
          totalSize: stat._sum.size || 0,
        })),
      };
    } catch (error: any) {
      throw this.handleDatabaseError(error, "Failed to get file statistics");
    }
  }

  /**
   * Check if file exists
   * @param id - File ID
   * @returns Boolean indicating existence
   */
  private async fileExists(id: string): Promise<boolean> {
    const count = await prisma.file.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Check if folder exists
   * @param id - Folder ID
   * @returns Boolean indicating existence
   */
  private async folderExists(id: string): Promise<boolean> {
    const count = await prisma.folder.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Handle database errors and convert to application errors
   * @param error - Original error
   * @param message - Context message
   * @returns Formatted error
   */
  private handleDatabaseError(error: any, message: string): DatabaseError {
    if (error.code && error.code.startsWith("P")) {
      return {
        code: error.code,
        message: `${message}: ${error.message}`,
        details: error.meta,
      };
    }

    return {
      code: "UNKNOWN_ERROR",
      message: `${message}: ${error.message}`,
      details: error,
    };
  }
}

// Export singleton instance
export const fileService = new FileService();
