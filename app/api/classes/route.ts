import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { CreateClassSchema } from "@/lib/validations/education";
import { EducationService } from "@/server/education-service";

export async function GET(req: NextRequest) {
  try {
    const academicYearId = req.nextUrl.searchParams.get("academicYearId") || undefined;
    const classes = await EducationService.getClasses(academicYearId);
    return apiSuccess({
      total: classes.length,
      classes,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve classes";
    return apiError(message, "CLASSES_FETCH_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateClassSchema.safeParse(body);

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

    const created = await EducationService.createClass(parsed.data);
    return apiSuccess(created, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error creating class";
    const status = message.includes("already exists") ? 409 : message.includes("not found") ? 404 : 500;
    return apiError(message, "CLASS_ERROR", status);
  }
}
