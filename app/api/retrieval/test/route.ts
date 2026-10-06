import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RetrievalRequestSchema } from "@/lib/validations/retrieval";
import { RetrievalService } from "@/server/retrieval/retrieval-service";

export async function POST(req: NextRequest) {
  try {
    const roleHeader = req.headers.get("x-user-role") || "ADMIN";
    // Strictly ADMIN or EXAMINER only for diagnostic test endpoint
    if (roleHeader !== "ADMIN" && roleHeader !== "EXAMINER") {
      return apiError(
        "Unauthorized: Only administrators or chief examiners can run diagnostic retrieval tests.",
        "FORBIDDEN",
        403
      );
    }

    const body = await req.json();
    const parseResult = RetrievalRequestSchema.safeParse({
      ...body,
      diagnosticMode: true,
    });

    if (!parseResult.success) {
      return apiError(
        "Invalid diagnostic request parameters.",
        "VALIDATION_ERROR",
        400,
        parseResult.error.errors.map((e) => ({
          field: e.path.join("."),
          issue: e.message,
        }))
      );
    }

    const diagnosticPackage = await RetrievalService.retrieveKnowledge(parseResult.data, {
      isAdmin: true,
      diagnosticMode: true,
    });

    return apiSuccess(diagnosticPackage);
  } catch (error: any) {
    console.error("[API /api/retrieval/test] Error:", error);
    return apiError(
      error.message || "Failed to execute diagnostic retrieval test.",
      "DIAGNOSTIC_FAILED",
      500
    );
  }
}
