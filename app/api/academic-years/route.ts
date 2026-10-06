import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { CreateAcademicYearSchema } from "@/lib/validations/education";
import { EducationService } from "@/server/education-service";

export async function GET(req: NextRequest) {
  try {
    const boardId = req.nextUrl.searchParams.get("boardId") || undefined;
    const academicYears = await EducationService.getAcademicYears(boardId);
    return apiSuccess({
      total: academicYears.length,
      academicYears,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve academic years";
    return apiError(message, "ACADEMIC_YEARS_FETCH_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateAcademicYearSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          issue: e.message,
        }))
      );
    }

    const created = await EducationService.createAcademicYear(parsed.data);
    return apiSuccess(created, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error creating academic year";
    const status = message.includes("already exists") ? 409 : message.includes("not found") ? 404 : 500;
    return apiError(message, "ACADEMIC_YEAR_ERROR", status);
  }
}
