// ==============================================================================
// AI Live Paper Generator - Sample Paper Analysis Breakdown API
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { SamplePaperService } from "@/server/sample-paper/sample-paper-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const paper = await SamplePaperService.getSamplePaperById(id);

    if (!paper) {
      return apiError(`Sample paper not found with ID: ${id}`, "NOT_FOUND", 404);
    }

    const questions = await SamplePaperService.getQuestionsForPaper(id);

    return apiSuccess({
      samplePaperId: paper.id,
      title: paper.title,
      year: paper.year,
      totalMarks: paper.totalMarks,
      durationMinutes: paper.durationMinutes,
      status: paper.status,
      extractedStructure: paper.extractedStructure,
      arithmeticValidation: paper.arithmeticValidation,
      observedDifficulty: paper.qualityReport?.observedDifficulty || null,
      qualityReport: paper.qualityReport,
      questionsSummary: {
        total: questions.length,
        mcqCount: questions.filter((q) => q.primaryType === "MCQ").length,
        shortCount: questions.filter((q) => q.primaryType === "SHORT").length,
        longCount: questions.filter((q) => q.primaryType === "LONG").length,
        numericalCount: questions.filter((q) => q.primaryType === "NUMERICAL").length,
        reviewRequiredCount: questions.filter((q) => q.needsReview).length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve analysis";
    return apiError(message, "ANALYSIS_FETCH_ERROR", 500);
  }
}
