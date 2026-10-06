import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { AlignCurriculumInputSchema } from "@/lib/validations/syllabus";
import { CurriculumAligner } from "@/server/syllabus/curriculum-aligner";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = AlignCurriculumInputSchema.safeParse(body);

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

    const report = await CurriculumAligner.alignSyllabusWithBook(
      id,
      parsed.data.bookId,
      {
        thresholdMatch: parsed.data.thresholdMatch,
        thresholdPartial: parsed.data.thresholdPartial,
      }
    );

    return apiSuccess({
      message: "Curriculum alignment executed successfully.",
      report,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Curriculum alignment failed";
    const status = message.includes("not found") ? 404 : 500;
    return apiError(message, "ALIGNMENT_ERROR", status);
  }
}
