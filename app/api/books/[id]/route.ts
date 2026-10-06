import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { EducationService } from "@/server/education-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const book = await EducationService.getBookById(id);
    return apiSuccess(book);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching book";
    const status = message.includes("not found") ? 404 : 500;
    return apiError(message, "BOOK_FETCH_ERROR", status);
  }
}
