"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Play,
  Download,
  Rocket,
  ArrowLeft,
  Activity,
  Server,
  Database,
  Cpu,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { ValidationRun, ValidationDomain, VerificationTier, ValidationStatus } from "@/types/validation";

export default function ValidationControlCenterPage() {
  const [loading, setLoading] = useState(false);
  const [latestRun, setLatestRun] = useState<ValidationRun | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<ValidationDomain | "ALL">("ALL");
  const [tierFilter, setTierFilter] = useState<VerificationTier | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<ValidationStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/validation/runs?limit=1");
      const data = await res.json();
      if (data.success && data.runs && data.runs.length > 0) {
        setLatestRun(data.runs[0]);
      } else {
        // Trigger auto-evaluation if no run exists
        await triggerValidationRun();
      }
    } catch (err) {
      console.error("Failed to load validation run", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerValidationRun = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/validation/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initiatedBy: "Admin Web Console" }),
      });
      const data = await res.json();
      if (data.success && data.run) {
        setLatestRun(data.run);
      }
    } catch (err) {
      console.error("Failed to trigger validation run", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusBadge = (status: ValidationStatus) => {
    switch (status) {
      case "PASSED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            PASSED
          </span>
        );
      case "PASSED_WITH_WARNINGS":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            WARNINGS
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            FAILED
          </span>
        );
      case "UNVERIFIED":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            UNVERIFIED
          </span>
        );
    }
  };

  const getTierBadge = (tier: VerificationTier) => {
    switch (tier) {
      case "PRODUCTION_VERIFIED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
            PRODUCTION_VERIFIED
          </span>
        );
      case "EXTERNALLY_VERIFIED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
            EXTERNALLY_VERIFIED
          </span>
        );
      case "TESTED_LOCALLY":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            TESTED_LOCALLY
          </span>
        );
      case "IMPLEMENTED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
            IMPLEMENTED
          </span>
        );
      case "UNVERIFIED":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-slate-500/20 text-slate-300 border border-slate-500/30">
            UNVERIFIED
          </span>
        );
    }
  };

  const checks = latestRun?.checks || [];
  const filteredChecks = checks.filter((c) => {
    if (selectedDomain !== "ALL" && c.domain !== selectedDomain) return false;
    if (tierFilter !== "ALL" && c.tier !== tierFilter) return false;
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        c.checkName.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q) ||
        c.domain.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const domainsList = latestRun ? Object.values(latestRun.domains) : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      {/* Top Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 -ml-1 rounded"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-indigo-400" />
              Real-World Validation & Production Pilot Control Center
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 ml-9">
            Phase 11 Comprehensive 20-Domain Launch Verification • Release Candidate:{" "}
            <span className="text-indigo-400 font-semibold font-mono">
              {latestRun?.releaseCandidate || "STUDY_AGENT_RC_1"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/validation/launch"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-950/40 transition-all"
          >
            <Rocket className="w-4 h-4" />
            Launch Readiness Gate
          </Link>
          <a
            href="/api/admin/validation/export?format=markdown"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Audit Report
          </a>
          <button
            onClick={triggerValidationRun}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium shadow transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Validating..." : "Run All Checks"}
          </button>
        </div>
      </div>

      {/* Top Metric Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Overall Run Status</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-center gap-3">
            {latestRun ? getStatusBadge(latestRun.overallStatus) : <span className="text-sm">Loading...</span>}
            <span className="text-xs text-slate-400 font-mono">
              {latestRun?.checks.length || 0} Total Checks
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Verification Tier</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center gap-3">
            {latestRun ? getTierBadge(latestRun.overallTier) : <span className="text-sm">Loading...</span>}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Runtime Environment</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-slate-200 capitalize">
            {latestRun?.environment || "Development"}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Node.js Runtime • In-memory + Dual Tier DB
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Validated Domains</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-slate-200">
            {domainsList.filter((d) => d.status === "PASSED").length} / {domainsList.length} Passed
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {domainsList.filter((d) => d.status === "PASSED_WITH_WARNINGS" || d.status === "UNVERIFIED").length} with warnings/unverified
          </div>
        </div>
      </div>

      {/* 20-Domain Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>20 Core Validation Domains</span>
          <span className="text-xs font-normal text-slate-400 font-mono">
            (Strict Separation of Implemented vs Verified)
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {domainsList.map((dom) => (
            <div
              key={dom.domain}
              onClick={() => setSelectedDomain(selectedDomain === dom.domain ? "ALL" : dom.domain)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedDomain === dom.domain
                  ? "bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/50"
                  : "bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-300 font-mono tracking-tight truncate">
                  {dom.displayName}
                </span>
                {getStatusBadge(dom.status)}
              </div>
              <div className="flex items-center justify-between mt-3 text-xs">
                {getTierBadge(dom.tier)}
                <span className="text-slate-400 font-mono">
                  {dom.passedCount}/{dom.totalChecks} checks
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search check name or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Domain:</span>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="ALL">All Domains ({checks.length})</option>
                {domainsList.map((d) => (
                  <option key={d.domain} value={d.domain}>
                    {d.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="ALL">All Statuses</option>
                <option value="PASSED">Passed</option>
                <option value="PASSED_WITH_WARNINGS">Warnings</option>
                <option value="FAILED">Failed</option>
                <option value="UNVERIFIED">Unverified</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Tier:</span>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="ALL">All Tiers</option>
                <option value="PRODUCTION_VERIFIED">Production Verified</option>
                <option value="EXTERNALLY_VERIFIED">Externally Verified</option>
                <option value="TESTED_LOCALLY">Tested Locally</option>
                <option value="IMPLEMENTED">Implemented</option>
                <option value="UNVERIFIED">Unverified</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Checks Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Detailed Validation Checks ({filteredChecks.length})
          </h3>
          {selectedDomain !== "ALL" && (
            <button
              onClick={() => setSelectedDomain("ALL")}
              className="text-xs text-indigo-400 hover:underline"
            >
              Clear Domain Filter ({selectedDomain})
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950/70 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Tier</th>
                <th className="px-6 py-3.5">Domain</th>
                <th className="px-6 py-3.5">Check Name</th>
                <th className="px-6 py-3.5">Findings & Verification Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-xs">
              {filteredChecks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-sans">
                    No validation checks match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredChecks.map((chk) => (
                  <tr key={chk.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap">{getStatusBadge(chk.status)}</td>
                    <td className="px-6 py-3.5 whitespace-nowrap">{getTierBadge(chk.tier)}</td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-indigo-300 font-semibold">
                      {chk.domain}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-200 whitespace-nowrap">
                      {chk.checkName}
                    </td>
                    <td className="px-6 py-3.5 text-slate-300 font-sans text-xs leading-relaxed">
                      {chk.message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
