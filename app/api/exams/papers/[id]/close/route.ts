import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ExamService } from "@/server/exam-engine/exam-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const paper = await ExamService.closePaper(id);
    return apiSuccess(paper);
  } catch (error: any) {
    return apiError(error?.message || "Failed to close paper.", "CLOSE_ERROR", 400);
  }
}
