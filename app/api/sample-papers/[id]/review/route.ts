// ==============================================================================
// AI Live Paper Generator - Sample Paper Human Review & Audit API
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { SamplePaperService } from "@/server/sample-paper/sample-paper-service";
import { ReviewQuestionSchema } from "@/lib/validations/sample-paper";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roleHeader = req.headers.get("x-user-role") || "EXAMINER";
    const reviewerId = req.headers.get("x-user-id") || null;
    const reviewerName = req.headers.get("x-user-name") || "Curriculum Officer";

    if (roleHeader === "STUDENT") {
      return apiError("Unauthorized: Students cannot review or override questions.", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const validation = ReviewQuestionSchema.safeParse(body);

    if (!validation.success) {
      return apiError(
        validation.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
        "VALIDATION_ERROR",
        400
      );
    }

    const data = validation.data;
    const updatedQuestion = await SamplePaperService.recordHumanReview(
      id,
      data.questionId,
      data.action,
      reviewerId,
      reviewerName,
      {
        primaryType: data.primaryType,
        secondaryTypes: data.secondaryTypes,
        difficulty: data.difficulty,
        marks: data.marks,
        choiceRule: data.choiceRule,
        chapterId: data.chapterId,
        topicId: data.topicId,
      },
      data.reason
    );

    return apiSuccess({
      message: `Question '${updatedQuestion.originalNumber}' review recorded and audited.`,
      question: updatedQuestion,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to record review";
    return apiError(message, "REVIEW_ERROR", 500);
  }
}
