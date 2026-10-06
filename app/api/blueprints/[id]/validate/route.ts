import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { BlueprintService } from "@/server/blueprint/blueprint-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await BlueprintService.validateBlueprint(id);
    return apiSuccess(report);
  } catch (error: any) {
    console.error("[API POST /api/blueprints/[id]/validate] Error:", error);
    return apiError(
      error.message || "Failed to validate examination blueprint.",
      "VALIDATION_FAILED",
      500
    );
  }
}
