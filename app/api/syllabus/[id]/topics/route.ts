import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const syllabus = await prisma.syllabus.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!syllabus) {
      return apiError(`Syllabus with ID "${id}" was not found.`, "SYLLABUS_NOT_FOUND", 404);
    }

    const items = await prisma.syllabusTopicItem.findMany({
      where: { syllabusId: id },
      include: {
        topic: {
          include: { chapter: true },
        },
        topicMappings: {
          include: { topic: true },
        },
      },
      orderBy: [{ topic: { chapter: { chapterNumber: "asc" } } }, { topic: { orderIndex: "asc" } }],
    });

    const serialized = items.map((item) => ({
      id: item.id,
      syllabusId: item.syllabusId,
      topicId: item.topicId,
      topicCode: item.topic.topicCode,
      topicTitle: item.topic.title,
      chapterNumber: item.topic.chapter?.chapterNumber || 1,
      isIncluded: item.isIncluded,
      weightage: item.weightage,
      examinationRelevance: item.examinationRelevance,
      alignmentStatus: item.alignmentStatus,
      confidence: item.confidence,
      eligibility: item.eligibility,
      notes: item.notes,
      reviewNotes: item.reviewNotes,
      reviewedBy: item.reviewedBy,
      reviewedAt: item.reviewedAt?.toISOString() || null,
      mappings: item.topicMappings.map((m) => ({
        id: m.id,
        topicId: m.topicId,
        topicCode: m.topic.topicCode,
        topicTitle: m.topic.title,
        alignmentStatus: m.alignmentStatus,
        confidence: m.confidence,
        notes: m.notes,
      })),
    }));

    return apiSuccess({
      syllabusId: id,
      total: serialized.length,
      topics: serialized,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch syllabus topics";
    return apiError(message, "TOPICS_FETCH_ERROR", 500);
  }
}
