import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { BlueprintService } from "@/server/blueprint/blueprint-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bp = await BlueprintService.getBlueprint(id);
    if (!bp) {
      return apiError(`Blueprint "${id}" not found.`, "NOT_FOUND", 404);
    }
    return apiSuccess(bp.slots);
  } catch (error: any) {
    console.error("[API GET /api/blueprints/[id]/slots] Error:", error);
    return apiError(error.message || "Failed to fetch blueprint slots.", "FETCH_FAILED", 500);
  }
}
