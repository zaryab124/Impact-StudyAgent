import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { BlueprintService } from "@/server/blueprint/blueprint-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const roleHeader = req.headers.get("x-user-role") || "ADMIN";
    if (roleHeader !== "ADMIN") {
      return apiError(
        "Unauthorized: Only administrators can archive examination blueprints.",
        "FORBIDDEN",
        403
      );
    }

    const { id } = await params;
    const archived = await BlueprintService.archiveBlueprint(id);

    return apiSuccess(archived);
  } catch (error: any) {
    console.error("[API POST /api/blueprints/[id]/archive] Error:", error);
    return apiError(
      error.message || "Failed to archive blueprint.",
      "ARCHIVE_FAILED",
      500
    );
  }
}
