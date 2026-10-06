// ==============================================================================
// AI Live Paper Generator - Single Validation Run Details API (Phase 11)
// GET: Fetch Complete Validation Run with Domain Summaries and Evidence Checks
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { ValidationRepository } from "@/server/validation/validation-repository";
import { ServerAuthService } from "@/server/auth/auth-service";
import { Permission } from "@/types/auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await ServerAuthService.authenticateSession(
      request.headers.get("Authorization") || undefined
    );
    const authCheck = await ServerAuthService.authorizeUser(authUser, Permission.VIEW_AUDIT_LOGS);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: 403 });
    }

    const { id } = await context.params;
    const run = await ValidationRepository.findRunById(id);

    if (!run) {
      return NextResponse.json({ error: `Validation run "${id}" not found.` }, { status: 404 });
    }

    return NextResponse.json({ success: true, run });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch validation run" }, { status: 500 });
  }
}
