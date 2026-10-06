import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { CreateBookSchema } from "@/lib/validations/education";
import { EducationService } from "@/server/education-service";

export async function GET(req: NextRequest) {
  try {
    const subjectId = req.nextUrl.searchParams.get("subjectId") || undefined;
    const books = await EducationService.getBooks(subjectId);
    return apiSuccess({
      total: books.length,
      books,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve books";
    return apiError(message, "BOOKS_FETCH_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateBookSchema.safeParse(body);

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

    const created = await EducationService.createBook(parsed.data);
    return apiSuccess(created, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error creating book";
    const status = message.includes("already exists") ? 409 : message.includes("not found") ? 404 : message.includes("Referential mismatch") ? 422 : 500;
    return apiError(message, "BOOK_ERROR", status);
  }
}
