// ==============================================================================
// AI Live Paper Generator - Sample Paper Comparison API
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { SamplePaperService } from "@/server/sample-paper/sample-paper-service";
import { PaperComparisonService } from "@/server/sample-paper/paper-comparison-service";
import { SamplePaperDTO } from "@/types/sample-paper";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paperIdsParam = searchParams.get("paperIds") || searchParams.get("ids");

    if (!paperIdsParam) {
      return apiError(
        "Missing required query parameter: 'paperIds' (comma-separated IDs)",
        "MISSING_PARAMETER",
        400
      );
    }

    const ids = paperIdsParam.split(",").map((id) => id.trim()).filter((id) => id.length > 0);

    if (ids.length < 2) {
      return apiError("Comparison requires at least 2 sample paper IDs.", "INSUFFICIENT_PAPERS", 400);
    }

    const papers: SamplePaperDTO[] = [];
    for (const id of ids) {
      const p = await SamplePaperService.getSamplePaperById(id);
      if (!p) {
        return apiError(`Sample paper with ID '${id}' was not found.`, "PAPER_NOT_FOUND", 404);
      }
      papers.push(p);
    }

    const comparison = PaperComparisonService.compareSamplePapers(papers);
    return apiSuccess(comparison);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to compare sample papers";
    return apiError(message, "COMPARISON_ERROR", 500);
  }
}
