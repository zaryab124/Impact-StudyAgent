import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { SyllabusService } from "@/server/syllabus/syllabus-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const syllabus = await SyllabusService.getSyllabusById(id);
    return apiSuccess(syllabus);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch syllabus";
    const status = message.includes("not found") ? 404 : 500;
    return apiError(message, "SYLLABUS_FETCH_ERROR", status);
  }
}
