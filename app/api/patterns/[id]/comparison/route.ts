// ==============================================================================
// AI Live Paper Generator - Pattern vs Sample Papers Comparison API
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { SamplePaperService } from "@/server/sample-paper/sample-paper-service";
import { PaperComparisonService } from "@/server/sample-paper/paper-comparison-service";
import { SamplePaperDTO } from "@/types/sample-paper";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pattern = await prisma.paperPattern.findUnique({
      where: { id },
      include: {
        samplePaperLinks: {
          select: { samplePaperId: true },
        },
      },
    });

    if (!pattern) {
      return apiError(`Pattern not found with ID: ${id}`, "NOT_FOUND", 404);
    }

    const paperIds = pattern.samplePaperLinks.map((l: any) => l.samplePaperId);
    if (paperIds.length < 2) {
      return apiSuccess({
        message: "Pattern has fewer than 2 contributing sample papers; comparison not required.",
        patternId: pattern.id,
        contributingCount: paperIds.length,
      });
    }

    const papers: SamplePaperDTO[] = [];
    for (const pId of paperIds) {
      const p = await SamplePaperService.getSamplePaperById(pId);
      if (p) papers.push(p);
    }

    const comparison = PaperComparisonService.compareSamplePapers(papers);

    return apiSuccess({
      patternId: pattern.id,
      patternTitle: pattern.title,
      version: pattern.version,
      comparison,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate comparison";
    return apiError(message, "PATTERN_COMPARISON_ERROR", 500);
  }
}
