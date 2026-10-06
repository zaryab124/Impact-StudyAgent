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
            chapters: {
              orderBy: { chapterNumber: "asc" },
              include: {
                _count: {
                  select: {
                    chunks: { where: { documentId: id } },
                    elements: { where: { documentId: id } },
                    topics: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!doc) {
      return apiError(`Document with ID "${id}" was not found.`, "DOCUMENT_NOT_FOUND", 404);
    }

    const chapters = doc.book.chapters.map((ch) => ({
      id: ch.id,
      bookId: ch.bookId,
      chapterNumber: ch.chapterNumber,
      title: ch.title,
      description: ch.description,
      orderIndex: ch.orderIndex,
      topicCount: ch._count.topics,
      chunkCount: ch._count.chunks,
      elementCount: ch._count.elements,
    }));

    return apiSuccess({
      documentId: id,
      bookId: doc.bookId,
      total: chapters.length,
      chapters,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch document chapters";
    return apiError(message, "CHAPTERS_FETCH_ERROR", 500);
  }
}
