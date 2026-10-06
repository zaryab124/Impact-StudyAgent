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

    const items = await prisma.syllabusChapterItem.findMany({
      where: { syllabusId: id },
      include: {
        chapter: true,
      },
      orderBy: { chapter: { chapterNumber: "asc" } },
    });

    const serialized = items.map((item) => ({
      id: item.id,
      syllabusId: item.syllabusId,
      chapterId: item.chapterId,
      chapterNumber: item.chapter.chapterNumber,
      chapterTitle: item.chapter.title,
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
    }));

    return apiSuccess({
      syllabusId: id,
      total: serialized.length,
      chapters: serialized,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch syllabus chapters";
    return apiError(message, "CHAPTERS_FETCH_ERROR", 500);
  }
}
