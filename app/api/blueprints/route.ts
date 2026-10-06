import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { PaperBlueprintRequestSchema } from "@/lib/validations/blueprint";
import { BlueprintService } from "@/server/blueprint/blueprint-service";

export async function POST(req: NextRequest) {
  try {
    const roleHeader = req.headers.get("x-user-role") || "ADMIN";
    if (roleHeader === "STUDENT") {
      return apiError(
        "Unauthorized: Student role is not permitted to create examination blueprints.",
        "FORBIDDEN",
        403
      );
    }

    const body = await req.json();
    const parseResult = PaperBlueprintRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "Invalid examination blueprint request parameters.",
        "VALIDATION_ERROR",
        400,
        parseResult.error.errors.map((e) => ({
          field: e.path.join("."),
          issue: e.message,
        }))
      );
    }

    const blueprint = await BlueprintService.createBlueprint(parseResult.data, {
      authorId: req.headers.get("x-user-id") || "admin",
    });

    return apiSuccess(blueprint, 201);
  } catch (error: any) {
    console.error("[API POST /api/blueprints] Error:", error);
    return apiError(
      error.message || "Failed to create examination blueprint.",
      "BLUEPRINT_CREATION_FAILED",
      error.message?.includes("Hierarchy") || error.message?.includes("Syllabus") ? 400 : 500
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId") || undefined;
    const classId = searchParams.get("classId") || undefined;
    const boardId = searchParams.get("boardId") || undefined;
    const status = searchParams.get("status") || undefined;

    const blueprints = await BlueprintService.listBlueprints({
      subjectId,
      classId,
      boardId,
      status,
    });

    return apiSuccess(blueprints);
  } catch (error: any) {
    console.error("[API GET /api/blueprints] Error:", error);
    return apiError(
      error.message || "Failed to list examination blueprints.",
      "BLUEPRINT_FETCH_FAILED",
      500
    );
  }
}
