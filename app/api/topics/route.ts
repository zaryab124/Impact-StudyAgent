import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { CreateTopicSchema } from "@/lib/validations/education";
import { EducationService } from "@/server/education-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateTopicSchema.safeParse(body);

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

    const created = await EducationService.createTopic(parsed.data);
    return apiSuccess(created, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error creating topic";
    const status = message.includes("already exists") ? 409 : message.includes("not found") ? 404 : 500;
    return apiError(message, "TOPIC_ERROR", status);
  }
}
