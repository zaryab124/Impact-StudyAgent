// ==============================================================================
// AI Live Paper Generator - Teacher Manual Score Override API (Phase 9)
// POST /api/exams/[attemptId]/override
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ScoreOverrideRequestSchema } from "@/lib/validations/exam-engine";
import { ExamService } from "@/server/exam-engine/exam-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params;
    const rawBody = await req.json();

    const parsed = ScoreOverrideRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError(
        "Invalid score override parameters.",
        "VALIDATION_ERROR",
        400,
        parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          issue: e.message,
        }))
      );
    }

    const { paperQuestionId, newMarks, reason } = parsed.data;
    const reviewerId = rawBody.reviewerId || "teacher-examiner";

    const updatedResult = await ExamService.overrideScore(
      attemptId,
      paperQuestionId,
      newMarks,
      reason,
      reviewerId
    );

    return apiSuccess({
      result: updatedResult,
      message: "Score successfully overridden and result recalculated.",
    });
  } catch (error: any) {
    return apiError(error?.message || "Failed to override score.", "OVERRIDE_FAILED", 400);
  }
}
