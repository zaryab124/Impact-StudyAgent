// ==============================================================================
// AI Live Paper Generator - System Readiness Diagnostic API (Phase 10)
// GET /api/admin/system/readiness - 15-Point Automated Readiness Audit
// ==============================================================================

import { NextResponse } from "next/server";
import { HealthService } from "@/server/observability/health-service";

export async function GET() {
  try {
    const report = await HealthService.getSystemHealth();
    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to execute readiness audit",
      },
      { status: 500 }
    );
  }
}
