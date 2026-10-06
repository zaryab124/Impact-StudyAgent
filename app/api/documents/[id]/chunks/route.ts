import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { ChunkType } from "@/types/knowledge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = req.nextUrl;

    const chunkType = (searchParams.get("chunkType") as ChunkType) || undefined;
    const chapterId = searchParams.get("chapterId") || undefined;
    const topicId = searchParams.get("topicId") || undefined;
    const pageNumber = searchParams.get("pageNumber") ? parseInt(searchParams.get("pageNumber")!, 10) : undefined;
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
    if (chunkType) where.chunkType = chunkType;
    if (chapterId) where.chapterId = chapterId;
    if (topicId) where.topicId = topicId;
    if (pageNumber !== undefined) {
      where.page = { pageNumber };
    }

    const [total, chunks] = await Promise.all([
      prisma.documentChunk.count({ where }),
      prisma.documentChunk.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [{ page: { pageNumber: "asc" } }, { orderIndex: "asc" }],
        include: {
          page: { select: { pageNumber: true } },
          chapter: { select: { id: true, chapterNumber: true, title: true } },
          topic: { select: { id: true, topicCode: true, title: true } },
        },
      }),
    ]);

    const serialized = chunks.map((c) => ({
      id: c.id,
      documentId: c.documentId,
      pageId: c.pageId,
      pageNumber: c.page.pageNumber,
      chapterId: c.chapterId,
      chapterNumber: c.chapter?.chapterNumber || null,
      chapterTitle: c.chapter?.title || null,
      topicId: c.topicId,
      topicCode: c.topic?.topicCode || null,
      topicTitle: c.topic?.title || null,
      chunkIndex: c.chunkIndex,
      content: c.content,
      tokenCount: c.tokenCount,
      chunkType: c.chunkType,
      heading: c.heading,
      orderIndex: c.orderIndex,
      confidence: c.confidence,
      extractionMethod: c.extractionMethod,
      embeddingStatus: c.embeddingStatus,
      embeddingModel: c.embeddingModel,
      metadata: c.metadata,
      createdAt: c.createdAt.toISOString(),
    }));

    return apiSuccess({
      documentId: id,
      total,
      limit,
      offset,
      chunks: serialized,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch document chunks";
    return apiError(message, "CHUNKS_FETCH_ERROR", 500);
  }
}
