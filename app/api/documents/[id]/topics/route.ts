import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = req.nextUrl;
    const chapterId = searchParams.get("chapterId") || undefined;

    const doc = await prisma.document.findUnique({
      where: { id },
      select: { id: true, bookId: true },
    });

    if (!doc) {
      return apiError(`Document with ID "${id}" was not found.`, "DOCUMENT_NOT_FOUND", 404);
    }

    const topics = await prisma.topic.findMany({
      where: {
        chapter: {
          bookId: doc.bookId,
          ...(chapterId ? { id: chapterId } : {}),
        },
      },
      include: {
        chapter: {
          select: {
            id: true,
            chapterNumber: true,
            title: true,
          },
        },
        _count: {
          select: {
            chunks: { where: { documentId: id } },
            elements: { where: { documentId: id } },
          },
        },
      },
      orderBy: [{ chapter: { chapterNumber: "asc" } }, { orderIndex: "asc" }],
    });

    const serialized = topics.map((t) => ({
      id: t.id,
      chapterId: t.chapterId,
      chapterNumber: t.chapter.chapterNumber,
      chapterTitle: t.chapter.title,
      topicCode: t.topicCode,
      title: t.title,
      description: t.description,
      orderIndex: t.orderIndex,
      learningOutcomes: t.learningOutcomes,
      chunkCount: t._count.chunks,
      elementCount: t._count.elements,
    }));

    return apiSuccess({
      documentId: id,
      bookId: doc.bookId,
      total: serialized.length,
      topics: serialized,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch document topics";
    return apiError(message, "TOPICS_FETCH_ERROR", 500);
  }
}
