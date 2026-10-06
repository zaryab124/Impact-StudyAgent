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

    const [excludedChapters, excludedTopics] = await Promise.all([
      prisma.syllabusChapterItem.findMany({
        where: {
          syllabusId: id,
          OR: [{ isIncluded: false }, { eligibility: "EXCLUDED" }],
        },
        include: { chapter: true },
      }),
      prisma.syllabusTopicItem.findMany({
        where: {
          syllabusId: id,
          OR: [{ isIncluded: false }, { eligibility: "EXCLUDED" }],
        },
        include: {
          topic: { include: { chapter: true } },
        },
      }),
    ]);

    return apiSuccess({
      syllabusId: id,
      totalExcludedChapters: excludedChapters.length,
      totalExcludedTopics: excludedTopics.length,
      excludedChapters: excludedChapters.map((ci) => ({
        id: ci.id,
        chapterId: ci.chapterId,
        chapterNumber: ci.chapter.chapterNumber,
        title: ci.chapter.title,
        isIncluded: ci.isIncluded,
        eligibility: ci.eligibility,
        weightage: ci.weightage,
        relevance: ci.examinationRelevance,
        notes: ci.notes,
      })),
      excludedTopics: excludedTopics.map((ti) => ({
        id: ti.id,
        topicId: ti.topicId,
        topicCode: ti.topic.topicCode,
        title: ti.topic.title,
        chapterNumber: ti.topic.chapter?.chapterNumber || 1,
        isIncluded: ti.isIncluded,
        eligibility: ti.eligibility,
        weightage: ti.weightage,
        relevance: ti.examinationRelevance,
        notes: ti.notes,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch excluded content";
    return apiError(message, "EXCLUDED_CONTENT_ERROR", 500);
  }
}
