// ==============================================================================
// AI Live Paper Generator - Book Processing Status API (Phase 12)
// GET /api/books/status
// Retrieves the processing status, page count, and quality report of a textbook
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");
    const bookId = searchParams.get("bookId");

    if (!documentId && !bookId) {
      return apiError("Missing required query parameter: documentId or bookId.", "MISSING_IDENTIFIER", 400);
    }

    let doc: any = null;
    try {
      if (documentId) {
        doc = await prisma.document.findUnique({
          where: { id: documentId },
          select: {
            id: true,
            bookId: true,
            status: true,
            pageCount: true,
            processingLogs: true,
            errorMessage: true,
            processingStartedAt: true,
            processingCompletedAt: true,
            qualityReport: true,
          },
        });
      } else if (bookId) {
        doc = await prisma.document.findFirst({
          where: { bookId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            bookId: true,
            status: true,
            pageCount: true,
            processingLogs: true,
            errorMessage: true,
            processingStartedAt: true,
            processingCompletedAt: true,
            qualityReport: true,
          },
        });
      }
    } catch {
      // Mock / fallback
    }

    if (!doc) {
      const identifier = documentId || bookId;
      return apiError(`Document record for "${identifier}" was not found.`, "DOCUMENT_NOT_FOUND", 404);
    }

    return apiSuccess({
      id: doc.id,
      bookId: doc.bookId,
      status: doc.status,
      pageCount: doc.pageCount,
      processingLogs: doc.processingLogs || [],
      errorMessage: doc.errorMessage,
      processingStartedAt: doc.processingStartedAt ? new Date(doc.processingStartedAt).toISOString() : null,
      processingCompletedAt: doc.processingCompletedAt ? new Date(doc.processingCompletedAt).toISOString() : null,
      qualityReport: doc.qualityReport,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch document status";
    return apiError(message, "DOCUMENT_STATUS_ERROR", 500);
  }
}
