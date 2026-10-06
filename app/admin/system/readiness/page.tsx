"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Server,
  Database,
  Cpu,
  Lock,
  ListTodo,
  Activity,
} from "lucide-react";

export default function SystemReadinessPage() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const fetchReadiness = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/system/readiness");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to execute readiness audit");
      }
      setReport(json.data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadiness();
  }, []);

  const filteredChecks = report?.readinessChecks.filter((c: any) => {
    if (filter === "ALL") return true;
    return c.category === filter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin"
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Admin Control Center</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-slate-400">System Diagnostics</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <span>Production Readiness &amp; 15-Point System Audit</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Comprehensive pre-flight verification across core database, AI, storage, security, and examination engines.
          </p>
        </div>

        <button
          onClick={fetchReadiness}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Run Readiness Audit</span>
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-lg border border-rose-800 bg-rose-950/60 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading && !report ? (
        <div className="py-20 text-center text-xs text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-500" />
          Evaluating 15-point readiness checklist...
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Top Status Banner */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-slate-400">Platform Deployment Status</div>
              <div className="text-xl font-bold flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ${
                    report.overallStatus === "PRODUCTION_READY"
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : report.overallStatus === "DEGRADED"
                      ? "bg-amber-950 text-amber-300 border border-amber-800"
                      : "bg-rose-950 text-rose-300 border border-rose-800"
                  }`}
                >
                  {report.overallStatus}
                </span>
                <span className="text-xs text-slate-400 font-normal">
                  Environment: <span className="font-mono text-slate-200">{report.environment}</span>
                </span>
              </div>
            </div>

            {/* Subsystem Telemetry */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-center">
                <div className="text-[10px] text-slate-500">Uptime</div>
                <div className="text-slate-200">{report.uptimeSeconds}s</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-center">
                <div className="text-[10px] text-slate-500">Memory RSS</div>
                <div className="text-slate-200">{report.subsystems.memory.rssMb}MB</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-center">
                <div className="text-[10px] text-slate-500">Job Queue</div>
                <div className="text-slate-200">
                  {report.subsystems.backgroundJobs.queued}Q / {report.subsystems.backgroundJobs.running}R
                </div>
              </div>
            </div>
          </div>

          {/* Checklist Container */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-indigo-400" />
                <span>15-Point Pre-Flight Verification Criteria</span>
              </h2>

              <div className="flex flex-wrap gap-1 rounded-lg border border-slate-700 bg-slate-950 p-0.5 text-xs">
                {["ALL", "CORE", "STORAGE", "AI", "SECURITY", "JOBS", "CURRICULUM"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-2.5 py-1 rounded text-[11px] ${
                      filter === cat ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Checklist items */}
            <div className="divide-y divide-slate-800/60">
              {filteredChecks?.map((chk: any) => (
                <div
                  key={chk.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 text-[10px]">{chk.id}</span>
                      <span className="font-medium text-slate-200">{chk.name}</span>
                      <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[9px] text-slate-400">
                        {chk.category}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">{chk.message}</div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {chk.latencyMs !== undefined && (
                      <span className="font-mono text-slate-500 text-[10px]">{chk.latencyMs}ms</span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${
                        chk.status === "PASS"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : chk.status === "WARNING"
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-rose-950 text-rose-300 border border-rose-800"
                      }`}
                    >
                      {chk.status === "PASS" ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      ) : chk.status === "WARNING" ? (
                        <AlertTriangle className="h-3 w-3 text-amber-400" />
                      ) : (
                        <XCircle className="h-3 w-3 text-rose-400" />
                      )}
                      <span>{chk.status}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
