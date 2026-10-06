// ==============================================================================
// AI Live Paper Generator - Validation Audit Report Export API (Phase 11)
// GET: Sanitized Launch Readiness Audit Report Export (Strictly Strips Secrets)
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
    const format = searchParams.get("format") || "json";

    const report = await ValidationEngine.evaluateLaunchReadiness();
    const latestRun = await ValidationRepository.getLatestRun();
    const performance = ValidationRepository.getRecentPerformance(20);

    // Sanitize export payload (guarantee 0 secrets or raw environment credentials)
    const sanitizedExport = {
      exportTimestamp: new Date().toISOString(),
      releaseCandidate: report.releaseCandidate,
      environment: report.environment,
      version: report.version,
      launchStatus: report.status,
      canLaunch: report.canLaunch,
      criticalChecks: report.criticalChecks,
      domainSummaries: report.domainSummaries,
      blockingIssues: report.blockingIssues,
      warnings: report.warnings,
      unverifiedItems: report.unverifiedItems,
      recentPerformanceMeasurements: performance.map((p) => ({
        operationName: p.operationName,
        latencyMs: p.latencyMs,
        status: p.status,
      })),
      auditVerificationTrail: {
        totalChecks: latestRun?.checks.length || 0,
        runId: latestRun?.id || "N/A",
        initiatedBy: latestRun?.initiatedBy || "N/A",
      },
    };

    if (format === "markdown") {
      let md = `# AI Live Paper Generator - Launch Readiness Audit Report\n\n`;
      md += `**Release Candidate**: ${sanitizedExport.releaseCandidate}\n`;
      md += `**Evaluated At**: ${sanitizedExport.exportTimestamp}\n`;
      md += `**Launch Status**: ${sanitizedExport.launchStatus}\n`;
      md += `**Can Launch**: ${sanitizedExport.canLaunch ? "YES" : "NO"}\n\n`;

      md += `## Domain Summaries\n\n`;
      md += `| Domain | Status | Tier |\n`;
      md += `|---|---|---|\n`;
      for (const [dom, sum] of Object.entries(sanitizedExport.domainSummaries)) {
        md += `| ${dom} | ${sum.status} | ${sum.tier} |\n`;
      }

      md += `\n## Blocking Issues (${sanitizedExport.blockingIssues.length})\n\n`;
      if (sanitizedExport.blockingIssues.length === 0) {
        md += `*None. No critical blocking issues detected.*\n`;
      } else {
        for (const issue of sanitizedExport.blockingIssues) {
          md += `- ${issue}\n`;
        }
      }

      md += `\n## Warnings & Unverified Items\n\n`;
      for (const warn of sanitizedExport.warnings) {
        md += `- [WARNING] ${warn}\n`;
      }
      for (const unver of sanitizedExport.unverifiedItems) {
        md += `- [UNVERIFIED] ${unver}\n`;
      }

      return new NextResponse(md, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="launch-readiness-${report.releaseCandidate}.md"`,
        },
      });
    }

    return NextResponse.json({ success: true, export: sanitizedExport });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to export validation report" },
      { status: 500 }
    );
  }
}
