import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { DocumentStorageService } from "@/lib/storage/document-store";
import { DocumentProcessor } from "@/server/book-intelligence/document-processor";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bookId = formData.get("bookId") as string | null;
    const academicYearId = (formData.get("academicYearId") as string | null) || undefined;
    const autoProcess = formData.get("autoProcess") === "true";

    if (!file) {
      return apiError("No file provided. A PDF file is required.", "MISSING_FILE", 400);
    }

    if (!bookId) {
      return apiError("Missing required parameter: bookId.", "MISSING_BOOK_ID", 400);
    }

    // Verify book exists in database
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: { subject: { include: { class: true } } },
    });

    if (!book) {
      return apiError(`Referenced Book with ID "${bookId}" was not found.`, "BOOK_NOT_FOUND", 404);
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to disk (performs magic bytes validation, size limit, and checksum hashing)
    let storedMeta;
    try {
      storedMeta = await DocumentStorageService.saveDocument(buffer, file.name);
    } catch (storeErr: unknown) {
      const msg = storeErr instanceof Error ? storeErr.message : "File validation failed";
      return apiError(msg, "INVALID_FILE", 400);
    }

    // Register document in database
    let document;
    try {
      document = await DocumentProcessor.registerDocument({
        bookId,
        academicYearId,
        fileName: file.name,
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
        console.warn(`[API:upload] Auto-process encountered issue:`, procErr);
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
    };

    return apiSuccess(payload, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to upload document";
    return apiError(message, "UPLOAD_ERROR", 500);
  }
}
