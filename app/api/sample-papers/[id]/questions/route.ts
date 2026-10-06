// ==============================================================================
// AI Live Paper Generator - Sample Paper Extracted Questions API
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { SamplePaperService } from "@/server/sample-paper/sample-paper-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const questions = await SamplePaperService.getQuestionsForPaper(id);

    return apiSuccess({
      total: questions.length,
      questions,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve questions";
    return apiError(message, "QUESTIONS_FETCH_ERROR", 500);
  }
}
