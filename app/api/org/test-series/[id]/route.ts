import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const testSeries = await (prisma as any).organizationTestSeries.findUnique({
      where: { id },
      include: {
        organization: true,
      },
    });

    if (!testSeries) {
      return apiError(`Test Series with ID "${id}" not found.`, "NOT_FOUND", 404);
    }

    return apiSuccess({ testSeries });
  } catch (error: any) {
    return apiError(error.message || "Failed to load test series", "TEST_SERIES_FETCH_ERROR", 500);
  }
}
