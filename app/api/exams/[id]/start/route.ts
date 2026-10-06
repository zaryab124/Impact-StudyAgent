// ==============================================================================
// AI Live Paper Generator - Start Exam Attempt API (Phase 9)
// POST /api/exams/[paperId]/start
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ExamService } from "@/server/exam-engine/exam-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paperId } = await params;
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // JSON body is optional
    }

    const studentId = body?.studentId || "student_demo_001";
    const studentName = body?.studentName || "Demo Student";

    const { attempt, paper } = await ExamService.startAttempt(paperId, studentId, studentName);

    return apiSuccess({ attempt, paper }, 201);
  } catch (error: any) {
    const msg = error?.message || "Failed to start exam attempt.";
    return apiError(msg, "ATTEMPT_START_FAILED", 400);
  }
}
