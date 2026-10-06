import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { SyllabusComparisonService } from "@/server/syllabus/comparison-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const versionA = searchParams.get("versionA");
    const versionB = searchParams.get("versionB");

    if (!versionA || !versionB) {
      return apiError(
        "Both 'versionA' and 'versionB' query parameters are required for syllabus comparison.",
        "MISSING_PARAMETERS",
        400
      );
    }

    const comparison = await SyllabusComparisonService.compareSyllabusVersions(versionA, versionB);
    return apiSuccess(comparison);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to compare syllabus versions";
    const status = message.includes("not found") ? 404 : 500;
    return apiError(message, "COMPARISON_ERROR", status);
  }
}
