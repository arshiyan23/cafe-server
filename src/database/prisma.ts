/**
 * Prisma Database Client Configuration
 *
 * This file provides a singleton Prisma client instance with proper connection handling.
 * The singleton pattern ensures we don't create multiple database connections.
 *
 * Features:
 * - Singleton pattern for efficient connection pooling
 * - Proper error handling and logging
 * - Graceful shutdown handling
 * - Development vs Production optimizations
 */

import { PrismaClient } from "../generated/prisma";

// Global variable to store the Prisma client instance
let prisma: PrismaClient;

/**
 * Get or create a Prisma client instance
 * In development, we store the client on globalThis to prevent multiple instances
 * during hot reloads. In production, we create a new instance each time.
 */
function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    return new PrismaClient({
      log: ["error", "warn"], // Only log errors and warnings in production
    });
  } else {
    // In development, use global to avoid multiple instances during hot reload
    if (!global.__prisma) {
      global.__prisma = new PrismaClient({
        log: ["query", "info", "warn", "error"], // Verbose logging in development
      });
    }
    return global.__prisma;
  }
}

// Create the singleton instance
prisma = getPrismaClient();

/**
 * Graceful shutdown handler
 * Ensures database connections are properly closed when the application shuts down
 */
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

// Extend global namespace for development
declare global {
  var __prisma: PrismaClient | undefined;
}

export { prisma };
export default prisma;
