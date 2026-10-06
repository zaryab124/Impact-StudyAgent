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
        "Unauthorized: Students are not permitted to approve questions.",
        "FORBIDDEN",
        403
      );
    }

    const approverId = req.headers.get("x-user-id") || "approver-admin";

    const bankItem = await QuestionGenerationService.approveCandidate(
      id,
      approverId
    );

    return apiSuccess(bankItem, 200);
  } catch (error: any) {
    return apiError(error.message || "Failed to approve question.", "APPROVAL_FAILED", 500);
  }
}
