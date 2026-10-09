import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { BootstrapService } from "@/server/admin/bootstrap-service";

export async function POST(req: NextRequest) {
  try {
    const result = await BootstrapService.ensureBaselineData();
    return apiSuccess({
      message: "Baseline curriculum, syllabi, examination patterns, and blueprints synchronized successfully.",
      result,
    });
  } catch (error: any) {
    console.error("[API POST /api/admin/bootstrap] Error:", error);
    return apiError(error.message || "Bootstrap synchronization failed.", "BOOTSTRAP_ERROR", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const result = await BootstrapService.ensureBaselineData();
    return apiSuccess({
      message: "Baseline data status verified.",
      result,
    });
  } catch (error: any) {
    console.error("[API GET /api/admin/bootstrap] Error:", error);
    return apiError(error.message || "Bootstrap status check failed.", "BOOTSTRAP_ERROR", 500);
  }
}
