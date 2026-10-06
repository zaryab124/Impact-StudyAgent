// ==============================================================================
// AI Live Paper Generator - Paper Detail API (Phase 12)
// GET /api/papers/[id]
// Retrieves paper details, sanitizing answer material for students
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
      return apiError(`Examination paper with ID "${id}" was not found.`, "NOT_FOUND", 404);
    }

    const { searchParams } = new URL(req.url);
    const roleHeader = req.headers.get("x-user-role");
    const forStudent = searchParams.get("forStudent") === "true" || roleHeader === "STUDENT";

    if (forStudent) {
      return apiSuccess(ExamService.getStudentPaperView(paper));
    }

    return apiSuccess(paper);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve paper";
    return apiError(message, "PAPER_FETCH_ERROR", 500);
  }
}
