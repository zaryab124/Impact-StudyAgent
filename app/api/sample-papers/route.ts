// ==============================================================================
// AI Live Paper Generator - Sample Papers List & Registration API
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { SamplePaperService } from "@/server/sample-paper/sample-paper-service";
import { UploadSamplePaperSchema } from "@/lib/validations/sample-paper";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId") || undefined;
    const boardId = searchParams.get("boardId") || undefined;
    const academicYearId = searchParams.get("academicYearId") || undefined;
    const classId = searchParams.get("classId") || undefined;
    const status = searchParams.get("status") || undefined;

    const samplePapers = await SamplePaperService.listSamplePapers({
      subjectId,
      boardId,
      academicYearId,
      classId,
      status,
    });

    return apiSuccess({
      total: samplePapers.length,
      samplePapers,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve sample papers";
    return apiError(message, "SAMPLE_PAPERS_FETCH_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const roleHeader = req.headers.get("x-user-role") || "ADMIN";
    if (roleHeader === "STUDENT") {
      return apiError("Unauthorized: Students cannot register sample papers.", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const validation = UploadSamplePaperSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        validation.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
        "VALIDATION_ERROR",
        400
      );
    }

    const result = await SamplePaperService.uploadSamplePaper(validation.data);
    return apiSuccess(result.samplePaper, result.isDuplicate ? 200 : 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to register sample paper";
    return apiError(message, "SAMPLE_PAPER_CREATE_ERROR", 500);
  }
}
