// ==============================================================================
// AI Live Paper Generator - Chunked Document Upload API
// POST /api/documents/upload-chunk
// Slices large PDF textbooks (up to 50MB+) into <=3MB chunks to bypass
// Vercel serverless 4.5MB payload constraints (HTTP 413).
// ==============================================================================

import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { apiSuccess, apiError } from "@/lib/api-response";
import { DocumentStorageService } from "@/lib/storage/document-store";
import { DocumentProcessor } from "@/server/book-intelligence/document-processor";
import { prisma } from "@/lib/db";

const CHUNKS_BASE_DIR = process.env.VERCEL
  ? path.resolve("/tmp", "uploads", "chunks")
  : path.resolve(process.cwd(), "uploads", "chunks");

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const chunkFile = formData.get("chunk") as File | null;
    const uploadId = formData.get("uploadId") as string | null;
    const chunkIndexStr = formData.get("chunkIndex") as string | null;
    const totalChunksStr = formData.get("totalChunks") as string | null;
    const fileName = formData.get("fileName") as string | null;
    const bookId = formData.get("bookId") as string | null;
    const academicYearId = (formData.get("academicYearId") as string | null) || undefined;
    const autoProcess = formData.get("autoProcess") === "true";

    if (!chunkFile || !uploadId || chunkIndexStr === null || totalChunksStr === null || !fileName || !bookId) {
      return apiError("Missing required chunk metadata (chunk, uploadId, chunkIndex, totalChunks, fileName, bookId).", "INVALID_CHUNK_REQUEST", 400);
    }

    const chunkIndex = parseInt(chunkIndexStr, 10);
    const totalChunks = parseInt(totalChunksStr, 10);

    if (isNaN(chunkIndex) || isNaN(totalChunks) || totalChunks <= 0 || chunkIndex < 0 || chunkIndex >= totalChunks) {
      return apiError("Invalid chunk index or total chunks.", "INVALID_CHUNK_INDICES", 400);
    }

    // Sanitize uploadId to prevent directory traversal
    const safeUploadId = uploadId.replace(/[^a-zA-Z0-9_-]/g, "");
    const uploadSessionDir = path.join(CHUNKS_BASE_DIR, safeUploadId);
    ensureDir(uploadSessionDir);

    // Save this chunk to disk
    const chunkBuffer = Buffer.from(await chunkFile.arrayBuffer());
    const chunkFilePath = path.join(uploadSessionDir, `chunk_${chunkIndex}`);
    await fs.promises.writeFile(chunkFilePath, chunkBuffer);

    // Check how many chunks have arrived
    const savedFiles = await fs.promises.readdir(uploadSessionDir);
    const chunkFiles = savedFiles.filter((f) => f.startsWith("chunk_"));

    // If not all chunks arrived yet, respond with progress
    if (chunkFiles.length < totalChunks) {
      return apiSuccess({
        completed: false,
        chunkIndex,
        totalChunks,
        uploadedChunksCount: chunkFiles.length,
        message: `Chunk ${chunkIndex + 1}/${totalChunks} received successfully.`,
      });
    }

    // All chunks received! Combine them in order.
    const orderedBuffers: Buffer[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const partPath = path.join(uploadSessionDir, `chunk_${i}`);
      if (!fs.existsSync(partPath)) {
        return apiError(`Missing chunk index ${i} during final file assembly.`, "INCOMPLETE_CHUNKS", 400);
      }
      const partBuf = await fs.promises.readFile(partPath);
      orderedBuffers.push(partBuf);
    }

    const assembledBuffer = Buffer.concat(orderedBuffers);

    // Clean up temporary chunk pieces
    try {
      for (let i = 0; i < totalChunks; i++) {
        const partPath = path.join(uploadSessionDir, `chunk_${i}`);
        if (fs.existsSync(partPath)) {
          await fs.promises.unlink(partPath);
        }
      }
      await fs.promises.rmdir(uploadSessionDir);
    } catch (cleanupErr) {
      console.warn("Failed to clean up chunk directory:", cleanupErr);
    }

    // Verify target book entity exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: { subject: { include: { class: true } } },
    });

    if (!book) {
      return apiError(`Referenced Book with ID "${bookId}" was not found.`, "BOOK_NOT_FOUND", 404);
    }

    // Save assembled PDF to vault & calculate checksum
    let storedMeta;
    try {
      storedMeta = await DocumentStorageService.saveDocument(assembledBuffer, fileName);
    } catch (storeErr: unknown) {
      const msg = storeErr instanceof Error ? storeErr.message : "File validation failed";
      return apiError(msg, "INVALID_FILE", 400);
    }

    // Register document in PostgreSQL database
    let document;
    try {
      document = await DocumentProcessor.registerDocument({
        bookId,
        academicYearId,
        fileName,
        fileSize: storedMeta.fileSize,
        mimeType: storedMeta.mimeType,
        storagePath: storedMeta.storagePath,
        checksum: storedMeta.checksum,
      });
    } catch (regErr: unknown) {
      const msg = regErr instanceof Error ? regErr.message : "Document registration failed";
      const status = msg.includes("Duplicate Document") ? 409 : 400;
      return apiError(msg, "DOCUMENT_REGISTRATION_ERROR", status);
    }

    // Auto-process if requested
    let qualityReport = null;
    if (autoProcess) {
      try {
        qualityReport = await DocumentProcessor.processDocument(document.id);
      } catch (procErr: unknown) {
        console.warn(`[API:upload-chunk] Auto-process encountered issue:`, procErr);
      }
    }

    const payload = {
      id: document.id,
      bookId: document.bookId,
      bookTitle: book.title,
      fileName: document.fileName,
      fileSize: Number(document.fileSize),
      mimeType: document.mimeType,
      checksum: document.checksum,
      status: qualityReport ? qualityReport.status : document.status,
      qualityReport,
      createdAt: document.createdAt.toISOString(),
      completed: true,
    };

    return apiSuccess(payload, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process chunked upload";
    return apiError(message, "CHUNK_UPLOAD_ERROR", 500);
  }
}
