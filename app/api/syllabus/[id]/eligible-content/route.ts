import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { EligibilityQueryService } from "@/server/syllabus/eligibility-query-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = req.nextUrl;

    const chapterId = searchParams.get("chapterId") || undefined;
    const topicId = searchParams.get("topicId") || undefined;
    const chunkType = searchParams.get("chunkType") || undefined;
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));
    const requireProductionReady = searchParams.get("requireProductionReady") === "true";

    const eligibleKnowledge = await EligibilityQueryService.getEligibleKnowledge({
      syllabusId: id,
      chapterId,
      topicId,
      chunkType,
      limit,
      offset,
      requireProductionReady,
    });

    return apiSuccess({
      syllabusId: id,
      total: eligibleKnowledge.length,
      limit,
      offset,
      results: eligibleKnowledge,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve eligible knowledge";
    const status = message.includes("not found") ? 404 : message.includes("authorized") ? 403 : 500;
    return apiError(message, "ELIGIBLE_CONTENT_ERROR", status);
  }
}
