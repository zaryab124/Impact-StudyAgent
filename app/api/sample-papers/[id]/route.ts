// ==============================================================================
// AI Live Paper Generator - Sample Paper Details API
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
    const paper = await SamplePaperService.getSamplePaperById(id);

    if (!paper) {
      return apiError(`Sample paper not found with ID: ${id}`, "NOT_FOUND", 404);
    }

    return apiSuccess(paper);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve sample paper";
    return apiError(message, "SAMPLE_PAPER_FETCH_ERROR", 500);
  }
}
