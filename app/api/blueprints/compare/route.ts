import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { BlueprintService } from "@/server/blueprint/blueprint-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idA = searchParams.get("idA");
    const idB = searchParams.get("idB");

    if (!idA || !idB) {
      return apiError("Both 'idA' and 'idB' query parameters are required for comparison.", "VALIDATION_ERROR", 400);
    }

    const comparison = await BlueprintService.compareBlueprints(idA, idB);
    return apiSuccess(comparison);
  } catch (error: any) {
    console.error("[API GET /api/blueprints/compare] Error:", error);
    return apiError(error.message || "Failed to compare blueprints.", "COMPARE_FAILED", 500);
  }
}
