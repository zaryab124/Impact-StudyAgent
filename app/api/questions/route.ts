import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { CreateQuestionSchema } from "@/lib/validations/paper";
import { QuestionBankRepository } from "@/server/question-generation/question-bank-repository";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const blueprintId = searchParams.get("blueprintId") || undefined;
    const topicId = searchParams.get("topicId") || undefined;
    const questionType = searchParams.get("questionType") || searchParams.get("type") || undefined;
    const difficulty = searchParams.get("difficulty") || undefined;
    const reviewStatus = (searchParams.get("reviewStatus") as any) || undefined;
    const searchQuery = searchParams.get("searchQuery") || searchParams.get("q") || undefined;

    const userRole = req.headers.get("x-user-role") || "STUDENT";
    const isStudent = userRole === "STUDENT";

    // 1. Fetch Candidates from repository
    let candidates = await QuestionBankRepository.listCandidates({
      blueprintId,
      topicId,
      questionType,
      difficulty,
      reviewStatus,
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      candidates = candidates.filter(
        (c) =>
          c.questionText.toLowerCase().includes(q) ||
          c.topicTitle.toLowerCase().includes(q) ||
          c.chapterTitle.toLowerCase().includes(q)
      );
    }

    // 2. Fetch official Question Bank items
    const bankItems = await QuestionBankRepository.searchBankItems({
      topicId,
      questionType,
      difficulty,
      searchQuery,
    });

    // 3. Apply Student Safety Quarantine: never expose answer keys to students
    const sanitizedCandidates = candidates.map((c) => {
      if (isStudent) {
        const { answerMaterial, validationReport, reviewAuditTrail, ...safeCandidate } = c;
        return {
          ...safeCandidate,
          // Expose options without correct answer indicators
          options: answerMaterial?.options?.map((o) => ({ key: o.key, text: o.text })),
        };
      }
      return c;
    });

    const sanitizedBankItems = bankItems.map((b) => {
      if (isStudent) {
        const { answerMaterial, validationReport, historicalVersions, ...safeItem } = b;
        return {
          ...safeItem,
          options: answerMaterial?.options?.map((o) => ({ key: o.key, text: o.text })),
        };
      }
      return b;
    });

    return apiSuccess({
      totalCandidates: sanitizedCandidates.length,
      candidates: sanitizedCandidates,
      totalBankItems: sanitizedBankItems.length,
      bankItems: sanitizedBankItems,
    });
  } catch (error: any) {
    console.error("[API GET /api/questions] Error:", error);
    return apiError(error.message || "Failed to list questions.", "FETCH_FAILED", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const roleHeader = req.headers.get("x-user-role") || "ADMIN";
    if (roleHeader === "STUDENT") {
      return apiError(
        "Unauthorized: Students are not permitted to register questions.",
        "FORBIDDEN",
        403
      );
    }

    const body = await req.json();
    const parsed = CreateQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "Question validation failed",
        "VALIDATION_ERROR",
        400,
        parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          issue: e.message,
        }))
      );
    }

    return apiSuccess(
      {
        message: "Question item registered with complete provenance",
        questionId: "q_" + Date.now(),
        question: parsed.data,
      },
      201
    );
  } catch (error: any) {
    return apiError(error.message || "Error creating question", "QUESTION_ERROR", 500);
  }
}
