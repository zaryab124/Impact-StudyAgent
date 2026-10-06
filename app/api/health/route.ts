import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkDatabaseHealth } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const dbHealth = await checkDatabaseHealth();

    const isSystemHealthy = dbHealth.connected;

    const healthData = {
      status: isSystemHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      version: "0.1.0",
      environment: process.env.NODE_ENV || "development",
      subsystems: {
        application: {
          status: "UP",
          message: "Application server is running normally",
        },
        database: {
          status: dbHealth.connected ? "UP" : "DOWN",
          latencyMs: dbHealth.latencyMs,
          message: dbHealth.connected
            ? "Database connection active"
            : dbHealth.error || "Database unreachable",
        },
      },
    };

    return apiSuccess(healthData, isSystemHealthy ? 200 : 503);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Health check failure";
    return apiError(message, "HEALTH_CHECK_ERROR", 500);
  }
}
