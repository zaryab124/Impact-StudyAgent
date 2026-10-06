import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { GenerateQuestionRequestSchema } from "@/lib/validations/question-generation";
import { QuestionGenerationService } from "@/server/question-generation/question-generation-service";

export async function POST(req: NextRequest) {
  try {
    const roleHeader = req.headers.get("x-user-role") || "ADMIN";
    if (roleHeader === "STUDENT") {
      return apiError(
        "Unauthorized: Students are not permitted to generate examination questions.",
        "FORBIDDEN",
        403
      );
    }

    const body = await req.json();
    const parseResult = GenerateQuestionRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "Invalid question generation request parameters.",
        "VALIDATION_ERROR",
        400,
        parseResult.error.errors.map((e) => ({
          field: e.path.join("."),
          issue: e.message,
        }))
      );
    }

    const {
      blueprintId,
      blueprintSlotId,
      preferredProvider,
      temperature,
      customPromptInstructions,
    } = parseResult.data;

    const candidate = await QuestionGenerationService.generateQuestion(
      blueprintId,
      blueprintSlotId,
      {
        preferredProvider,
        temperature,
        customInstructions: customPromptInstructions,
      }
    );

    return apiSuccess(candidate, 201);
  } catch (error: any) {
    console.error("[API POST /api/questions/generate] Error:", error);
    const isGateBlock = error.message?.includes("Generation Gate Blocked");
    return apiError(
      error.message || "Failed to generate question candidate.",
      isGateBlock ? "GENERATION_GATE_BLOCKED" : "QUESTION_GENERATION_FAILED",
      isGateBlock ? 400 : 500
    );
  }
}
