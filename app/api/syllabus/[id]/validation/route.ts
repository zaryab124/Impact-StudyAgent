import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { SyllabusService } from "@/server/syllabus/syllabus-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await SyllabusService.getValidationReport(id);
    return apiSuccess(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate validation report";
    const status = message.includes("not found") ? 404 : 500;
    return apiError(message, "VALIDATION_REPORT_ERROR", status);
  }
}
