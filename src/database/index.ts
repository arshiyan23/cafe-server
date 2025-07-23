/**
 * Database Module Index
 *
 * This file exports all database-related functionality including:
 * - Prisma client instance
 * - Service classes for database operations
 * - Type definitions
 *
 * This provides a clean API for the rest of the application to interact
 * with the database layer without needing to know implementation details.
 */

// Core database client
export { prisma } from "./prisma";

// Service classes
export { FolderService, folderService } from "./services/simpleFolderService";
export { FileService, fileService } from "./services/fileService";

// Type definitions
export * from "./types";
