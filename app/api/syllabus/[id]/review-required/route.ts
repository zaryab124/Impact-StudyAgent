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
      select: { id: true, title: true, version: true },
    });

    if (!syllabus) {
      return apiError(`Syllabus with ID "${id}" was not found.`, "SYLLABUS_NOT_FOUND", 404);
    }

    const [reviewChapters, reviewTopics] = await Promise.all([
      prisma.syllabusChapterItem.findMany({
        where: {
          syllabusId: id,
          alignmentStatus: "REQUIRES_REVIEW",
        },
        include: { chapter: true },
      }),
      prisma.syllabusTopicItem.findMany({
        where: {
          syllabusId: id,
          alignmentStatus: "REQUIRES_REVIEW",
        },
        include: {
          topic: { include: { chapter: true } },
          topicMappings: { include: { topic: true } },
        },
      }),
    ]);

    return apiSuccess({
      syllabusId: id,
      totalReviewRequired: reviewChapters.length + reviewTopics.length,
      reviewChapters: reviewChapters.map((ci) => ({
        id: ci.id,
        chapterId: ci.chapterId,
        chapterNumber: ci.chapter.chapterNumber,
        title: ci.chapter.title,
        confidence: ci.confidence,
        reviewNotes: ci.reviewNotes,
        reviewedBy: ci.reviewedBy,
      })),
      reviewTopics: reviewTopics.map((ti) => ({
        id: ti.id,
        topicId: ti.topicId,
        topicCode: ti.topic.topicCode,
        title: ti.topic.title,
        chapterNumber: ti.topic.chapter?.chapterNumber || 1,
        confidence: ti.confidence,
        candidateMappingsCount: ti.topicMappings.length,
        candidateMappings: ti.topicMappings.map((m) => ({
          mappingId: m.id,
          candidateTopicId: m.topicId,
          candidateTopicTitle: m.topic.title,
          candidateTopicCode: m.topic.topicCode,
          confidence: m.confidence,
        })),
        reviewNotes: ti.reviewNotes,
        reviewedBy: ti.reviewedBy,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch review-required items";
    return apiError(message, "REVIEW_REQUIRED_ERROR", 500);
  }
}
