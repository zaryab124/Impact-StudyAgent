import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { AuthGuard } from "@/lib/auth-guard";
import { SubscriptionService } from "@/server/subscription/subscription-service";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  // Require PARENT or ADMIN role
  const auth = await AuthGuard.requireRole(req, ["PARENT", "ADMIN"], {
    requireActiveSubscription: false,
  });

  if (!auth.authorized || !auth.user) {
    return auth.response!;
  }

  const user = auth.user;
  const studentIdParam = req.nextUrl.searchParams.get("studentId");

  try {
    let targetStudentId = studentIdParam;

    if (user.role === "PARENT") {
      // Find the student linked to this verified parent
      const link = await prisma.parentStudentLink.findFirst({
        where: { parentId: user.id },
      });
      if (link) {
        targetStudentId = link.studentId;
      }
    }

    // If still no studentId, find the first student in the database or fallback for admin oversight
    if (!targetStudentId) {
      const firstStudent = await prisma.user.findFirst({
        where: { role: "STUDENT" },
        select: { id: true },
      });
      targetStudentId = firstStudent?.id || "student-user-id";
    }

    const analytics = await SubscriptionService.getStudentAnalytics(targetStudentId);

    return apiSuccess({
      parent: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      analytics,
    });
  } catch (error: any) {
    return apiError(
      error.message || "Failed to load parent analytics",
      "PARENT_ANALYTICS_ERROR",
      500
    );
  }
}
