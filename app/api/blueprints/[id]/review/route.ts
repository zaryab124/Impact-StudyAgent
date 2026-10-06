import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { BlueprintService } from "@/server/blueprint/blueprint-service";
import { ReviewBlueprintSchema } from "@/lib/validations/blueprint";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const roleHeader = req.headers.get("x-user-role") || "ADMIN";
    if (roleHeader === "STUDENT") {
      return apiError(
        "Unauthorized: Student cannot submit blueprint for review.",
        "FORBIDDEN",
        403
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parseResult = ReviewBlueprintSchema.safeParse(body);
    const reviewerId = req.headers.get("x-user-id") || "reviewer";

    const updated = await BlueprintService.reviewBlueprint(
      id,
      reviewerId,
      parseResult.success ? parseResult.data.notes : undefined
    );

    return apiSuccess(updated);
  } catch (error: any) {
    console.error("[API POST /api/blueprints/[id]/review] Error:", error);
    return apiError(
      error.message || "Failed to place blueprint under review.",
      "REVIEW_TRANSITION_FAILED",
      500
    );
  }
}
