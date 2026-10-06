// ==============================================================================
// AI Live Paper Generator - Liveness Probe (Phase 10)
// GET /api/health/live - Fast Container Liveness Check
// ==============================================================================

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    pid: process.pid,
  });
}
