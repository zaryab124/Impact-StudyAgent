// ==============================================================================
// AI Live Paper Generator - Paper Pattern Details API
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pattern = await prisma.paperPattern.findUnique({
      where: { id },
      include: {
        subject: { select: { name: true } },
        board: { select: { name: true } },
        academicYear: { select: { name: true } },
        class: { select: { name: true } },
        samplePaperLinks: {
          include: {
            samplePaper: { select: { id: true, title: true, year: true, status: true } },
          },
        },
      },
    });

    if (!pattern) {
      return apiError(`Examination pattern not found with ID: ${id}`, "NOT_FOUND", 404);
    }

    const payload = {
      id: pattern.id,
      title: pattern.title,
      version: pattern.version,
      subjectId: pattern.subjectId,
      subjectName: pattern.subject?.name || null,
      boardId: pattern.boardId,
      boardName: pattern.board?.name || null,
      academicYearId: pattern.academicYearId,
      academicYearName: pattern.academicYear?.name || null,
      classId: pattern.classId,
      className: pattern.class?.name || null,
      syllabusId: pattern.syllabusId,
      totalMarks: pattern.totalMarks,
      durationMinutes: pattern.durationMinutes,
      status: pattern.status,
      patternConfidence: pattern.patternConfidence,
      supportingSampleCount: pattern.supportingSampleCount,
      aggregationLevel: pattern.aggregationLevel,
      sectionStructure: pattern.sectionStructure,
      questionDistribution: pattern.questionDistribution,
      marksDistribution: pattern.marksDistribution,
      difficultyObservations: pattern.difficultyObservations,
      targetDifficulty: pattern.targetDifficulty,
      wordingCharacteristics: pattern.wordingCharacteristics,
      contributingPapers: pattern.samplePaperLinks.map((l: any) => ({
        samplePaperId: l.samplePaperId,
        title: l.samplePaper.title,
        year: l.samplePaper.year,
        isOutlier: l.isOutlier,
        outlierReason: l.outlierReason,
      })),
      validationReport: pattern.validationReport,
      createdAt: pattern.createdAt.toISOString(),
      updatedAt: pattern.updatedAt.toISOString(),
    };

    return apiSuccess(payload);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve pattern";
    return apiError(message, "PATTERN_FETCH_ERROR", 500);
  }
}
