import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const doc = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        pageCount: true,
        processingLogs: true,
        errorMessage: true,
        processingStartedAt: true,
        processingCompletedAt: true,
        qualityReport: true,
      },
    });

    if (!doc) {
      return apiError(`Document with ID "${id}" was not found.`, "DOCUMENT_NOT_FOUND", 404);
    }

    return apiSuccess({
      id: doc.id,
      status: doc.status,
      pageCount: doc.pageCount,
      processingLogs: doc.processingLogs || [],
      errorMessage: doc.errorMessage,
      processingStartedAt: doc.processingStartedAt?.toISOString() || null,
      processingCompletedAt: doc.processingCompletedAt?.toISOString() || null,
      qualityReport: doc.qualityReport,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch document status";
    return apiError(message, "DOCUMENT_STATUS_ERROR", 500);
  }
}
