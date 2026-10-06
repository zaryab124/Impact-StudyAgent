// ==============================================================================
// AI Live Paper Generator - Admin Exam Audit Logs API (Phase 9)
// GET /api/admin/exams/audit-logs
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ExamRepository } from "@/server/exam-engine/exam-repository";

export async function GET(req: NextRequest) {
  try {
    const roleHeader = req.headers.get("x-user-role");
    if (roleHeader === "STUDENT") {
      return apiError("Forbidden: Students cannot access administrative resources.", "FORBIDDEN", 403);
    }

    const { searchParams } = new URL(req.url);
    const filters = {
      entityId: searchParams.get("entityId") || undefined,
      entityType: searchParams.get("entityType") || undefined,
      action: searchParams.get("action") || undefined,
    };

    const logs = await ExamRepository.listAuditLogs(filters);
    return apiSuccess({ logs, count: logs.length });
  } catch (error: any) {
    return apiError(error?.message || "Failed to retrieve audit logs.", "INTERNAL_ERROR", 500);
  }
}
