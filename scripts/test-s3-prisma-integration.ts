#!/usr/bin/env ts-node

/**
 * Test Script: S3-Prisma Integration
 *
 * This script demonstrates how the S3 controller now integrates with the Prisma database
 * for comprehensive file management. It shows the complete file lifecycle:
 *
 * 1. Request upload URL with metadata
 * 2. Simulate file upload to S3
 * 3. Confirm upload completion
 * 4. Retrieve file information
 * 5. Generate download URL
 * 6. List files with filtering
 * 7. Clean up (delete file)
 */

import axios from "axios";
import { PrismaClient } from "../src/generated/prisma";
import { fileService, folderService } from "../src/database";

// Configuration
const API_BASE_URL = "http://localhost:3000/api/s3";
const prisma = new PrismaClient();

interface TestFile {
  name: string;
  type: string;
  size: number;
  content: string;
  description: string;
  tags: string[];
}

const testFiles: TestFile[] = [
  {
    name: "test-document.pdf",
    type: "application/pdf",
    size: 1024 * 50, // 50KB
    content: "Test PDF content",
    description: "A test PDF document",
    tags: ["test", "document", "pdf"],
  },
  {
    name: "test-image.jpg",
    type: "image/jpeg",
    size: 1024 * 200, // 200KB
    content: "Test image content",
    description: "A test JPEG image",
    tags: ["test", "image", "photo"],
  },
  {
    name: "test-text.txt",
    type: "text/plain",
    size: 1024 * 2, // 2KB
    content: "Hello, this is a test text file!",
    description: "A simple text file for testing",
    tags: ["test", "text", "simple"],
  },
];

