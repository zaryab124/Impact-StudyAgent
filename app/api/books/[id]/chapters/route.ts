import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { EducationService } from "@/server/education-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chapters = await EducationService.getBookChapters(id);
    return apiSuccess({
      bookId: id,
      total: chapters.length,
      chapters,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching chapters";
    const status = message.includes("not found") ? 404 : 500;
    return apiError(message, "CHAPTERS_FETCH_ERROR", status);
  }
}
