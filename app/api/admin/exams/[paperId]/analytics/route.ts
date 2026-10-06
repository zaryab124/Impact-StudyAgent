// ==============================================================================
// AI Live Paper Generator - Admin Exam Analytics API (Phase 9)
// GET /api/admin/exams/[paperId]/analytics
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ExamRepository } from "@/server/exam-engine/exam-repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ paperId: string }> }
) {
  try {
    const roleHeader = req.headers.get("x-user-role");
    if (roleHeader === "STUDENT") {
      return apiError("Forbidden: Students cannot access administrative resources.", "FORBIDDEN", 403);
    }

    const { paperId } = await params;
    const paper = await ExamRepository.findPaperById(paperId);
    if (!paper) {
      return apiError(`Paper "${paperId}" not found.`, "NOT_FOUND", 404);
    }

    const attempts = await ExamRepository.listAttempts({ paperId });
    const evaluatedAttempts = attempts.filter((a) => a.status === "EVALUATED");

    const totalAttempts = attempts.length;
    const evaluatedCount = evaluatedAttempts.length;

    let averageScore = 0;
    let averagePercentage = 0;
    let highestScore = 0;
    let lowestScore = paper.totalMarks;
    let passCount = 0;

    if (evaluatedCount > 0) {
      const sumScore = evaluatedAttempts.reduce((s, a) => s + a.obtainedMarks, 0);
      const sumPct = evaluatedAttempts.reduce((s, a) => s + a.percentage, 0);
      averageScore = Math.round((sumScore / evaluatedCount) * 10) / 10;
      averagePercentage = Math.round((sumPct / evaluatedCount) * 10) / 10;

      highestScore = Math.max(...evaluatedAttempts.map((a) => a.obtainedMarks));
      lowestScore = Math.min(...evaluatedAttempts.map((a) => a.obtainedMarks));
      passCount = evaluatedAttempts.filter((a) => a.percentage >= 50).length;
    } else {
      lowestScore = 0;
    }

    const passRate = evaluatedCount > 0 ? Math.round((passCount / evaluatedCount) * 1000) / 10 : 0;

    return apiSuccess({
      paperId,
      paperCode: paper.paperCode,
      paperTitle: paper.title,
      totalMarks: paper.totalMarks,
      totalAttempts,
      evaluatedCount,
      inProgressCount: attempts.filter((a) => a.status === "IN_PROGRESS").length,
      averageScore,
      averagePercentage,
      highestScore,
      lowestScore,
      passRate,
      difficultyDistribution: paper.snapshot?.difficultyDistribution || null,
    });
  } catch (error: any) {
    return apiError(error?.message || "Failed to retrieve analytics.", "INTERNAL_ERROR", 500);
  }
}
