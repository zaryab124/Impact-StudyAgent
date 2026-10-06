import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { KnowledgeRetrievalService } from "@/server/book-intelligence/retrieval-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const chunk = await KnowledgeRetrievalService.getChunkProvenance(id);
    if (!chunk) {
      return apiError(`Knowledge chunk with ID "${id}" was not found.`, "CHUNK_NOT_FOUND", 404);
    }

    const serialized = {
      ...chunk,
      document: chunk.document
        ? {
            ...chunk.document,
            fileSize: Number(chunk.document.fileSize),
          }
        : null,
    };

    return apiSuccess(serialized);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve chunk provenance";
    const status = message.includes("not found") ? 404 : 500;
    return apiError(message, "PROVENANCE_ERROR", status);
  }
}
