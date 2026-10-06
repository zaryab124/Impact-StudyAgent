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
      include: {
        board: true,
        academicYear: true,
        class: true,
        subject: true,
        chapterItems: {
          include: { chapter: true },
          orderBy: { chapter: { chapterNumber: "asc" } },
        },
        topicItems: {
          include: {
            topic: { include: { chapter: true } },
            topicMappings: { include: { topic: true } },
          },
          orderBy: [{ topic: { chapter: { chapterNumber: "asc" } } }, { topic: { orderIndex: "asc" } }],
        },
      },
    });

    if (!syllabus) {
      return apiError(`Syllabus with ID "${id}" was not found.`, "SYLLABUS_NOT_FOUND", 404);
    }

    const totalChapters = syllabus.chapterItems.length;
    const matchedChapters = syllabus.chapterItems.filter((c) => c.alignmentStatus === "MATCHED").length;
    const partiallyMatchedChapters = syllabus.chapterItems.filter((c) => c.alignmentStatus === "PARTIAL_MATCH").length;
    const unmatchedChapters = syllabus.chapterItems.filter((c) => c.alignmentStatus === "UNMATCHED").length;
    const excludedChapters = syllabus.chapterItems.filter((c) => !c.isIncluded).length;
    const reviewRequiredChapters = syllabus.chapterItems.filter((c) => c.alignmentStatus === "REQUIRES_REVIEW").length;

    const totalTopics = syllabus.topicItems.length;
    const matchedTopics = syllabus.topicItems.filter((t) => t.alignmentStatus === "MATCHED").length;
    const partiallyMatchedTopics = syllabus.topicItems.filter((t) => t.alignmentStatus === "PARTIAL_MATCH").length;
    const unmatchedTopics = syllabus.topicItems.filter((t) => t.alignmentStatus === "UNMATCHED").length;
    const excludedTopics = syllabus.topicItems.filter((t) => !t.isIncluded).length;
    const reviewRequiredTopics = syllabus.topicItems.filter((t) => t.alignmentStatus === "REQUIRES_REVIEW").length;

    const matchedTotal = matchedChapters + matchedTopics;
    const grandTotal = totalChapters + totalTopics;
    const overallCoveragePct =
      grandTotal > 0 ? Number(((matchedTotal / grandTotal) * 100).toFixed(1)) : 100;

    return apiSuccess({
      syllabusId: syllabus.id,
      title: syllabus.title,
      version: syllabus.version,
      status: syllabus.status,
      boardName: syllabus.board?.name || "General Board",
      academicYearName: syllabus.academicYear.name,
      className: syllabus.class.name,
      subjectName: syllabus.subject.name,
      totalSyllabusChapters: totalChapters,
      matchedChapters,
      partiallyMatchedChapters,
      unmatchedChapters,
      excludedChapters,
      reviewRequiredChapters,
      totalSyllabusTopics: totalTopics,
      matchedTopics,
      partiallyMatchedTopics,
      unmatchedTopics,
      excludedTopics,
      reviewRequiredTopics,
      overallCoveragePct,
      chapters: syllabus.chapterItems.map((c) => ({
        chapterId: c.chapterId,
        chapterNumber: c.chapter.chapterNumber,
        title: c.chapter.title,
        isIncluded: c.isIncluded,
        weightage: c.weightage,
        alignmentStatus: c.alignmentStatus,
        eligibility: c.eligibility,
        confidence: c.confidence,
        reviewNotes: c.reviewNotes,
      })),
      topics: syllabus.topicItems.map((t) => ({
        topicId: t.topicId,
        topicCode: t.topic.topicCode,
        title: t.topic.title,
        chapterNumber: t.topic.chapter?.chapterNumber || 1,
        isIncluded: t.isIncluded,
        weightage: t.weightage,
        alignmentStatus: t.alignmentStatus,
        eligibility: t.eligibility,
        confidence: t.confidence,
        mappedBookTopicsCount: t.topicMappings.length,
        reviewNotes: t.reviewNotes,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve alignment summary";
    return apiError(message, "ALIGNMENT_FETCH_ERROR", 500);
  }
}
