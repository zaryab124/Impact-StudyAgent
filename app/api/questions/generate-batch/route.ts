import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { GenerateBatchRequestSchema } from "@/lib/validations/question-generation";
import { QuestionGenerationService } from "@/server/question-generation/question-generation-service";

export async function POST(req: NextRequest) {
  try {
    const roleHeader = req.headers.get("x-user-role") || "ADMIN";
    if (roleHeader === "STUDENT") {
      return apiError(
        "Unauthorized: Students are not permitted to initiate batch question generation.",
        "FORBIDDEN",
        403
      );
    }

    const body = await req.json();
    const parseResult = GenerateBatchRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "Invalid batch generation request parameters.",
        "VALIDATION_ERROR",
        400,
        parseResult.error.errors.map((e) => ({
          field: e.path.join("."),
          issue: e.message,
        }))
      );
    }

    const { blueprintId, slotIds, preferredProvider } = parseResult.data;

    const batch = await QuestionGenerationService.generateBatch(blueprintId, {
      slotIds,
      preferredProvider,
    });

    return apiSuccess(batch, 201);
  } catch (error: any) {
    console.error("[API POST /api/questions/generate-batch] Error:", error);
    const isGateBlock = error.message?.includes("Generation Gate Blocked");
    return apiError(
      error.message || "Failed to execute batch question generation.",
      isGateBlock ? "BATCH_GENERATION_BLOCKED" : "BATCH_GENERATION_FAILED",
      isGateBlock ? 400 : 500
    );
  }
}
