import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { ElementType } from "@/types/knowledge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = req.nextUrl;

    const type = (searchParams.get("type") as ElementType) || undefined;
    const chapterId = searchParams.get("chapterId") || undefined;
    const topicId = searchParams.get("topicId") || undefined;
    const pageNumber = searchParams.get("pageNumber") ? parseInt(searchParams.get("pageNumber")!, 10) : undefined;
    const isAiDerived = searchParams.has("isAiDerived") ? searchParams.get("isAiDerived") === "true" : undefined;
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    const doc = await prisma.document.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!doc) {
      return apiError(`Document with ID "${id}" was not found.`, "DOCUMENT_NOT_FOUND", 404);
    }

    const where: any = {
      documentId: id,
    };
    if (type) where.type = type;
    if (chapterId) where.chapterId = chapterId;
    if (topicId) where.topicId = topicId;
    if (pageNumber !== undefined) where.pageNumber = pageNumber;
    if (isAiDerived !== undefined) where.isAiDerived = isAiDerived;

    const [total, elements] = await Promise.all([
      prisma.educationalElement.count({ where }),
      prisma.educationalElement.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [{ pageNumber: "asc" }, { createdAt: "asc" }],
        include: {
          chapter: { select: { id: true, chapterNumber: true, title: true } },
          topic: { select: { id: true, topicCode: true, title: true } },
        },
      }),
    ]);

    const serialized = elements.map((el) => ({
      id: el.id,
      documentId: el.documentId,
      pageNumber: el.pageNumber,
      chapterId: el.chapterId,
      chapterNumber: el.chapter?.chapterNumber || null,
      chapterTitle: el.chapter?.title || null,
      topicId: el.topicId,
      topicCode: el.topic?.topicCode || null,
      topicTitle: el.topic?.title || null,
      chunkId: el.chunkId,
      type: el.type,
      title: el.title,
      content: el.content,
      sourceText: el.sourceText,
      isAiDerived: el.isAiDerived,
      confidence: el.confidence,
      createdAt: el.createdAt.toISOString(),
    }));

    return apiSuccess({
      documentId: id,
      total,
      limit,
      offset,
      elements: serialized,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch educational elements";
    return apiError(message, "ELEMENTS_FETCH_ERROR", 500);
  }
}
