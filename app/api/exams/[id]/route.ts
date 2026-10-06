// ==============================================================================
// AI Live Paper Generator - Exam Attempt State & Paper Detail API (Phase 9)
// GET /api/exams/[id]
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ExamRepository } from "@/server/exam-engine/exam-repository";
import { ExamService } from "@/server/exam-engine/exam-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if it's an attempt
    const attempt = await ExamRepository.findAttemptById(id);
    if (attempt) {
      const roleHeader = req.headers.get("x-user-role");
      const userIdHeader = req.headers.get("x-user-id");
      if (roleHeader === "STUDENT" && userIdHeader && userIdHeader !== attempt.studentId) {
        return apiError("Forbidden: Cannot access another student's exam attempt.", "FORBIDDEN", 403);
      }
      const attemptState = await ExamService.getStudentAttemptState(id);
      return apiSuccess(attemptState);
    }

    // Check if it's a paper
    const paper = await ExamRepository.findPaperById(id);
    if (paper) {
      const { searchParams } = new URL(req.url);
      const forStudent = searchParams.get("forStudent") === "true";
      if (forStudent) {
        return apiSuccess(ExamService.getStudentPaperView(paper));
      }
      return apiSuccess(paper);
    }

    return apiError(`Exam entity "${id}" not found.`, "NOT_FOUND", 404);
  } catch (error: any) {
    return apiError(error?.message || "Failed to retrieve exam data.", "INTERNAL_ERROR", 500);
  }
}
