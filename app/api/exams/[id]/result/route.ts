// ==============================================================================
// AI Live Paper Generator - Student Result Review API (Phase 9)
// GET /api/exams/[attemptId]/result
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ExamService } from "@/server/exam-engine/exam-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params;
    const review = await ExamService.getStudentResultReview(attemptId);
    return apiSuccess(review);
  } catch (error: any) {
    return apiError(error?.message || "Failed to retrieve examination result.", "RESULT_NOT_FOUND", 404);
  }
}
