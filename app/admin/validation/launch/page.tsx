"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Rocket,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Download,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Lock,
} from "lucide-react";
import { LaunchReadinessReport, ValidationDomain } from "@/types/validation";

export default function LaunchReadinessGatePage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<LaunchReadinessReport | null>(null);

  const fetchReadiness = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/validation/launch-readiness");
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      }
    } catch (err) {
      console.error("Failed to load launch readiness", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusBanner = () => {
    if (!report) return null;

    if (report.status === "READY") {
      return (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">READY FOR CONTROLLED PILOT LAUNCH</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  {report.releaseCandidate}
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                All 20 validation domains passed local and pilot verification gates. Zero blocking defects.
              </p>
            </div>
          </div>
          <button
            onClick={() => alert(`Release candidate ${report.releaseCandidate} confirmed ready for controlled launch.`)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-950/60 transition-all whitespace-nowrap"
          >
            Authorize Pilot Deployment
          </button>
        </div>
      );
    }

    if (report.status === "READY_WITH_WARNINGS") {
      return (
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">READY WITH ADVISORY WARNINGS</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  {report.releaseCandidate}
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                Zero blocking errors. System is functional in local mode, but external cloud endpoints or live AI API keys remain unverified.
              </p>
            </div>
          </div>
          <button
            onClick={() => alert(`Proceeding with controlled local pilot launch for ${report.releaseCandidate}.`)}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-amber-950/60 transition-all whitespace-nowrap"
          >
            Proceed with Controlled Pilot
          </button>
        </div>
      );
    }

    return (
      <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl">
            <XCircle className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">LAUNCH BLOCKED: CRITICAL DEFECTS DETECTED</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                {report.releaseCandidate}
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1">
              One or more core gates failed verification. Deployment to production is strictly locked until resolved.
            </p>
          </div>
        </div>
        <button
          disabled
          className="px-5 py-2.5 bg-slate-800 text-slate-500 rounded-xl font-semibold text-sm cursor-not-allowed whitespace-nowrap"
        >
          Launch Locked
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/validation"
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 -ml-1 rounded"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Rocket className="w-7 h-7 text-emerald-400" />
              Launch Readiness Gate & Release Sign-Off
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 ml-9">
            Controlled Production Pilot Evaluation • Evaluated At:{" "}
            <span className="text-slate-300 font-mono">
              {report?.evaluatedAt || "Loading..."}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/admin/validation/export?format=markdown"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Markdown Report
          </a>
          <button
            onClick={fetchReadiness}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Re-evaluate Gate
          </button>
        </div>
      </div>

      {/* Main Status Banner */}
      {getStatusBanner()}

      {/* Grid of Sections: Blocking, Warnings, Unverified */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Blocking Issues */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider font-mono">
              <XCircle className="w-4 h-4 text-rose-400" />
              Blocking Issues ({report?.blockingIssues.length || 0})
            </h3>
            <span className="text-xs text-rose-400 font-mono">Must be 0</span>
          </div>

          {!report || report.blockingIssues.length === 0 ? (
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Zero blocking defects detected. Educational gates cleared.</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {report.blockingIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl text-rose-200 text-xs font-mono leading-relaxed"
                >
                  {issue}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Advisory Warnings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Advisory Warnings ({report?.warnings.length || 0})
            </h3>
            <span className="text-xs text-amber-400 font-mono">Non-blocking</span>
          </div>

          {!report || report.warnings.length === 0 ? (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-xs">
              No advisory warnings reported.
            </div>
          ) : (
            <div className="space-y-2.5">
              {report.warnings.map((warn, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-amber-200 text-xs font-mono leading-relaxed"
                >
                  {warn}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unverified Items */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider font-mono">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              Unverified Items ({report?.unverifiedItems.length || 0})
            </h3>
            <span className="text-xs text-slate-400 font-mono">Honest Reporting</span>
          </div>

          {!report || report.unverifiedItems.length === 0 ? (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-xs">
              All items verified against live environment.
            </div>
          ) : (
            <div className="space-y-2.5">
              {report.unverifiedItems.map((unv, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs font-mono leading-relaxed"
                >
                  {unv}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 20-Domain Launch Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2 font-mono">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          20-Domain Verification Matrix & Launch Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {report &&
            Object.entries(report.domainSummaries).map(([domain, info]) => (
              <div
                key={domain}
                className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between"
              >
                <div className="truncate mr-2">
                  <div className="text-xs font-mono font-semibold text-slate-300 truncate">
                    {domain}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {info.tier}
                  </div>
                </div>
                <div>
                  {info.status === "PASSED" ? (
                    <span className="text-xs text-emerald-400 font-mono font-semibold">PASS</span>
                  ) : info.status === "FAILED" ? (
                    <span className="text-xs text-rose-400 font-mono font-semibold">FAIL</span>
                  ) : (
                    <span className="text-xs text-amber-400 font-mono font-semibold">WARN</span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
