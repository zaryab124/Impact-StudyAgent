import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { EducationService } from "@/server/education-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const topics = await EducationService.getChapterTopics(id);
    return apiSuccess({
      chapterId: id,
      total: topics.length,
      topics,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching topics";
    const status = message.includes("not found") ? 404 : 500;
    return apiError(message, "TOPICS_FETCH_ERROR", status);
  }
}
