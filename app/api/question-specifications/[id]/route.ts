import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { BlueprintService } from "@/server/blueprint/blueprint-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const spec = await BlueprintService.getQuestionSpecification(id);

    if (!spec) {
      return apiError(`Question specification "${id}" not found.`, "NOT_FOUND", 404);
    }

    return apiSuccess(spec);
  } catch (error: any) {
    console.error("[API GET /api/question-specifications/[id]] Error:", error);
    return apiError(
      error.message || "Failed to fetch question specification.",
      "FETCH_FAILED",
      500
    );
  }
}
