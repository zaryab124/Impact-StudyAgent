import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { CreateBoardSchema } from "@/lib/validations/education";
import { EducationService } from "@/server/education-service";

export async function GET() {
  try {
    const boards = await EducationService.getBoards();
    return apiSuccess({
      total: boards.length,
      boards,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve boards";
    return apiError(message, "BOARDS_FETCH_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateBoardSchema.safeParse(body);

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

    const created = await EducationService.createBoard(parsed.data);
    return apiSuccess(created, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error creating board";
    const status = message.includes("already exists") ? 409 : 500;
    return apiError(message, status === 409 ? "DUPLICATE_RECORD" : "BOARD_CREATE_ERROR", status);
  }
}
