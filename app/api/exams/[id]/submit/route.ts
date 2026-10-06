// ==============================================================================
// AI Live Paper Generator - Submit Attempt API (Phase 9)
// POST /api/exams/[attemptId]/submit
// STRICT INVARIANT: Idempotent evaluation; triggers deterministic scoring & result.
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { SubmitAttemptRequestSchema } from "@/lib/validations/exam-engine";
import { ExamService } from "@/server/exam-engine/exam-service";
import { ExamRepository } from "@/server/exam-engine/exam-repository";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params;

    const existingAttempt = await ExamRepository.findAttemptById(attemptId);
    if (!existingAttempt) {
      return apiError(`Attempt "${attemptId}" not found.`, "NOT_FOUND", 404);
    }

    const roleHeader = req.headers.get("x-user-role");
    const userIdHeader = req.headers.get("x-user-id");
    if (roleHeader === "STUDENT" && userIdHeader && userIdHeader !== existingAttempt.studentId) {
      return apiError("Forbidden: Cannot submit another student's exam attempt.", "FORBIDDEN", 403);
    }

    if (existingAttempt.status === "EXPIRED") {
      return apiError("ATTEMPT_EXPIRED: Expired exam rejects normal submission.", "ATTEMPT_EXPIRED", 400);
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Default confirm if body omitted or empty
      body = { confirmSubmission: true };
    }

    const parsed = SubmitAttemptRequestSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        "Submission must be explicitly confirmed.",
        "VALIDATION_ERROR",
        400,
        parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          issue: e.message,
        }))
      );
    }

    const { attempt, result } = await ExamService.submitAttempt(attemptId);

    return apiSuccess({
      attempt,
      result,
      message: "Examination submitted successfully and evaluated.",
    });
  } catch (error: any) {
    return apiError(error?.message || "Failed to submit examination attempt.", "SUBMIT_FAILED", 400);
  }
}
