// ==============================================================================
// AI Live Paper Generator - Paper Management API (Phase 9)
// POST: Assembles Live Paper from Approved Blueprint
// GET: Lists papers with filters
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { CreatePaperRequestSchema, PaperSearchFiltersSchema } from "@/lib/validations/exam-engine";
import { ExamService } from "@/server/exam-engine/exam-service";
import { ExamRepository } from "@/server/exam-engine/exam-repository";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parsed = CreatePaperRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return apiError(
        "Invalid paper creation request parameters.",
        "VALIDATION_ERROR",
        400,
        parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          issue: e.message,
        }))
      );
    }

    const { blueprintId, paperCode, title, instructions } = parsed.data;

    const paper = await ExamService.createPaper(blueprintId, {
      paperCode,
      title,
      instructions,
      actorId: "system-admin",
    });

    return apiSuccess(paper, 201);
  } catch (error: any) {
    const msg = error?.message || "Failed to create live examination paper.";
    if (msg.includes("PAPER_CREATION_BLOCKED") || msg.includes("INSUFFICIENT_APPROVED_QUESTION_BANK")) {
      return apiError(msg, "PAPER_GATE_FAILED", 422);
    }
    return apiError(msg, "INTERNAL_ERROR", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawFilters = {
      status: searchParams.get("status") || undefined,
      boardId: searchParams.get("boardId") || undefined,
      classId: searchParams.get("classId") || undefined,
      subjectId: searchParams.get("subjectId") || undefined,
      searchQuery: searchParams.get("searchQuery") || undefined,
    };

    const parsed = PaperSearchFiltersSchema.safeParse(rawFilters);
    if (!parsed.success) {
      return apiError("Invalid paper filter query parameters.", "INVALID_FILTERS", 400);
    }

    const papers = await ExamRepository.listPapers(parsed.data);
    return apiSuccess({ papers, count: papers.length });
  } catch (error: any) {
    return apiError(error?.message || "Failed to list examination papers.", "INTERNAL_ERROR", 500);
  }
}
