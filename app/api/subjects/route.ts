import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { CreateSubjectSchema } from "@/lib/validations/education";
import { EducationService } from "@/server/education-service";

export async function GET(req: NextRequest) {
  try {
    const classId = req.nextUrl.searchParams.get("classId") || undefined;
    const subjects = await EducationService.getSubjects(classId);
    return apiSuccess({
      total: subjects.length,
      subjects,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve subjects";
    return apiError(message, "SUBJECTS_FETCH_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateSubjectSchema.safeParse(body);

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

    const created = await EducationService.createSubject(parsed.data);
    return apiSuccess(created, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error creating subject";
    const status = message.includes("already exists") ? 409 : message.includes("not found") ? 404 : 500;
    return apiError(message, "SUBJECT_ERROR", status);
  }
}
