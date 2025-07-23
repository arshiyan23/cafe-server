/**
 * Database Types and Interfaces
 *
 * This file defines common types and interfaces used throughout the application
 * for database operations. It provides type safety and consistency.
 */

// We'll define our own types for now to avoid Prisma import issues
export type Folder = {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type File = {
  id: string;
  name: string;
  storagePath: string;
  mimeType: string;
  size: number;
  checksum: string | null;
  folderId: string | null;
  description: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

// Extended types with relations
export type FolderWithChildren = Folder & {
  children?: Folder[];
  files?: File[];
  parent?: Folder | null;
  _count?: {
    children: number;
    files: number;
  };
};

export type FolderWithParent = Folder & {
  parent: Folder | null;
};

export type FileWithFolder = File & {
  folder: Folder | null;
};

// Input types for creating/updating entities
export type CreateFolderInput = {
  name: string;
  description?: string;
  parentId?: string;
};

export type UpdateFolderInput = {
  name?: string;
  description?: string;
  parentId?: string;
};

export type CreateFileInput = {
  name: string;
  storagePath: string;
  mimeType: string;
  size: number;
  checksum?: string;
  folderId?: string;
  description?: string;
  tags?: string[];
};

export type UpdateFileInput = {
  name?: string;
  size?: number;
  checksum?: string;
  folderId?: string;
  description?: string;
  tags?: string[];
};

// Query options
export type FolderQueryOptions = {
  includeChildren?: boolean;
  includeFiles?: boolean;
  includeParent?: boolean;
  includeCounts?: boolean;
  maxDepth?: number;
};

export type FileQueryOptions = {
  includeFolder?: boolean;
};

// Search and filter types
export type FolderSearchFilters = {
  name?: string;
  parentId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
};

export type FileSearchFilters = {
  name?: string;
  mimeType?: string;
  folderId?: string;
  tags?: string[];
  minSize?: number;
  maxSize?: number;
  createdAfter?: Date;
  createdBefore?: Date;
};

// Pagination types
export type PaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

// Error types
export type DatabaseError = {
  code: string;
  message: string;
  details?: any;
};

// Utility type for partial updates
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
