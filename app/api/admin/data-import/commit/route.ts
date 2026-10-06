// ==============================================================================
// AI Live Paper Generator - Educational Data Import Commit API (Phase 10)
// POST /api/admin/data-import/commit - Commits Verified Curriculum Data with Audit
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { DataImportService } from "@/server/data-import/data-import-service";
import { RateLimiter } from "@/server/security/rate-limiter";
import { ServerAuthService } from "@/server/auth/auth-service";
import { Permission } from "@/types/auth";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "admin-client";
  const rateLimit = RateLimiter.checkLimit(ip, "ADMIN");
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait.", retryAfterSeconds: rateLimit.retryAfterSeconds },
      { status: 429 }
    );
  }

  // Server authorization
  const authHeader = req.headers.get("authorization") || req.headers.get("x-user-id");
  const user = await ServerAuthService.authenticateSession(authHeader || undefined);
  const authCheck = await ServerAuthService.authorizeUser(user, Permission.IMPORT_DATA);

  if (!authCheck.authorized) {
    // In local dev without session token, allow if user header exists or fallback for development
    if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
      return NextResponse.json({ error: authCheck.reason }, { status: 403 });
    }
  }

  try {
    const body = await req.json();
    const rawData = body.payload || body;
    const format = body.format || "json";
    const userId = user?.id || body.userId || "admin-user-id";

    const parsed = DataImportService.parsePayload(rawData, format);
    const result = await DataImportService.commitImport(parsed, userId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to commit curriculum import",
      },
      { status: 400 }
    );
  }
}
