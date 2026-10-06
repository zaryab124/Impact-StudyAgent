import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ReviewQuestionRequestSchema } from "@/lib/validations/question-generation";
import { QuestionGenerationService } from "@/server/question-generation/question-generation-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roleHeader = req.headers.get("x-user-role") || "ADMIN";
    if (roleHeader === "STUDENT") {
      return apiError(
        "Unauthorized: Students are not permitted to review questions.",
        "FORBIDDEN",
        403
      );
    }

    const reviewerId = req.headers.get("x-user-id") || "reviewer-admin";
    const body = await req.json();
    const parseResult = ReviewQuestionRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "Invalid review payload.",
        "VALIDATION_ERROR",
        400,
        parseResult.error.errors.map((e) => ({
          field: e.path.join("."),
          issue: e.message,
        }))
      );
    }

    const { action, reason } = parseResult.data;

    const candidate = await QuestionGenerationService.reviewCandidate(
      id,
      reviewerId,
      action,
      reason
    );

    return apiSuccess(candidate, 200);
  } catch (error: any) {
    return apiError(error.message || "Failed to submit question review.", "REVIEW_FAILED", 500);
  }
}
