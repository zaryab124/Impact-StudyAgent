import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
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
        "Unauthorized: Students are not permitted to reject questions.",
        "FORBIDDEN",
        403
      );
    }

    const reviewerId = req.headers.get("x-user-id") || "reviewer-admin";
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || "Rejected by authorized reviewer.";

    const candidate = await QuestionGenerationService.rejectCandidate(
      id,
      reviewerId,
      reason
    );

    return apiSuccess(candidate, 200);
  } catch (error: any) {
    return apiError(error.message || "Failed to reject question candidate.", "REJECTION_FAILED", 500);
  }
}
