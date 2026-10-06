// ==============================================================================
// AI Live Paper Generator - Autosave Student Answer API (Phase 12 Alias)
// POST /api/exams/[attemptId]/answer
// STRICT INVARIANT: Enforces server-authoritative timer. Rejects saves if expired.
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { SaveAnswerRequestSchema } from "@/lib/validations/exam-engine";
import { ExamService } from "@/server/exam-engine/exam-service";
import { ExamRepository } from "@/server/exam-engine/exam-repository";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params;

    const attempt = await ExamRepository.findAttemptById(attemptId);
    if (!attempt) {
      return apiError(`Attempt "${attemptId}" not found.`, "NOT_FOUND", 404);
    }

    const roleHeader = req.headers.get("x-user-role");
    const userIdHeader = req.headers.get("x-user-id");
    if (roleHeader === "STUDENT" && userIdHeader && userIdHeader !== attempt.studentId) {
      return apiError("Forbidden: Cannot modify answers for another student's attempt.", "FORBIDDEN", 403);
    }

    if (attempt.status === "EXPIRED") {
      return apiError(`ATTEMPT_EXPIRED: Exam time limit (${attempt.durationMinutes} mins) has expired. No further answers can be saved.`, "ATTEMPT_EXPIRED", 400);
    }

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

    // Verify question belongs to the paper
    const paper = await ExamRepository.findPaperById(attempt.paperId);
    if (paper && paper.questions && !paper.questions.some((q: any) => q.id === parsed.data.paperQuestionId)) {
      return apiError(`INVALID_QUESTION: Question "${parsed.data.paperQuestionId}" does not belong to this exam paper.`, "INVALID_QUESTION", 400);
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
