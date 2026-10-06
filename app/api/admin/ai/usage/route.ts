// ==============================================================================
// AI Live Paper Generator - AI Usage & Telemetry API (Phase 10)
// GET /api/admin/ai/usage - Model Token Consumption, Costs & Provider Analytics
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { AIUsageLogger } from "@/server/ai/usage-logger";
import { ProviderHealthTracker } from "@/server/ai/orchestration/provider-health";

export async function GET(req: NextRequest) {
  try {
    const roleHeader = req.headers.get("x-user-role");
    if (roleHeader === "STUDENT") {
      return NextResponse.json({ success: false, error: "Forbidden: Students cannot access administrative resources." }, { status: 403 });
    }

    const summary = AIUsageLogger.getUsageSummary();
    const recentLogs = AIUsageLogger.getLogs(25);
    const providerHealth = ProviderHealthTracker.getAllProviderHealth();

    return NextResponse.json({
      success: true,
      data: {
        summary,
        recentLogs,
        providerHealth,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to retrieve AI usage statistics",
      },
      { status: 500 }
    );
  }
}
