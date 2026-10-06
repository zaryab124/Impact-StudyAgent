// ==============================================================================
// AI Live Paper Generator - Trigger Sample Paper Processing API
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { SamplePaperService } from "@/server/sample-paper/sample-paper-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roleHeader = req.headers.get("x-user-role") || "ADMIN";
    if (roleHeader === "STUDENT") {
      return apiError("Unauthorized: Students cannot trigger processing.", "FORBIDDEN", 403);
    }

    const processed = await SamplePaperService.processSamplePaper(id);

    return apiSuccess({
      message: `Sample paper '${processed.title}' processed successfully.`,
      samplePaper: processed,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process sample paper";
    return apiError(message, "SAMPLE_PAPER_PROCESS_ERROR", 500);
  }
}
