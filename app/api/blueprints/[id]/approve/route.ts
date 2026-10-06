import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { BlueprintService } from "@/server/blueprint/blueprint-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const roleHeader = req.headers.get("x-user-role") || "ADMIN";
    if (roleHeader !== "ADMIN" && roleHeader !== "EXAMINER") {
      return apiError(
        "Unauthorized: Only administrators or examiners can approve examination blueprints.",
        "FORBIDDEN",
        403
      );
    }

    const { id } = await params;
    const approverId = req.headers.get("x-user-id") || "approver";

    const approved = await BlueprintService.approveBlueprint(id, approverId);

    return apiSuccess(approved);
  } catch (error: any) {
    console.error("[API POST /api/blueprints/[id]/approve] Error:", error);
    return apiError(
      error.message || "Failed to approve blueprint.",
      "APPROVAL_FAILED",
      error.message?.includes("Approval Gate Rejected") ? 422 : 500
    );
  }
}
