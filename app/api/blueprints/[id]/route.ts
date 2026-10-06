import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { BlueprintService } from "@/server/blueprint/blueprint-service";
import { UpdateBlueprintRequestSchema } from "@/lib/validations/blueprint";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const blueprint = await BlueprintService.getBlueprint(id);

    if (!blueprint) {
      return apiError(`Examination blueprint "${id}" not found.`, "NOT_FOUND", 404);
    }

    return apiSuccess(blueprint);
  } catch (error: any) {
    console.error("[API GET /api/blueprints/[id]] Error:", error);
    return apiError(
      error.message || "Failed to fetch blueprint.",
      "BLUEPRINT_FETCH_FAILED",
      500
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const roleHeader = req.headers.get("x-user-role") || "ADMIN";
    if (roleHeader === "STUDENT") {
      return apiError("Unauthorized: Student cannot modify blueprints.", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const blueprint = await BlueprintService.getBlueprint(id);
    if (!blueprint) {
      return apiError(`Examination blueprint "${id}" not found.`, "NOT_FOUND", 404);
    }

    const body = await req.json();
    const parseResult = UpdateBlueprintRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return apiError("Invalid update parameters.", "VALIDATION_ERROR", 400);
    }

    // INVARIANT: If already APPROVED, cannot modify silently; creates new version
    if (blueprint.status === "APPROVED") {
      const newVersion = await BlueprintService.createBlueprintVersion(
        id,
        parseResult.data as any,
        req.headers.get("x-user-id") || "admin"
      );
      return apiSuccess({
        message: "Approved blueprint cannot be modified directly; created new version.",
        blueprint: newVersion,
        createdNewVersion: true,
      });
    }

    // For DRAFT or UNDER_REVIEW, update directly
    const updated = await BlueprintService.createBlueprint(
      {
        ...blueprint,
        ...parseResult.data,
      } as any,
      { authorId: req.headers.get("x-user-id") || "admin" }
    );

    return apiSuccess(updated);
  } catch (error: any) {
    console.error("[API PATCH /api/blueprints/[id]] Error:", error);
    return apiError(error.message || "Failed to update blueprint.", "UPDATE_FAILED", 500);
  }
}
