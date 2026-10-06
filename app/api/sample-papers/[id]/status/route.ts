// ==============================================================================
// AI Live Paper Generator - Sample Paper Processing Status API
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
    const paper = await prisma.samplePaper.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        pageCount: true,
        totalMarks: true,
        durationMinutes: true,
        processingLogs: true,
        errorMessage: true,
        updatedAt: true,
      },
    });

    if (!paper) {
      return apiError(`Sample paper not found with ID: ${id}`, "NOT_FOUND", 404);
    }

    return apiSuccess(paper);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch status";
    return apiError(message, "STATUS_FETCH_ERROR", 500);
  }
}
