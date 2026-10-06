// ==============================================================================
// AI Live Paper Generator - Result Detail API (Phase 12)
// GET /api/results/[id]
// Retrieves comprehensive evaluation scorecard and detailed review for an attempt
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ExamService } from "@/server/exam-engine/exam-service";
import { ExamRepository } from "@/server/exam-engine/exam-repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const attempt = await ExamRepository.findAttemptById(id);
    const roleHeader = req.headers.get("x-user-role");
    const userIdHeader = req.headers.get("x-user-id");
    if (attempt && roleHeader === "STUDENT" && userIdHeader && userIdHeader !== attempt.studentId) {
      return apiError("Forbidden: Cannot access another student's examination result.", "FORBIDDEN", 403);
    }

    // 1. Try fetching detailed review through ExamService
    try {
      const review = await ExamService.getStudentResultReview(id);
      return apiSuccess(review);
    } catch {
      // Fallback: check ExamRepository
      const result = await ExamRepository.findResultByAttemptId(id);
      if (result) {
        return apiSuccess({ result });
      }
    }

    return apiError(`Examination result for "${id}" was not found.`, "RESULT_NOT_FOUND", 404);
  } catch (error: any) {
    return apiError(error?.message || "Failed to retrieve examination result.", "INTERNAL_ERROR", 500);
  }
}
