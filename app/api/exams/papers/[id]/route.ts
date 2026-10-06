// ==============================================================================
// AI Live Paper Generator - Paper Detail API (Phase 9)
// GET: Fetches Paper Details (Full for Admin/Examiner, Sanitized for Student)
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ExamRepository } from "@/server/exam-engine/exam-repository";
import { ExamService } from "@/server/exam-engine/exam-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const paper = await ExamRepository.findPaperById(id);

    if (!paper) {
      return apiError(`Examination paper "${id}" not found.`, "NOT_FOUND", 404);
    }

    const { searchParams } = new URL(req.url);
    const forStudent = searchParams.get("forStudent") === "true";

    if (forStudent) {
      const studentView = ExamService.getStudentPaperView(paper);
      return apiSuccess(studentView);
    }

    return apiSuccess(paper);
  } catch (error: any) {
    return apiError(error?.message || "Failed to retrieve examination paper.", "INTERNAL_ERROR", 500);
  }
}
