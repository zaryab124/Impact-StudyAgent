import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RetrievalRequestSchema } from "@/lib/validations/retrieval";
import { RetrievalService } from "@/server/retrieval/retrieval-service";

export async function POST(req: NextRequest) {
  try {
    const roleHeader = req.headers.get("x-user-role") || "ADMIN";
    if (roleHeader === "STUDENT") {
      return apiError(
        "Unauthorized: Student role is not permitted to assemble generation context.",
        "FORBIDDEN",
        403
      );
    }

    const body = await req.json();

    // STRICT INVARIANT: Question generation context endpoint NEVER allows diagnostic bypass
    if (body.diagnosticMode === true) {
      return apiError(
        "Diagnostic mode is strictly forbidden for examination question generation context assembly.",
        "FORBIDDEN_DIAGNOSTIC_MODE",
        400
      );
    }

    const parseResult = RetrievalRequestSchema.safeParse({
      ...body,
      mode: body.mode || "QUESTION_SUPPORT",
      diagnosticMode: false,
    });

    if (!parseResult.success) {
      return apiError(
        "Invalid context assembly request parameters.",
        "VALIDATION_ERROR",
        400,
        parseResult.error.errors.map((e) => ({
          field: e.path.join("."),
          issue: e.message,
        }))
      );
    }

    const isAdmin = roleHeader === "ADMIN" || roleHeader === "EXAMINER";
    const contextPackage = await RetrievalService.retrieveKnowledge(parseResult.data, {
      isAdmin,
      diagnosticMode: false,
    });

    // Verify package is strictly production-eligible if results are returned
    if (contextPackage.status === "SUCCESS" && !RetrievalService.isPackageProductionEligible(contextPackage)) {
      return apiError(
        "Refused to serve unverified or non-production-eligible knowledge for question generation.",
        "INELIGIBLE_FOR_PRODUCTION",
        422
      );
    }

    return apiSuccess(contextPackage);
  } catch (error: any) {
    console.error("[API /api/retrieval/context] Error:", error);
    return apiError(
      error.message || "Failed to assemble educational context package.",
      "CONTEXT_ASSEMBLY_FAILED",
      500
    );
  }
}
