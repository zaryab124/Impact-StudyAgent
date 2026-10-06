import { prisma } from "@/lib/db";

export interface LogAuditEventParams {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export class AuditLogger {
  private static memoryLogs: LogAuditEventParams[] = [];

  /**
   * Persists an immutable security audit event to the database.
   * Catches errors gracefully so logging failures do not break the main transaction flow.
   */
  public static async log(params: LogAuditEventParams): Promise<void> {
    this.memoryLogs.push(params);

    if (process.env.NODE_ENV !== "test") {
      try {
        await prisma.auditLog.create({
          data: {
            userId: params.userId,
            action: params.action,
            resource: params.resource,
            resourceId: params.resourceId,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
            metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
          },
        });
      } catch (error) {
        console.error("[AuditLogger] Failed to write audit event:", error);
      }
    }
  }

  public static getMemoryLogs(): LogAuditEventParams[] {
    return [...this.memoryLogs];
  }

  public static resetMemory(): void {
    this.memoryLogs = [];
  }
}
