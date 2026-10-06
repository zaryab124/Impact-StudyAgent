// ==============================================================================
// AI Live Paper Generator - Background Jobs API (Phase 10)
// GET/POST /api/admin/jobs - Task Scheduling, Queue Metrics & Job Management
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { JobService } from "@/server/jobs/job-service";
import { JobType, JobPriority } from "@/server/jobs/job-types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as any;
    const type = searchParams.get("type") as any;

    const metrics = JobService.getQueueMetrics();
    const jobs = JobService.listJobs({ status, type, limit: 50 });

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        jobs,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve background jobs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, jobId, type, payload, priority } = body;

    if (action === "cancel" && jobId) {
      const cancelled = JobService.cancelJob(jobId);
      return NextResponse.json({
        success: true,
        data: { jobId, cancelled },
      });
    }

    if (action === "dispatch" && type) {
      const job = JobService.dispatchJob(
        type as JobType,
        payload || {},
        { priority: (priority as JobPriority) || "NORMAL" }
      );
      return NextResponse.json({
        success: true,
        data: { job },
      }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: "dispatch", "cancel".' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to execute job operation" },
      { status: 400 }
    );
  }
}
