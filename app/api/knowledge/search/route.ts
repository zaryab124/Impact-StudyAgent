import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { KnowledgeSearchSchema } from "@/lib/validations/knowledge";
import { KnowledgeRetrievalService } from "@/server/book-intelligence/retrieval-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = KnowledgeSearchSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "Validation failed for knowledge retrieval query",
        "VALIDATION_ERROR",
        400,
        parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          issue: e.message,
        }))
      );
    }

    const { queryText, ...filter } = parsed.data;

    const results = await KnowledgeRetrievalService.searchKnowledge(queryText, {
      boardId: filter.boardId || undefined,
      academicYearId: filter.academicYearId || undefined,
      classId: filter.classId || undefined,
      subjectId: filter.subjectId || undefined,
      bookId: filter.bookId || undefined,
      chapterId: filter.chapterId || undefined,
      topicId: filter.topicId || undefined,
      chunkType: filter.chunkType || undefined,
      pageNumber: filter.pageNumber || undefined,
      minScore: filter.minScore,
      limit: filter.limit,
    });

    return apiSuccess({
      query: queryText,
      totalResults: results.length,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Knowledge retrieval failed";
    return apiError(message, "RETRIEVAL_ERROR", 500);
  }
}
