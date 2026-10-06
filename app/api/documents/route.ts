import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { DocumentStatus } from "@/types/knowledge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const bookId = searchParams.get("bookId") || undefined;
    const status = (searchParams.get("status") as DocumentStatus) || undefined;
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    const where: any = {};
    if (bookId) where.bookId = bookId;
    if (status) where.status = status;

    const [total, documents] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              subject: {
                select: {
                  id: true,
                  name: true,
                  class: {
                    select: {
                      id: true,
                      name: true,
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
      }),
    ]);

    const serialized = documents.map((doc) => ({
      id: doc.id,
      bookId: doc.bookId,
      bookTitle: doc.book.title,
      subjectName: doc.book.subject.name,
      className: doc.book.subject.class.name,
      fileName: doc.fileName,
      fileSize: Number(doc.fileSize),
      mimeType: doc.mimeType,
      checksum: doc.checksum,
      status: doc.status,
      pageCount: doc.pageCount,
      totalChunks: doc._count.chunks,
      totalElements: doc._count.elements,
      qualityReport: doc.qualityReport,
      errorMessage: doc.errorMessage,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    }));

    return apiSuccess({
      total,
      limit,
      offset,
      documents: serialized,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch documents";
    return apiError(message, "DOCUMENTS_FETCH_ERROR", 500);
  }
}
