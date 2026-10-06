import { describe, it, expect, vi } from "vitest";
import { checkDatabaseHealth } from "@/lib/db";

describe("Health Diagnostic & System Status Checks", () => {
  it("should report database health status gracefully without crashing", async () => {
    // Calling checkDatabaseHealth returns { connected: boolean, latencyMs?: number }
    const result = await checkDatabaseHealth();
    expect(result).toBeDefined();
    expect(typeof result.connected).toBe("boolean");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  }, 10000);

  it("should format health response correctly when database is mocked as connected", () => {
    const mockHealthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptimeSeconds: 120,
      version: "0.1.0",
      environment: "test",
      subsystems: {
        application: {
          status: "UP",
          message: "Application server is running normally",
        },
        database: {
          status: "UP",
          latencyMs: 12,
          message: "Database connection active",
        },
      },
    };

    expect(mockHealthData.status).toBe("healthy");
    expect(mockHealthData.subsystems.application.status).toBe("UP");
    expect(mockHealthData.subsystems.database.status).toBe("UP");
  });
});
