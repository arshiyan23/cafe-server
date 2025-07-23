"use strict";
/**
 * Basic Database Test
 *
 * This file tests the basic functionality of our database setup.
 * Run with: npx ts-node scripts/test-db.ts
 *
 * Make sure to set up your DATABASE_URL in .env first!
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDatabase = testDatabase;
const database_1 = require("../src/database");
function testDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        console.log("🚀 Testing database setup...\n");
        try {
            // Test 1: Create a root folder
            console.log("1. Creating root folder...");
            const rootFolder = yield database_1.folderService.createFolder({
                name: "Test Documents",
                description: "Test folder for database validation",
            });
            console.log("✅ Root folder created:", rootFolder.id);
            // Test 2: Create a subfolder
            console.log("\n2. Creating subfolder...");
            const subfolder = yield database_1.folderService.createFolder({
                name: "Images",
                description: "Test images folder",
                parentId: rootFolder.id,
            });
            console.log("✅ Subfolder created:", subfolder.id);
            // Test 3: Create a file
            console.log("\n3. Creating file record...");
            const file = yield database_1.fileService.createFile({
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
            const folderWithContents = yield database_1.folderService.getFolderById(rootFolder.id, {
                includeChildren: true,
                includeFiles: true,
            });
            console.log("✅ Folder retrieved with:", {
                children: ((_a = folderWithContents === null || folderWithContents === void 0 ? void 0 : folderWithContents.children) === null || _a === void 0 ? void 0 : _a.length) || 0,
                files: ((_b = folderWithContents === null || folderWithContents === void 0 ? void 0 : folderWithContents.files) === null || _b === void 0 ? void 0 : _b.length) || 0,
            });
            // Test 5: Search files
            console.log("\n5. Searching files...");
            const searchResults = yield database_1.fileService.searchFiles({
                mimeType: "image",
            }, {
                page: 1,
                limit: 10,
            });
            console.log("✅ Found files:", searchResults.total);
            // Test 6: Get file statistics
            console.log("\n6. Getting file statistics...");
            const stats = yield database_1.fileService.getFileStats();
            console.log("✅ File stats:", {
                totalFiles: stats.totalFiles,
                totalSize: stats.totalSize,
                mimeTypes: stats.mimeTypeDistribution.length,
            });
            // Cleanup: Delete test data
            console.log("\n7. Cleaning up test data...");
            yield database_1.fileService.deleteFile(file.id);
            yield database_1.folderService.deleteFolder(subfolder.id);
            yield database_1.folderService.deleteFolder(rootFolder.id);
            console.log("✅ Test data cleaned up");
            console.log("\n🎉 All tests passed! Database setup is working correctly.");
        }
        catch (error) {
            console.error("❌ Test failed:", error);
            process.exit(1);
        }
    });
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
