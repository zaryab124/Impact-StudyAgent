import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { calculateBlueprint } from "@/lib/blueprint/calculator";
import { validateBlueprintStructure } from "@/lib/blueprint/validator";
import { CreateBlueprintSchema } from "@/lib/validations/blueprint";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateBlueprintSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "Invalid blueprint payload",
        "VALIDATION_ERROR",
        400,
        parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          issue: e.message,
        }))
      );
    }

    // Programmatically calculate totals and difficulty distribution (~33% Easy, ~33% Med, ~33% Diff)
    const calculationResult = calculateBlueprint({
      sections: parsed.data.sections.map((s, idx) => ({
        sectionId: s.sectionId || `sec_${idx + 1}`,
        name: s.name,
        questionType: (s.questionType || "MCQ") as any,
        questionCount: s.questionCount,
        marksPerQuestion: s.marksPerQuestion,
      })),
    });

    // Validate structural integrity
    const validation = validateBlueprintStructure(
      calculationResult,
      parsed.data.targetTotalMarks
    );

    if (!validation.isValid) {
      return apiError(
        "Blueprint structure validation failed",
        "BLUEPRINT_VALIDATION_ERROR",
        422,
        validation.issues.map((i) => ({ field: i.field, issue: i.message }))
      );
    }

    return apiSuccess({
      blueprintId: "bp_" + Date.now(),
      name: parsed.data.name,
      patternId: parsed.data.patternId,
      durationMinutes: parsed.data.durationMinutes,
      ...calculationResult,
      validation,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error calculating blueprint";
    return apiError(message, "BLUEPRINT_CALCULATION_ERROR", 500);
  }
}
