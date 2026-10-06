// ==============================================================================
// AI Live Paper Generator - Validation Runs API (Phase 11)
// GET: List Runs, POST: Execute Full 20-Domain Validation Run
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { ValidationEngine } from "@/server/validation/validation-engine";
import { ValidationRepository } from "@/server/validation/validation-repository";
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const runs = await ValidationRepository.listRuns(limit);
    return NextResponse.json({ success: true, runs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to list validation runs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await ServerAuthService.authenticateSession(
      request.headers.get("Authorization") || undefined
    );
    const authCheck = await ServerAuthService.authorizeUser(authUser, Permission.SYSTEM_SETTINGS);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const initiatedBy = body.initiatedBy || authUser?.name || "admin";

    const run = await ValidationEngine.executeFullValidation(initiatedBy);
    return NextResponse.json({ success: true, run }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to execute validation run" }, { status: 500 });
  }
}
