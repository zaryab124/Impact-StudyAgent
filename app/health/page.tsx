"use client";

import React, { useState, useEffect } from "react";
import { Activity, Database, Server, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

interface HealthSubsystem {
  status: string;
  latencyMs?: number;
  message: string;
}

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptimeSeconds: number;
  version: string;
  environment: string;
  subsystems: {
    application: HealthSubsystem;
    database: HealthSubsystem;
  };
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<string>("");

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health");
      const json = await res.json();
      if (json.data) {
        setHealth(json.data);
      } else {
        // Fallback if data format differs
        setHealth(json);
      }
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white sm:text-3xl">System Health &amp; Diagnostics</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time verification of application runtime, database connection, and subsystem availability.
          </p>
        </div>

        <button
          onClick={checkHealth}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Checking..." : "Re-check Health"}</span>
        </button>
      </div>

      {/* Global Status Banner */}
      <div className="mt-8">
        {loading && !health ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-indigo-400 mb-3" />
            <p>Probing platform subsystems...</p>
          </div>
        ) : health ? (
          <div
            className={`rounded-xl border p-6 ${
              health.status === "healthy"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {health.status === "healthy" ? (
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-7 w-7 text-amber-400" />
                )}
                <div>
                  <h2 className="text-lg font-bold text-white capitalize">
                    System State: {health.status}
                  </h2>
                  <p className="text-xs opacity-80 mt-0.5">
                    {health.status === "healthy"
                      ? "All core components and database connections are operational."
                      : "Application is operational; database check returned degraded or disconnected status."}
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs opacity-75">
                Last checked: {lastChecked}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-rose-400" />
              <div>
                <h3 className="text-base font-bold text-white">Health Probe Unreachable</h3>
                <p className="text-xs opacity-80 mt-0.5">Could not connect to /api/health.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subsystem Cards */}
      {health && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {/* Application Server Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <Server className="h-5 w-5" />
                <h3 className="font-semibold text-white">Application Server</h3>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                {health.subsystems.application.status}
              </span>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Environment</span>
                <span className="font-mono text-white capitalize">{health.environment}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">System Uptime</span>
                <span className="font-mono text-white">{health.uptimeSeconds} seconds</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Platform Version</span>
                <span className="font-mono text-white">{health.version}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Runtime Note</span>
                <span className="text-xs text-slate-400">{health.subsystems.application.message}</span>
              </div>
            </div>
          </div>

          {/* Database Connection Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <Database className="h-5 w-5" />
                <h3 className="font-semibold text-white">PostgreSQL &amp; pgvector</h3>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                  health.subsystems.database.status === "UP"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}
              >
                {health.subsystems.database.status}
              </span>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Connection Status</span>
                <span className="font-mono text-white">
                  {health.subsystems.database.status === "UP" ? "Connected" : "Disconnected / Offline"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Query Latency</span>
                <span className="font-mono text-white">
                  {health.subsystems.database.latencyMs !== undefined
                    ? `${health.subsystems.database.latencyMs} ms`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">ORM Adapter</span>
                <span className="font-mono text-white">Prisma Client</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Driver Message</span>
                <span className="text-xs text-slate-400 truncate max-w-[200px]" title={health.subsystems.database.message}>
                  {health.subsystems.database.message}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Architecture Confirmation */}
      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Server-Side Secret Isolation: API Keys strictly forbidden in browser bundles.</span>
        </div>
        <span className="font-mono text-[11px] text-indigo-400">ISO-8601: {health?.timestamp}</span>
      </div>
    </div>
  );
}
