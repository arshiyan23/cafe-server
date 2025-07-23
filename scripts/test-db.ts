/**
 * Basic Database Test
 *
 * This file tests the basic functionality of our database setup.
 * Run with: npx ts-node scripts/test-db.ts
 *
 * Make sure to set up your DATABASE_URL in .env first!
 */

import { folderService, fileService } from "../src/database";

async function testDatabase() {
  console.log("🚀 Testing database setup...\n");

  try {
    // Test 1: Create a root folder
    console.log("1. Creating root folder...");
    const rootFolder = await folderService.createFolder({
      name: "Test Documents",
      description: "Test folder for database validation",
    });
    console.log("✅ Root folder created:", rootFolder.id);

    // Test 2: Create a subfolder
    console.log("\n2. Creating subfolder...");
    const subfolder = await folderService.createFolder({
      name: "Images",
      description: "Test images folder",
      parentId: rootFolder.id,
    });
    console.log("✅ Subfolder created:", subfolder.id);

    // Test 3: Create a file
    console.log("\n3. Creating file record...");
    const file = await fileService.createFile({
      name: "test-image.jpg",
      storagePath: "/storage/test-image.jpg",
      mimeType: "image/jpeg",
      size: 1024000,
      folderId: subfolder.id,
      description: "Test image file",
      tags: ["test", "image", "demo"],
    });
    console.log("✅ File created:", file.id);

    // Test 4: Retrieve folder with contents
    console.log("\n4. Retrieving folder with contents...");
    const folderWithContents = await folderService.getFolderById(
      rootFolder.id,
      {
        includeChildren: true,
        includeFiles: true,
      }
    );
    console.log("✅ Folder retrieved with:", {
      children: folderWithContents?.children?.length || 0,
      files: folderWithContents?.files?.length || 0,
    });

    // Test 5: Search files
    console.log("\n5. Searching files...");
    const searchResults = await fileService.searchFiles(
      {
        mimeType: "image",
      },
      {
        page: 1,
        limit: 10,
      }
    );
    console.log("✅ Found files:", searchResults.total);

    // Test 6: Get file statistics
    console.log("\n6. Getting file statistics...");
    const stats = await fileService.getFileStats();
    console.log("✅ File stats:", {
      totalFiles: stats.totalFiles,
      totalSize: stats.totalSize,
      mimeTypes: stats.mimeTypeDistribution.length,
    });

    // Cleanup: Delete test data
    console.log("\n7. Cleaning up test data...");
    await fileService.deleteFile(file.id);
    await folderService.deleteFolder(subfolder.id);
    await folderService.deleteFolder(rootFolder.id);
    console.log("✅ Test data cleaned up");

    console.log("\n🎉 All tests passed! Database setup is working correctly.");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Test execution failed:", error);
      process.exit(1);
    });
}

export { testDatabase };