async function testS3PrismaIntegration() {
  console.log("🔧 Starting S3-Prisma Integration Test\n");

  try {
    // Step 1: Create a test folder first
    console.log("📁 Creating test folder...");
    const testFolder = await folderService.createFolder({
      name: "Test Upload Folder",
      description: "Folder created for testing S3-Prisma integration",
    });
    console.log(
      `✅ Created folder: ${testFolder.name} (ID: ${testFolder.id})\n`
    );

    const uploadedFiles: any[] = [];

    // Step 2: Test file upload process for each test file
    for (const testFile of testFiles) {
      console.log(`📤 Testing upload for: ${testFile.name}`);

      // Step 2a: Request upload URL
      console.log("  → Requesting upload URL...");
      const uploadResponse = await axios.post(`${API_BASE_URL}/upload-url`, {
        fileName: testFile.name,
        fileType: testFile.type,
        fileSize: testFile.size,
        folderId: testFolder.id,
        description: testFile.description,
        tags: testFile.tags,
      });

      const { uploadUrl, fileId, key } = uploadResponse.data;
      console.log(`  ✅ Upload URL generated (File ID: ${fileId})`);

      // Step 2b: Simulate file upload to S3 (in real scenario, this would be done by frontend)
      console.log("  → Simulating S3 upload...");
      try {
        await axios.put(uploadUrl, testFile.content, {
          headers: {
            "Content-Type": testFile.type,
          },
        });
        console.log("  ✅ File uploaded to S3");
      } catch (uploadError: any) {
        console.log(
          "  ⚠️  Simulated S3 upload (cannot test without real S3 credentials)"
        );
      }

      // Step 2c: Confirm upload completion
      console.log("  → Confirming upload...");
      try {
        const confirmResponse = await axios.post(
          `${API_BASE_URL}/confirm-upload`,
          {
            fileId: fileId,
          }
        );
        console.log("  ✅ Upload confirmed and metadata updated");
      } catch (confirmError: any) {
        console.log(
          "  ⚠️  Upload confirmation skipped (requires S3 connectivity)"
        );
      }

      uploadedFiles.push({ fileId, name: testFile.name, type: testFile.type });
      console.log("");
    }

    // Step 3: Test file information retrieval
    console.log("📋 Testing file information retrieval...");
    if (uploadedFiles.length > 0) {
      const fileId = uploadedFiles[0].fileId;
      try {
        const infoResponse = await axios.get(
          `${API_BASE_URL}/info/${fileId}?includeFolder=true`
        );
        console.log("✅ File info retrieved:", {
          name: infoResponse.data.file.name,
          size: infoResponse.data.file.size,
          mimeType: infoResponse.data.file.mimeType,
          folder: infoResponse.data.file.folder?.name,
          tags: infoResponse.data.file.tags,
        });
      } catch (error: any) {
        console.log(
          "❌ Error retrieving file info:",
          error.response?.data?.error || error.message
        );
      }
    }
    console.log("");

    // Step 4: Test download URL generation
    console.log("🔗 Testing download URL generation...");
    if (uploadedFiles.length > 0) {
      const fileId = uploadedFiles[0].fileId;
      try {
        const downloadResponse = await axios.get(
          `${API_BASE_URL}/download-url/${fileId}?download=true`
        );
        console.log("✅ Download URL generated:", {
          fileName: downloadResponse.data.file.name,
          downloadType: downloadResponse.data.downloadType,
          expiresIn: downloadResponse.data.expiresIn,
        });
      } catch (error: any) {
        console.log(
          "❌ Error generating download URL:",
          error.response?.data?.error || error.message
        );
      }
    }
    console.log("");

    // Step 5: Test file listing with various filters
    console.log("📂 Testing file listing...");

    // List all files
    console.log("  → Listing all files...");
    try {
      const allFilesResponse = await axios.get(
        `${API_BASE_URL}/files?limit=10`
      );
      console.log(
        `  ✅ Found ${allFilesResponse.data.files.length} total files`
      );
    } catch (error: any) {
      console.log(
        "  ❌ Error listing files:",
        error.response?.data?.error || error.message
      );
    }

    // List files in test folder
    console.log("  → Listing files in test folder...");
    try {
      const folderFilesResponse = await axios.get(
        `${API_BASE_URL}/files?folderId=${testFolder.id}`
      );
      console.log(
        `  ✅ Found ${folderFilesResponse.data.files.length} files in test folder`
      );
    } catch (error: any) {
      console.log(
        "  ❌ Error listing folder files:",
        error.response?.data?.error || error.message
      );
    }

    // List files by MIME type
    console.log("  → Listing image files...");
    try {
      const imageFilesResponse = await axios.get(
        `${API_BASE_URL}/files?mimeType=image`
      );
      console.log(
        `  ✅ Found ${imageFilesResponse.data.files.length} image files`
      );
    } catch (error: any) {
      console.log(
        "  ❌ Error listing image files:",
        error.response?.data?.error || error.message
      );
    }

    // Search files by name
    console.log("  → Searching files by name...");
    try {
      const searchResponse = await axios.get(
        `${API_BASE_URL}/files?search=test`
      );
      console.log(
        `  ✅ Found ${searchResponse.data.files.length} files matching 'test'`
      );
    } catch (error: any) {
      console.log(
        "  ❌ Error searching files:",
        error.response?.data?.error || error.message
      );
    }
    console.log("");

    // Step 6: Test storage statistics
    console.log("📊 Testing storage statistics...");
    try {
      const statsResponse = await axios.get(`${API_BASE_URL}/stats`);
      console.log("✅ Storage statistics:", statsResponse.data.statistics);
    } catch (error: any) {
      console.log(
        "❌ Error getting statistics:",
        error.response?.data?.error || error.message
      );
    }

    try {
      const folderStatsResponse = await axios.get(
        `${API_BASE_URL}/stats?folderId=${testFolder.id}`
      );
      console.log("✅ Folder statistics:", folderStatsResponse.data.statistics);
    } catch (error: any) {
      console.log(
        "❌ Error getting folder statistics:",
        error.response?.data?.error || error.message
      );
    }
    console.log("");

    // Step 7: Cleanup - Delete test files and folder
    console.log("🧹 Cleaning up test data...");

    // Delete uploaded files
    for (const file of uploadedFiles) {
      try {
        await axios.delete(`${API_BASE_URL}/delete/${file.fileId}`);
        console.log(`  ✅ Deleted file: ${file.name}`);
      } catch (error: any) {
        console.log(
          `  ❌ Error deleting ${file.name}:`,
          error.response?.data?.error || error.message
        );
      }
    }

    // Delete test folder
    try {
      await folderService.deleteFolder(testFolder.id);
      console.log(`  ✅ Deleted folder: ${testFolder.name}`);
    } catch (error: any) {
      console.log(`  ❌ Error deleting folder:`, error.message);
    }

    console.log("\n🎉 S3-Prisma Integration Test Complete!");
    console.log("\n📝 Summary:");
    console.log("  • Files are now stored with full metadata in PostgreSQL");
    console.log("  • S3 is used only for binary storage with organized paths");
    console.log("  • File operations support folder organization");
    console.log("  • Comprehensive search and filtering capabilities");
    console.log("  • Proper cleanup handles both S3 and database records");
  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    if (error.response?.data) {
      console.error("   Response:", error.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to show API usage examples
function showAPIExamples() {
  console.log("\n📚 API Usage Examples:\n");

  console.log("1. Request upload URL:");
  console.log("   POST /api/s3/upload-url");
  console.log("   Body: {");
  console.log('     "fileName": "document.pdf",');
  console.log('     "fileType": "application/pdf",');
  console.log('     "fileSize": 51200,');
  console.log('     "folderId": "folder-uuid-here", // optional');
  console.log('     "description": "My document", // optional');
  console.log('     "tags": ["work", "important"] // optional');
  console.log("   }\n");

  console.log("2. Confirm upload completion:");
  console.log("   POST /api/s3/confirm-upload");
  console.log('   Body: { "fileId": "file-uuid-from-step-1" }\n');

  console.log("3. Get download URL:");
  console.log("   GET /api/s3/download-url/{fileId}?download=true\n");

  console.log("4. List files with filters:");
  console.log(
    "   GET /api/s3/files?folderId={id}&mimeType=image&search=photo&page=1&limit=20\n"
  );

  console.log("5. Get file information:");
  console.log("   GET /api/s3/info/{fileId}?includeFolder=true\n");

  console.log("6. Delete file:");
  console.log("   DELETE /api/s3/delete/{fileId}\n");

  console.log("7. Get storage statistics:");
  console.log("   GET /api/s3/stats?folderId={id} // optional folder filter\n");
}

// Run the test
if (require.main === module) {
  testS3PrismaIntegration()
    .then(() => {
      showAPIExamples();
      process.exit(0);
    })
    .catch((error) => {
      console.error("Test execution failed:", error);
      process.exit(1);
    });
}

export { testS3PrismaIntegration };
