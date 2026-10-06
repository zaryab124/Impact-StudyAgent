import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { BlueprintService } from "@/server/blueprint/blueprint-service";
import { QuestionIntelligenceEngine } from "@/server/blueprint/question-intelligence-engine";

export async function POST(req: NextRequest) {
  try {
    const roleHeader = req.headers.get("x-user-role") || "ADMIN";
    if (roleHeader === "STUDENT") {
      return apiError(
        "Unauthorized: Student cannot create question specifications.",
        "FORBIDDEN",
        403
      );
    }

    const body = await req.json();
    const { blueprintId, blueprintSlotId, constraints = [] } = body;

    if (!blueprintId) {
      return apiError("Missing 'blueprintId' in request body.", "VALIDATION_ERROR", 400);
    }

    const bp = await BlueprintService.getBlueprint(blueprintId);
    if (!bp) {
      return apiError(`Blueprint "${blueprintId}" not found.`, "NOT_FOUND", 404);
    }

    if (bp.status === "ARCHIVED") {
      return apiError("Cannot generate specifications for an ARCHIVED blueprint.", "INVALID_STATE", 400);
    }

    if (blueprintSlotId) {
      // Single slot specification
      const slot = bp.slots.find((s) => s.id === blueprintSlotId);
      if (!slot) {
        return apiError(
          `Slot "${blueprintSlotId}" not found in blueprint "${blueprintId}".`,
          "NOT_FOUND",
          404
        );
      }
      const spec = QuestionIntelligenceEngine.createSpecification(slot, constraints);
      return apiSuccess(spec, 201);
    }

    // Batch generate for all slots in blueprint
    const specs = await BlueprintService.createQuestionSpecifications(blueprintId);
    return apiSuccess(specs, 201);
  } catch (error: any) {
    console.error("[API POST /api/question-specifications] Error:", error);
    return apiError(
      error.message || "Failed to generate question specifications.",
      "GENERATION_FAILED",
      500
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const blueprintId = searchParams.get("blueprintId") || undefined;

    const specs = await BlueprintService.listQuestionSpecifications(blueprintId);
    return apiSuccess(specs);
  } catch (error: any) {
    console.error("[API GET /api/question-specifications] Error:", error);
    return apiError(
      error.message || "Failed to list question specifications.",
      "FETCH_FAILED",
      500
    );
  }
}
