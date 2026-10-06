// ==============================================================================
// AI Live Paper Generator - Question Validation API (Phase 12)
// POST /api/questions/validate
// Validates a question candidate against syllabus alignment, grounding, and quality criteria
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { QuestionBankRepository } from "@/server/question-generation/question-bank-repository";
import { QuestionQualityValidator } from "@/server/question-generation/question-quality-validator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let candidate = body.candidate;
    const questionId = body.questionId || body.id;

    if (!candidate && questionId) {
      candidate = await QuestionBankRepository.findCandidateById(questionId);
      if (!candidate) {
        return apiError(`Question candidate "${questionId}" not found.`, "NOT_FOUND", 404);
      }
    }

    if (!candidate) {
      return apiError("Missing question candidate or questionId in request body.", "INVALID_REQUEST", 400);
    }

    const evidencePackage = body.evidencePackage || {
      topicId: candidate.topicId || "topic-general",
      topicTitle: candidate.topicTitle || "General Topic",
      chapterId: candidate.chapterId || "chap-general",
      chapterTitle: candidate.chapterTitle || "General Chapter",
      syllabusVersion: candidate.syllabusVersion || "v1.0",
      chunks: (candidate.sourceChunkIds || ["chunk-1"]).map((cid: string, idx: number) => ({
        chunkId: cid,
        content: candidate.questionText || "",
        pageNumber: (candidate.sourcePages && candidate.sourcePages[idx]) || 1,
        score: 0.9,
      })),
      extractedFormulas: [],
      extractedDefinitions: [],
      extractedFacts: [],
      isSufficient: true,
      evidenceCount: (candidate.sourceChunkIds || [1]).length,
      citationString: `Pages ${(candidate.sourcePages || [1]).join(", ")}`,
    };

    const report = QuestionQualityValidator.validateCandidate({
      candidate,
      evidencePackage,
    });

    if (candidate.id) {
      candidate.validationReport = report;
      candidate.validationStatus = report.isValid ? "VALIDATED" : "FLAGGED";
      candidate.qualityScore = report.overallQualityScore;
      await QuestionBankRepository.saveCandidate(candidate);
    }

    return apiSuccess({
      isValid: report.isValid,
      overallQualityScore: report.overallQualityScore,
      report,
    });
  } catch (error: any) {
    return apiError(error.message || "Failed to validate question candidate.", "VALIDATION_FAILED", 500);
  }
}
