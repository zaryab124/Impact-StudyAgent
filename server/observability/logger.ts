// ==============================================================================
// AI Live Paper Generator - Structured Telemetry Logger (Phase 10)
// High-Performance JSON Observability & Admin Diagnostic Ring Buffer
// ==============================================================================

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  action: string;
  message: string;
  requestId?: string;
  userId?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class AppLogger {
  private static ringBuffer: LogEntry[] = [];
  private static readonly MAX_BUFFER_SIZE = 500;

  public static log(entry: Omit<LogEntry, "id" | "timestamp">): LogEntry {
    const fullEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.ringBuffer.unshift(fullEntry);
    if (this.ringBuffer.length > this.MAX_BUFFER_SIZE) {
      this.ringBuffer.pop();
    }

    if (process.env.NODE_ENV !== "test") {
      const output = JSON.stringify(fullEntry);
      if (entry.level === "ERROR") {
        console.error(output);
      } else if (entry.level === "WARN") {
        console.warn(output);
      } else {
        console.log(output);
      }
    }

    return fullEntry;
  }

  public static info(action: string, message: string, metadata?: Record<string, unknown>): LogEntry {
    return this.log({ level: "INFO", action, message, metadata });
  }

  public static warn(action: string, message: string, metadata?: Record<string, unknown>): LogEntry {
    return this.log({ level: "WARN", action, message, metadata });
  }

  public static error(action: string, message: string, error?: Error, metadata?: Record<string, unknown>): LogEntry {
    return this.log({
      level: "ERROR",
      action,
      message,
      metadata,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    });
  }

  public static getRecentLogs(limit: number = 50, level?: LogLevel): LogEntry[] {
    let list = this.ringBuffer;
    if (level) {
      list = list.filter((l) => l.level === level);
    }
    return list.slice(0, limit);
  }

  public static clear(): void {
    this.ringBuffer = [];
  }
}
