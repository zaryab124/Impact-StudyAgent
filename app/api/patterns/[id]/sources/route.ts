// ==============================================================================
// AI Live Paper Generator - Pattern Source Sample Papers API
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const links = await prisma.patternSamplePaperLink.findMany({
      where: { patternId: id },
      include: {
        samplePaper: {
          select: {
            id: true,
            title: true,
            year: true,
            totalMarks: true,
            durationMinutes: true,
            status: true,
            sourceType: true,
            sourceReference: true,
            fileName: true,
            checksum: true,
            pageCount: true,
            createdAt: true,
          },
        },
      },
    });

    const sources = links.map((l: any) => ({
      samplePaperId: l.samplePaperId,
      title: l.samplePaper.title,
      year: l.samplePaper.year,
      totalMarks: l.samplePaper.totalMarks,
      durationMinutes: l.samplePaper.durationMinutes,
      status: l.samplePaper.status,
      sourceType: l.samplePaper.sourceType,
      sourceReference: l.samplePaper.sourceReference,
      fileName: l.samplePaper.fileName,
      checksum: l.samplePaper.checksum,
      pageCount: l.samplePaper.pageCount,
      contributionWeight: l.contributionWeight,
      isOutlier: l.isOutlier,
      outlierReason: l.outlierReason,
      linkedAt: l.createdAt.toISOString(),
    }));

    return apiSuccess({
      patternId: id,
      totalSources: sources.length,
      sources,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve pattern sources";
    return apiError(message, "SOURCES_FETCH_ERROR", 500);
  }
}
