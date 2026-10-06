import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ValidateQuerySchema } from "@/lib/validations/retrieval";
import { RetrievalService } from "@/server/retrieval/retrieval-service";

export async function POST(req: NextRequest) {
  try {
    const roleHeader = req.headers.get("x-user-role") || "ADMIN";
    const body = await req.json();
    const parseResult = ValidateQuerySchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "Invalid query validation parameters.",
        "VALIDATION_ERROR",
        400,
        parseResult.error.errors.map((e) => ({
          field: e.path.join("."),
          issue: e.message,
        }))
      );
    }

    const isAdmin = roleHeader === "ADMIN" || roleHeader === "EXAMINER";
    const validationResult = await RetrievalService.validateRequest(
      parseResult.data as any,
      { isAdmin, diagnosticMode: false }
    );

    return apiSuccess(validationResult);
  } catch (error: any) {
    console.error("[API /api/retrieval/validate] Error:", error);
    return apiError(
      error.message || "Failed to validate query against syllabus eligibility.",
      "VALIDATION_FAILED",
      500
    );
  }
}
