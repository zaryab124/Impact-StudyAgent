// ==============================================================================
// AI Live Paper Generator - Launch Readiness Evaluation API (Phase 11)
// GET: Evaluate 20-Domain Launch Readiness Status, Critical Checks & Blocking Issues
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { ValidationEngine } from "@/server/validation/validation-engine";
import { ServerAuthService } from "@/server/auth/auth-service";
import { Permission } from "@/types/auth";

export async function GET(request: NextRequest) {
  try {
    const authUser = await ServerAuthService.authenticateSession(
      request.headers.get("Authorization") || undefined
    );
    const authCheck = await ServerAuthService.authorizeUser(authUser, Permission.VIEW_AUDIT_LOGS);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: 403 });
    }

    const report = await ValidationEngine.evaluateLaunchReadiness();
    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to evaluate launch readiness" },
      { status: 500 }
    );
  }
}
