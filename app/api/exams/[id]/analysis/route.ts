// ==============================================================================
// AI Live Paper Generator - Multi-Dimensional Performance Analysis API (Phase 9)
// GET /api/exams/[attemptId]/analysis
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ExamRepository } from "@/server/exam-engine/exam-repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params;
    const result = await ExamRepository.findResultByAttemptId(attemptId);
    if (!result) {
      return apiError(`Result for attempt "${attemptId}" not found.`, "NOT_FOUND", 404);
    }

    return apiSuccess({
      attemptId,
      paperCode: result.paperCode,
      paperTitle: result.paperTitle,
      totalMarks: result.totalMarks,
      obtainedMarks: result.obtainedMarks,
      percentage: result.percentage,
      grade: result.grade,
      status: result.status,
      sectionBreakdown: result.sectionBreakdown,
      difficultyBreakdown: result.difficultyBreakdown,
      chapterBreakdown: result.chapterBreakdown,
      topicBreakdown: result.topicBreakdown,
      questionTypeBreakdown: result.questionTypeBreakdown,
      evaluatedAt: result.evaluatedAt,
    });
  } catch (error: any) {
    return apiError(error?.message || "Failed to retrieve analysis.", "INTERNAL_ERROR", 500);
  }
}
