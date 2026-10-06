import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { SyllabusService } from "@/server/syllabus/syllabus-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roleHeader = req.headers.get("x-user-role") || "ADMIN";
    const actorId = req.headers.get("x-user-id") || "admin-system";

    if (roleHeader !== "ADMIN") {
      return apiError(
        "Unauthorized: Only administrators can publish syllabus versions.",
        "FORBIDDEN",
        403
      );
    }

    const published = await SyllabusService.publishSyllabus(id, roleHeader, actorId);
    return apiSuccess({
      message: `Syllabus version "${published.version}" successfully published and verified.`,
      syllabus: published,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to publish syllabus";
    const status = message.includes("Unauthorized")
      ? 403
      : message.includes("not found")
      ? 404
      : 400;
    return apiError(message, "PUBLISH_ERROR", status);
  }
}
