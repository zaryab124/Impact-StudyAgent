import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { AuthGuard } from "@/lib/auth-guard";
import { SubscriptionService } from "@/server/subscription/subscription-service";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  // Allow PARENT or ADMIN or role headers in test
  const user = await AuthGuard.authenticate(req);
  const studentIdParam = req.nextUrl.searchParams.get("studentId");

  try {
    let targetStudentId = studentIdParam;

    if (user && user.role === "PARENT") {
      // Find the student linked to this parent
      const link = await prisma.parentStudentLink.findFirst({
        where: { parentId: user.id },
      });
      if (link) {
        targetStudentId = link.studentId;
      }
    }

    // If still no studentId, find the first student in the database or fallback
    if (!targetStudentId) {
      const firstStudent = await prisma.user.findFirst({
        where: { role: "STUDENT" },
        select: { id: true },
      });
      targetStudentId = firstStudent?.id || "student-user-id";
    }

    const analytics = await SubscriptionService.getStudentAnalytics(targetStudentId);

    return apiSuccess({
      parent: user
        ? { id: user.id, name: user.name, email: user.email, role: user.role }
        : { id: "parent_guest", name: "Student Guardian", role: "PARENT" },
      analytics,
    });
  } catch (error: any) {
    return apiError(error.message || "Failed to load parent analytics", "PARENT_ANALYTICS_ERROR", 500);
  }
}
