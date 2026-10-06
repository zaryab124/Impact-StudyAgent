import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { QuestionBankRepository } from "@/server/question-generation/question-bank-repository";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const blueprintId = searchParams.get("blueprintId") || undefined;

    const batches = await QuestionBankRepository.listBatches(blueprintId);
    return apiSuccess({
      total: batches.length,
      batches,
    });
  } catch (error: any) {
    return apiError(error.message || "Failed to list question generation batches.", "LIST_FAILED", 500);
  }
}
