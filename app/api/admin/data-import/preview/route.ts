// ==============================================================================
// AI Live Paper Generator - Educational Data Import Preview API (Phase 10)
// POST /api/admin/data-import/preview - Inspects & Validates Curriculum Hierarchy
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { DataImportService } from "@/server/data-import/data-import-service";
import { RateLimiter } from "@/server/security/rate-limiter";

export async function POST(req: NextRequest) {
  // Apply rate limiter
  const ip = req.headers.get("x-forwarded-for") || "admin-client";
  const rateLimit = RateLimiter.checkLimit(ip, "ADMIN");
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait.", retryAfterSeconds: rateLimit.retryAfterSeconds },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    if (!body || (!body.payload && !body.code)) {
      return NextResponse.json(
        { error: "Missing import payload. Provide JSON or CSV data in request body." },
        { status: 400 }
      );
    }

    const rawData = body.payload || body;
    const format = body.format || "json";

    const parsed = DataImportService.parsePayload(rawData, format);
    const preview = await DataImportService.previewImport(parsed);

    return NextResponse.json({
      success: true,
      data: preview,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to process curriculum import preview",
      },
      { status: 400 }
    );
  }
}
