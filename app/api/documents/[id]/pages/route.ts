import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = req.nextUrl;
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    const doc = await prisma.document.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!doc) {
      return apiError(`Document with ID "${id}" was not found.`, "DOCUMENT_NOT_FOUND", 404);
    }

    const [total, pages] = await Promise.all([
      prisma.documentPage.count({ where: { documentId: id } }),
      prisma.documentPage.findMany({
        where: { documentId: id },
        take: limit,
        skip: offset,
        orderBy: { pageNumber: "asc" },
      }),
    ]);

    const serialized = pages.map((p) => ({
      id: p.id,
      pageNumber: p.pageNumber,
      rawText: p.rawText,
      status: p.status,
      extractionMethod: p.extractionMethod,
      confidence: p.confidence,
      contentType: p.contentType,
      hasTables: p.hasTables,
      hasDiagrams: p.hasDiagrams,
      hasFormulas: p.hasFormulas,
      metadata: p.metadata,
      createdAt: p.createdAt.toISOString(),
    }));

    return apiSuccess({
      documentId: id,
      total,
      limit,
      offset,
      pages: serialized,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch document pages";
    return apiError(message, "PAGES_FETCH_ERROR", 500);
  }
}
