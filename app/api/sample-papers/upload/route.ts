// ==============================================================================
// AI Live Paper Generator - Sample Paper Multipart Upload API
// Phase 5: Sample Paper Analysis & Examination Pattern Learning
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { SamplePaperService } from "@/server/sample-paper/sample-paper-service";

export async function POST(req: NextRequest) {
  try {
    const roleHeader = req.headers.get("x-user-role") || "ADMIN";
    if (roleHeader === "STUDENT") {
      return apiError("Unauthorized: Students cannot upload sample papers.", "FORBIDDEN", 403);
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "Sample Examination Paper";
    const subjectId = formData.get("subjectId") as string | null;
    const year = parseInt((formData.get("year") as string) || "2025", 10);
    const totalMarks = parseInt((formData.get("totalMarks") as string) || "0", 10);
    const durationMinutes = parseInt((formData.get("durationMinutes") as string) || "180", 10);
    const boardId = (formData.get("boardId") as string) || null;
    const academicYearId = (formData.get("academicYearId") as string) || null;
    const classId = (formData.get("classId") as string) || null;
    const syllabusId = (formData.get("syllabusId") as string) || null;
    const sourceType = (formData.get("sourceType") as any) || "SAMPLE_PAPER";
    const sourceReference = (formData.get("sourceReference") as string) || null;
    const autoProcess = formData.get("autoProcess") === "true";

    if (!file) {
      return apiError("No file provided. A PDF file is required.", "MISSING_FILE", 400);
    }

    if (!subjectId) {
      return apiError("Missing required parameter: subjectId.", "MISSING_SUBJECT_ID", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const result = await SamplePaperService.uploadSamplePaper({
      title,
      subjectId,
      year,
      totalMarks,
      durationMinutes,
      boardId,
      academicYearId,
      classId,
      syllabusId,
      sourceType,
      sourceReference,
      fileName: file.name,
      fileBuffer,
    });

    let processedPaper = result.samplePaper;
    if (autoProcess) {
      try {
        processedPaper = await SamplePaperService.processSamplePaper(result.samplePaper.id);
      } catch (procErr: unknown) {
        console.warn(`[API:sample-papers/upload] Auto-process encountered warning:`, procErr);
      }
    }

    return apiSuccess(
      {
        samplePaper: processedPaper,
        isDuplicate: result.isDuplicate,
      },
      result.isDuplicate ? 200 : 201
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to upload sample paper";
    return apiError(message, "SAMPLE_PAPER_UPLOAD_ERROR", 400);
  }
}
