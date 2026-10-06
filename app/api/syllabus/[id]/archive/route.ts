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
        "Unauthorized: Only administrators can archive syllabus versions.",
        "FORBIDDEN",
        403
      );
    }

    const archived = await SyllabusService.archiveSyllabus(id, roleHeader, actorId);
    return apiSuccess({
      message: `Syllabus version "${archived.version}" successfully archived.`,
      syllabus: archived,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to archive syllabus";
    const status = message.includes("Unauthorized")
      ? 403
      : message.includes("not found")
      ? 404
      : 400;
    return apiError(message, "ARCHIVE_ERROR", status);
  }
}
