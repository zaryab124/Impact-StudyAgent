// ==============================================================================
// AI Live Paper Generator - Production Readiness Probe (Phase 10)
// GET /api/health/ready - Full System Readiness Diagnostic Endpoint
// ==============================================================================

import { NextResponse } from "next/server";
import { HealthService } from "@/server/observability/health-service";

export async function GET() {
  try {
    const report = await HealthService.getSystemHealth();
    const statusCode = report.overallStatus === "NOT_READY" ? 503 : 200;
    return NextResponse.json(report, { status: statusCode });
  } catch (error: any) {
    return NextResponse.json(
      {
        overallStatus: "NOT_READY",
        error: error.message || "Failed to execute readiness diagnostic probe",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
