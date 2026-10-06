import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { AlignmentReviewInputSchema } from "@/lib/validations/syllabus";
import { SyllabusService } from "@/server/syllabus/syllabus-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = AlignmentReviewInputSchema.safeParse(body);

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

    const roleHeader = req.headers.get("x-user-role") || "ADMIN";
    const reviewerId = req.headers.get("x-user-id") || parsed.data.reviewerId || "admin-system";

    const result = await SyllabusService.reviewAlignment(
      id,
      {
        ...parsed.data,
        reviewerId,
      },
      roleHeader
    );

    return apiSuccess({
      message: "Alignment decision reviewed and recorded with audit trail.",
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to review alignment";
    const status = message.includes("Unauthorized") ? 403 : message.includes("not found") ? 404 : 400;
    return apiError(message, "REVIEW_ERROR", status);
  }
}
