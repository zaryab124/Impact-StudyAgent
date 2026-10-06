import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { RetrievalService } from "@/server/retrieval/retrieval-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || id.trim().length === 0) {
      return apiError("Missing required parameter: chunk ID.", "INVALID_ID", 400);
    }

    const chunk = await RetrievalService.getChunkById(id);
    if (!chunk) {
      return apiError(`Document chunk with ID "${id}" was not found.`, "NOT_FOUND", 404);
    }

    return apiSuccess(chunk);
  } catch (error: any) {
    console.error("[API /api/retrieval/chunk/[id]] Error:", error);
    return apiError(
      error.message || "Failed to retrieve document chunk.",
      "CHUNK_RETRIEVAL_FAILED",
      500
    );
  }
}
