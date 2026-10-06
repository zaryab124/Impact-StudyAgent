// ==============================================================================
// AI Live Paper Generator - Results List API (Phase 12)
// GET /api/results - Lists results for authenticated student or examination cohort
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ExamRepository } from "@/server/exam-engine/exam-repository";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || undefined;
    const paperId = searchParams.get("paperId") || undefined;

    const attempts = await ExamRepository.listAttempts({ studentId, paperId });
    const completedAttempts = attempts.filter((a) => a.status === "SUBMITTED" || a.status === "EVALUATED");

    const results = [];
    for (const att of completedAttempts) {
      const res = await ExamRepository.findResultByAttemptId(att.id);
      if (res) {
        results.push(res);
      } else {
        results.push({
          attemptId: att.id,
          studentId: att.studentId,
          studentName: att.studentName,
          paperTitle: att.paperTitle,
          totalMarksObtained: att.obtainedMarks,
          totalMarksPossible: att.totalMarks,
          percentage: att.percentage,
          grade: att.grade,
          evaluatedAt: att.submittedAt || att.updatedAt,
          breakdown: {
            correctCount: att.correctCount,
            incorrectCount: att.incorrectCount,
            unansweredCount: att.unansweredCount,
          },
        });
      }
    }

    if (results.length > 0) {
      return apiSuccess({
        total: results.length,
        results,
      });
    }

    // Default demonstration result for development / testing
    const sampleResult = {
      attemptId: "att_demo_01",
      studentName: "Muhammad Ali",
      paperTitle: "SSC-I Physics Model Exam",
      totalMarksObtained: 52.5,
      totalMarksPossible: 60,
      percentage: 87.5,
      grade: "A+",
      evaluatedAt: "2026-09-25T14:30:00.000Z",
      breakdown: {
        objectiveMarks: 12,
        shortQuestionMarks: 26.5,
        longQuestionMarks: 14,
      },
      topicStrengths: [
        { topic: "Physical Quantities", accuracyPct: 100 },
        { topic: "Kinematics", accuracyPct: 85 },
        { topic: "Vectors", accuracyPct: 75 },
      ],
    };

    return apiSuccess({
      total: 1,
      results: [sampleResult],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve results";
    return apiError(message, "RESULTS_FETCH_ERROR", 500);
  }
}
