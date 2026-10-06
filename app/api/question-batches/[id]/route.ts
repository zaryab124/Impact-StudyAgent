import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { QuestionBankRepository } from "@/server/question-generation/question-bank-repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batch = await QuestionBankRepository.findBatchById(id);

    if (!batch) {
      return apiError(`Question generation batch "${id}" not found.`, "NOT_FOUND", 404);
    }

    return apiSuccess(batch);
  } catch (error: any) {
    return apiError(error.message || "Failed to retrieve batch.", "RETRIEVAL_FAILED", 500);
  }
}
