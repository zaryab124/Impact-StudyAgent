import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { QuestionBankRepository } from "@/server/question-generation/question-bank-repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const candidate = await QuestionBankRepository.findCandidateById(id);
    if (candidate) {
      return apiSuccess({
        questionId: candidate.id,
        provenance: candidate.provenance,
        sourceChunkIds: candidate.sourceChunkIds,
        sourcePages: candidate.sourcePages,
        bookTitle: candidate.bookTitle,
        chapterTitle: candidate.chapterTitle,
        topicTitle: candidate.topicTitle,
        syllabusVersion: candidate.syllabusVersion,
      });
    }

    const bankItem = await QuestionBankRepository.findBankItemById(id);
    if (bankItem) {
      return apiSuccess({
        questionId: bankItem.id,
        provenance: bankItem.sourceProvenance,
        sourceChunkIds: bankItem.sourceChunkIds,
        sourcePages: bankItem.sourcePages,
        bookTitle: bankItem.bookTitle,
        chapterTitle: bankItem.chapterTitle,
        topicTitle: bankItem.topicTitle,
        syllabusVersion: bankItem.syllabusVersion,
      });
    }

    return apiError(`Question with ID "${id}" was not found.`, "NOT_FOUND", 404);
  } catch (error: any) {
    return apiError(error.message || "Failed to retrieve provenance.", "RETRIEVAL_FAILED", 500);
  }
}
