import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RetrievalRequestSchema } from "@/lib/validations/retrieval";
import { RetrievalService } from "@/server/retrieval/retrieval-service";

export async function POST(req: NextRequest) {
  try {
    const roleHeader = req.headers.get("x-user-role") || "ADMIN";
    if (roleHeader === "STUDENT") {
      return apiError(
        "Unauthorized: Student role is not permitted to query knowledge retrieval directly.",
        "FORBIDDEN",
        403
      );
    }

    const body = await req.json();
    const parseResult = RetrievalRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return apiError(
        "Invalid retrieval request parameters.",
        "VALIDATION_ERROR",
        400,
        parseResult.error.errors.map((e) => ({
          field: e.path.join("."),
          issue: e.message,
        }))
      );
    }

    const isAdmin = roleHeader === "ADMIN" || roleHeader === "EXAMINER";
    const allowDiagnostic = isAdmin && Boolean(parseResult.data.diagnosticMode);

    const resultPackage = await RetrievalService.retrieveKnowledge(parseResult.data, {
      isAdmin,
      diagnosticMode: allowDiagnostic,
    });

    return apiSuccess(resultPackage);
  } catch (error: any) {
    console.error("[API /api/retrieval/search] Error:", error);
    return apiError(
      error.message || "Failed to execute knowledge search.",
      "RETRIEVAL_FAILED",
      500
    );
  }
}
