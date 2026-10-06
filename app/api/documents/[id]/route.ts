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
      include: {
        book: {
          include: {
            subject: {
              include: {
                class: {
                  include: {
                    academicYear: {
                      include: {
                        board: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            pages: true,
            chunks: true,
            elements: true,
          },
        },
      },
    });

    if (!doc) {
      return apiError(`Document with ID "${id}" was not found.`, "DOCUMENT_NOT_FOUND", 404);
    }

    return apiSuccess({
      id: doc.id,
      bookId: doc.bookId,
      bookTitle: doc.book.title,
      subjectName: doc.book.subject.name,
      className: doc.book.subject.class.name,
      boardName: doc.book.subject.class.academicYear.board.name,
      fileName: doc.fileName,
      fileSize: Number(doc.fileSize),
      mimeType: doc.mimeType,
      checksum: doc.checksum,
      status: doc.status,
      pageCount: doc.pageCount,
      totalChunks: doc._count.chunks,
      totalElements: doc._count.elements,
      qualityReport: doc.qualityReport,
      processingLogs: doc.processingLogs,
      errorMessage: doc.errorMessage,
      processingStartedAt: doc.processingStartedAt?.toISOString() || null,
      processingCompletedAt: doc.processingCompletedAt?.toISOString() || null,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve document";
    return apiError(message, "DOCUMENT_FETCH_ERROR", 500);
  }
}
