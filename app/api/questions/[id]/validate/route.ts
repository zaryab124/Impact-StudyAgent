import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { QuestionBankRepository } from "@/server/question-generation/question-bank-repository";
import { QuestionQualityValidator } from "@/server/question-generation/question-quality-validator";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const candidate = await QuestionBankRepository.findCandidateById(id);
    if (!candidate) {
      return apiError(`Question candidate "${id}" not found.`, "NOT_FOUND", 404);
    }

    const report = QuestionQualityValidator.validateCandidate({
      candidate,
      evidencePackage: {
        topicId: candidate.topicId,
        topicTitle: candidate.topicTitle,
        chapterId: candidate.chapterId,
        chapterTitle: candidate.chapterTitle,
        syllabusVersion: candidate.syllabusVersion,
        chunks: candidate.sourceChunkIds.map((cid, idx) => ({
          chunkId: cid,
          content: candidate.questionText,
          pageNumber: candidate.sourcePages[idx] || 1,
          score: 0.9,
        })),
        extractedFormulas: [],
        extractedDefinitions: [],
        extractedFacts: [],
        isSufficient: true,
        evidenceCount: candidate.sourceChunkIds.length,
        citationString: `Pages ${candidate.sourcePages.join(", ")}`,
      },
    });

    candidate.validationReport = report;
    candidate.validationStatus = report.isValid ? "VALIDATED" : "FLAGGED";
    candidate.qualityScore = report.overallQualityScore;
    await QuestionBankRepository.saveCandidate(candidate);

    return apiSuccess(report, 200);
  } catch (error: any) {
    return apiError(error.message || "Failed to validate question candidate.", "VALIDATION_FAILED", 500);
  }
}
