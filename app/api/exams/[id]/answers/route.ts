// ==============================================================================
// AI Live Paper Generator - Autosave Student Answer API (Phase 9)
// POST /api/exams/[attemptId]/answers
// STRICT INVARIANT: Enforces server-authoritative timer. Rejects saves if expired.
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { SaveAnswerRequestSchema } from "@/lib/validations/exam-engine";
import { ExamService } from "@/server/exam-engine/exam-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params;
    const rawBody = await req.json();

    const parsed = SaveAnswerRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError(
        "Invalid answer save parameters.",
        "VALIDATION_ERROR",
        400,
        parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          issue: e.message,
        }))
      );
    }

    const savedAnswer = await ExamService.saveAnswer(attemptId, parsed.data);
    return apiSuccess({ answer: savedAnswer, savedAt: savedAnswer.savedAt });
  } catch (error: any) {
    const msg = error?.message || "Failed to save answer.";
    if (msg.includes("ATTEMPT_EXPIRED")) {
      return apiError(msg, "ATTEMPT_EXPIRED", 403);
    }
    return apiError(msg, "SAVE_ANSWER_FAILED", 400);
  }
}
