"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Cpu,
  Activity,
  DollarSign,
  Layers,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  BarChart3,
  Clock,
  Sparkles,
} from "lucide-react";

export default function AIUsageDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUsageData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/ai/usage");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load AI usage telemetry");
      }
      setData(json.data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
  }, []);

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
            <span className="text-xs text-slate-400">AI Intelligence & Telemetry</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="h-6 w-6 text-indigo-400" />
            <span>AI Orchestration & Usage Telemetry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Multi-LLM health status, token consumption, cost accounting, and cross-model consensus metrics.
          </p>
        </div>

        <button
          onClick={fetchUsageData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-lg border border-rose-800 bg-rose-950/60 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading && !data ? (
        <div className="py-20 text-center text-xs text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
          Loading AI telemetry...
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Total Model Invocations</span>
                <Activity className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white">{data.summary.totalCalls}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {data.summary.successfulCalls} successful, {data.summary.failedCalls} failed
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Total Token Consumption</span>
                <Layers className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-cyan-300">
                {data.summary.totalTokens.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Across prompt &amp; completion outputs</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Estimated Cost (USD)</span>
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-300">
                ${data.summary.totalCostUsd.toFixed(4)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Calculated via official token rate schedules</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Average Response Latency</span>
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-300">{data.summary.averageLatencyMs} ms</div>
              <div className="text-[11px] text-slate-500 mt-1">Moving average across all active providers</div>
            </div>
          </div>

          {/* Provider Health Grid */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Multi-LLM Provider Registry &amp; Health Status</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.providerHealth.map((p: any) => (
                <div key={p.providerId} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-white capitalize">{p.providerId}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        p.status === "HEALTHY"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : p.status === "DEGRADED"
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : p.status === "UNVERIFIED"
                          ? "bg-indigo-950 text-indigo-300 border border-indigo-800"
                          : "bg-rose-950 text-rose-300 border border-rose-800"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Latency:</span>
                      <span className="font-mono text-slate-300">{p.averageLatencyMs} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Requests:</span>
                      <span className="font-mono text-slate-300">{p.totalRequests}</span>
                    </div>
                  </div>

                  {p.errorMessage && (
                    <div className="mt-2 text-[10px] text-slate-500 truncate" title={p.errorMessage}>
                      {p.errorMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Model Logs */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              <span>Recent Model Telemetry Invocations</span>
            </h2>

            {data.recentLogs.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">
                No recent model invocations recorded in this session.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-slate-800 text-[11px] text-slate-500">
                    <tr>
                      <th className="pb-2">Timestamp</th>
                      <th className="pb-2">Provider</th>
                      <th className="pb-2">Model</th>
                      <th className="pb-2">Category</th>
                      <th className="pb-2">Tokens</th>
                      <th className="pb-2">Latency</th>
                      <th className="pb-2">Cost</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {data.recentLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-900/40">
                        <td className="py-2.5 text-slate-400 text-[11px]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5 capitalize">{log.providerId}</td>
                        <td className="py-2.5 text-slate-400">{log.modelName}</td>
                        <td className="py-2.5 text-indigo-300">{log.category}</td>
                        <td className="py-2.5">{log.totalTokens}</td>
                        <td className="py-2.5">{log.latencyMs}ms</td>
                        <td className="py-2.5 text-emerald-400">${log.costUsd.toFixed(4)}</td>
                        <td className="py-2.5">
                          {log.success ? (
                            <span className="text-emerald-400">SUCCESS</span>
                          ) : (
                            <span className="text-rose-400">FAILED</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
