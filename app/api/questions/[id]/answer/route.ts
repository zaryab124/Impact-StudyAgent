import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { QuestionBankRepository } from "@/server/question-generation/question-bank-repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roleHeader = req.headers.get("x-user-role") || "STUDENT";

    // STRICT STUDENT SAFETY GATE: Students must NEVER receive answer material directly
    if (roleHeader === "STUDENT") {
      return apiError(
        "Unauthorized: Student role is strictly forbidden from accessing question answer keys and internal rubrics.",
        "FORBIDDEN",
        403
      );
    }

    // 1. Check in candidate repository
    const candidate = await QuestionBankRepository.findCandidateById(id);
    if (candidate) {
      return apiSuccess({
        questionId: candidate.id,
        questionType: candidate.questionType,
        marks: candidate.marks,
        answerMaterial: candidate.answerMaterial,
      });
    }

    // 2. Check in Question Bank
    const bankItem = await QuestionBankRepository.findBankItemById(id);
    if (bankItem) {
      return apiSuccess({
        questionId: bankItem.id,
        questionType: bankItem.questionType,
        marks: bankItem.marks,
        answerMaterial: bankItem.answerMaterial,
      });
    }

    return apiError(`Question with ID "${id}" was not found.`, "NOT_FOUND", 404);
  } catch (error: any) {
    return apiError(error.message || "Failed to retrieve answer key.", "RETRIEVAL_FAILED", 500);
  }
}
