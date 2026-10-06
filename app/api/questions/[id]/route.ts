import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { QuestionBankRepository } from "@/server/question-generation/question-bank-repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userRole = req.headers.get("x-user-role") || "STUDENT";
    const isStudent = userRole === "STUDENT";

    // 1. Check in candidate repository
    const candidate = await QuestionBankRepository.findCandidateById(id);
    if (candidate) {
      if (isStudent) {
        const { answerMaterial, validationReport, reviewAuditTrail, ...safeCandidate } = candidate;
        return apiSuccess({
          ...safeCandidate,
          options: answerMaterial?.options?.map((o) => ({ key: o.key, text: o.text })),
        });
      }
      return apiSuccess(candidate);
    }

    // 2. Check in Question Bank
    const bankItem = await QuestionBankRepository.findBankItemById(id);
    if (bankItem) {
      if (isStudent) {
        const { answerMaterial, validationReport, historicalVersions, ...safeItem } = bankItem;
        return apiSuccess({
          ...safeItem,
          options: answerMaterial?.options?.map((o) => ({ key: o.key, text: o.text })),
        });
      }
      return apiSuccess(bankItem);
    }

    return apiError(`Question with ID "${id}" was not found.`, "NOT_FOUND", 404);
  } catch (error: any) {
    return apiError(error.message || "Failed to retrieve question.", "RETRIEVAL_FAILED", 500);
  }
}
