// ==============================================================================
// GET /api/curriculum/chapters
// Fetches official curriculum chapters for any class and subject (Classes 9-12)
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { PakistanCurriculumService } from "@/server/curriculum/pakistan-curriculum-registry";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classLevel = searchParams.get("class") || searchParams.get("className") || "9";
    const subject = searchParams.get("subject") || searchParams.get("subjectCode") || "PHY";

    const chapters = PakistanCurriculumService.getChapters(classLevel, subject);
    const metadata = PakistanCurriculumService.getSubjectMetadata(classLevel, subject);

    return apiSuccess({
      classLevel: metadata.classLevel,
      subjectKey: metadata.subjectKey,
      subjectName: metadata.subjectName,
      totalChapters: chapters.length,
      totalMarksBoard: metadata.totalMarks,
      durationMinutes: metadata.durationMinutes,
      chapters,
    });
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch curriculum chapters.", "CURRICULUM_CHAPTERS_ERROR", 500);
  }
}
