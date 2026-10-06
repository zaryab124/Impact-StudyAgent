// ==============================================================================
// AI Live Paper Generator - Admin Exam Attempts API (Phase 9)
// GET /api/admin/exams/attempts
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ExamRepository } from "@/server/exam-engine/exam-repository";

export async function GET(req: NextRequest) {
  try {
    const roleHeader = req.headers.get("x-user-role");
    if (roleHeader === "STUDENT") {
      return apiError("Forbidden: Students cannot access administrative resources.", "FORBIDDEN", 403);
    }

    const { searchParams } = new URL(req.url);
    const filters = {
      paperId: searchParams.get("paperId") || undefined,
      studentId: searchParams.get("studentId") || undefined,
      status: searchParams.get("status") || undefined,
    };

    const attempts = await ExamRepository.listAttempts(filters);
    return apiSuccess({ attempts, count: attempts.length });
  } catch (error: any) {
    return apiError(error?.message || "Failed to list exam attempts.", "INTERNAL_ERROR", 500);
  }
}
