import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { DocumentProcessor } from "@/server/book-intelligence/document-processor";
import { prisma } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const doc = await prisma.document.findUnique({
      where: { id },
    });

    if (!doc) {
      return apiError(`Document with ID "${id}" was not found.`, "DOCUMENT_NOT_FOUND", 404);
    }

    // Run processing pipeline
    const qualityReport = await DocumentProcessor.processDocument(id);

    return apiSuccess({
      documentId: id,
      status: qualityReport.status,
      qualityReport,
      message: "Document processing pipeline completed successfully.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Document processing failed";
    return apiError(message, "PROCESSING_ERROR", 500);
  }
}
