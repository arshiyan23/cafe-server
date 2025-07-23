/**
 * Simplified Folder Service
 *
 * This service provides all database operations for folders including:
 * - CRUD operations
 * - Hierarchical operations (parent/child relationships)
 * - Search and filtering
 * - Validation and error handling
 */

import { prisma } from "../prisma";

export class FolderService {
  /**
   * Create a new folder
   */
  async createFolder(input: {
    name: string;
    description?: string;
    parentId?: string;
  }) {
    try {
      if (input.parentId) {
        const parentExists = await this.folderExists(input.parentId);
        if (!parentExists) {
          throw new Error(`Parent folder with ID ${input.parentId} not found`);
        }
      }

      const existingFolder = await prisma.folder.findFirst({
        where: {
          name: input.name,
          parentId: input.parentId || null,
        },
      });

      if (existingFolder) {
        throw new Error(
          `Folder with name "${input.name}" already exists in this location`
        );
      }

      return await prisma.folder.create({
        data: {
          name: input.name,
          description: input.description,
          parentId: input.parentId,
        },
      });
    } catch (error: any) {
      throw new Error(`Failed to create folder: ${error.message}`);
    }
  }

  /**
   * Get folder by ID with optional relations
   */
  async getFolderById(
    id: string,
    options: {
      includeChildren?: boolean;
      includeFiles?: boolean;
      includeParent?: boolean;
    } = {}
  ) {
    try {
      const include: any = {};
      if (options.includeChildren) include.children = true;
      if (options.includeFiles) include.files = true;
      if (options.includeParent) include.parent = true;

      return await prisma.folder.findUnique({
        where: { id },
        include,
      });
    } catch (error: any) {
      throw new Error(`Failed to get folder with ID ${id}: ${error.message}`);
    }
  }

  /**
   * Get all root folders (folders without parent)
   */
  async getRootFolders(
    options: {
      includeChildren?: boolean;
      includeFiles?: boolean;
    } = {}
  ) {
    try {
      const include: any = {};
      if (options.includeChildren) include.children = true;
      if (options.includeFiles) include.files = true;

      return await prisma.folder.findMany({
        where: { parentId: null },
        include,
        orderBy: { name: "asc" },
      });
    } catch (error: any) {
      throw new Error(`Failed to get root folders: ${error.message}`);
    }
  }

  /**
   * Update folder
   */
  async updateFolder(
    id: string,
    input: {
      name?: string;
      description?: string;
      parentId?: string;
    }
  ) {
    try {
      const existingFolder = await this.folderExists(id);
      if (!existingFolder) {
        throw new Error(`Folder with ID ${id} not found`);
      }

      if (input.parentId !== undefined && input.parentId !== id) {
        if (input.parentId) {
          const parentExists = await this.folderExists(input.parentId);
          if (!parentExists) {
            throw new Error(
              `Parent folder with ID ${input.parentId} not found`
            );
          }
        }
      }

      return await prisma.folder.update({
        where: { id },
        data: input,
      });
    } catch (error: any) {
      throw new Error(
        `Failed to update folder with ID ${id}: ${error.message}`
      );
    }
  }

  /**
   * Delete folder
   */
  async deleteFolder(id: string, recursive: boolean = false) {
    try {
      const folder = await this.getFolderById(id, {
        includeChildren: true,
        includeFiles: true,
      });
      if (!folder) {
        throw new Error(`Folder with ID ${id} not found`);
      }

      if (
        !recursive &&
        (folder.children?.length > 0 || folder.files?.length > 0)
      ) {
        throw new Error(
          "Folder contains items. Use recursive delete or move items first"
        );
      }

      return await prisma.folder.delete({
        where: { id },
      });
    } catch (error: any) {
      throw new Error(
        `Failed to delete folder with ID ${id}: ${error.message}`
      );
    }
  }

  /**
   * Search folders with filters
   */
  async searchFolders(
    filters: {
      name?: string;
      parentId?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    try {
      const { page = 1, limit = 20, ...searchFilters } = filters;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (searchFilters.name) {
        where.name = { contains: searchFilters.name, mode: "insensitive" };
      }
      if (searchFilters.parentId !== undefined) {
        where.parentId = searchFilters.parentId;
      }

      const [folders, total] = await Promise.all([
        prisma.folder.findMany({
          where,
          include: {
            children: true,
            files: true,
          },
          orderBy: { name: "asc" },
          skip,
          take: limit,
        }),
        prisma.folder.count({ where }),
      ]);

      return {
        data: folders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      };
    } catch (error: any) {
      throw new Error(`Failed to search folders: ${error.message}`);
    }
  }

  /**
   * Check if folder exists
   */
  private async folderExists(id: string): Promise<boolean> {
    const count = await prisma.folder.count({
      where: { id },
    });
    return count > 0;
  }
}

// Export singleton instance
export const folderService = new FolderService();
