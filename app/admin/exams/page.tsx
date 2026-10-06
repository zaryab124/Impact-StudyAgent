"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  FileText,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Archive,
  Eye,
  ShieldAlert,
  Edit3,
  Clock,
  ExternalLink,
  Search,
  Filter,
  Users,
  Compass,
  Sparkles,
} from "lucide-react";

export default function AdminExamsPage() {
  const [activeTab, setActiveTab] = useState<"papers" | "attempts" | "audit">("papers");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Data states
  const [papers, setPapers] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [blueprints, setBlueprints] = useState<any[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Paper Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState("");
  const [customPaperCode, setCustomPaperCode] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [creatingPaper, setCreatingPaper] = useState(false);

  // Score Override Modal
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [newScore, setNewScore] = useState<number>(0);
  const [overrideReason, setOverrideReason] = useState("");
  const [overriding, setOverriding] = useState(false);

  // Analytics Drawer
  const [selectedAnalyticsPaper, setSelectedAnalyticsPaper] = useState<any>(null);
  const [paperAnalytics, setPaperAnalytics] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [papersRes, attemptsRes, logsRes, bpRes] = await Promise.all([
        fetch("/api/exams/papers").then((r) => r.json()),
        fetch("/api/admin/exams/attempts").then((r) => r.json()),
        fetch("/api/admin/exams/audit-logs").then((r) => r.json()),
        fetch("/api/blueprints").then((r) => r.json()),
      ]);

      if (papersRes.data?.papers) setPapers(papersRes.data.papers);
      if (attemptsRes.data?.attempts) setAttempts(attemptsRes.data.attempts);
      if (logsRes.data?.logs) setAuditLogs(logsRes.data.logs);
      if (bpRes.data?.blueprints) {
        // Only APPROVED blueprints can be used to assemble live papers
        setBlueprints(bpRes.data.blueprints.filter((b: any) => b.status === "APPROVED"));
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to load examination data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Paper Lifecycle Actions
  const handlePaperAction = async (paperId: string, action: "validate" | "publish" | "activate" | "close" | "archive") => {
    try {
      const res = await fetch(`/api/exams/papers/${paperId}/${action}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || `Failed to ${action} paper.`);
      }
      setFeedback({ type: "success", message: `Paper successfully updated (${action.toUpperCase()}).` });
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  // Create Live Paper
  const handleCreatePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlueprintId) {
      setFeedback({ type: "error", message: "Please select an approved blueprint." });
      return;
    }

    try {
      setCreatingPaper(true);
      const res = await fetch("/api/exams/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blueprintId: selectedBlueprintId,
          paperCode: customPaperCode || undefined,
          title: customTitle || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to assemble live examination paper.");
      }

      setFeedback({
        type: "success",
        message: `Examination paper "${data.data.paperCode}" assembled and validated successfully!`,
      });
      setShowCreateModal(false);
      setSelectedBlueprintId("");
      setCustomPaperCode("");
      setCustomTitle("");
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setCreatingPaper(false);
    }
  };

  // Open Score Override Modal
  const openOverrideDialog = async (attempt: any) => {
    setSelectedAttempt(attempt);
    // Fetch attempt details
    try {
      const res = await fetch(`/api/exams/${attempt.id}`);
      const data = await res.json();
      if (data.data?.paper?.questions?.length > 0) {
        setSelectedQuestionId(data.data.paper.questions[0].id);
      }
    } catch {}
    setNewScore(0);
    setOverrideReason("");
    setShowOverrideModal(true);
  };

  // Submit Score Override
  const handleSubmitOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttempt || !selectedQuestionId) return;

    try {
      setOverriding(true);
      const res = await fetch(`/api/exams/${selectedAttempt.id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperQuestionId: selectedQuestionId,
          newMarks: Number(newScore),
          reason: overrideReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to override score.");
      }

      setFeedback({
        type: "success",
        message: `Score overridden successfully. New attempt total: ${data.data.result.obtainedMarks}/${data.data.result.totalMarks} (${data.data.result.percentage}%).`,
      });
      setShowOverrideModal(false);
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setOverriding(false);
    }
  };

  // Open Paper Analytics
  const openAnalytics = async (paper: any) => {
    setSelectedAnalyticsPaper(paper);
    try {
      const res = await fetch(`/api/admin/exams/${paper.id}/analytics`);
      const data = await res.json();
      if (res.ok) {
        setPaperAnalytics(data.data);
      }
    } catch {}
  };

  // Filtered papers
  const filteredPapers = papers.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.paperCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      {/* Top Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
              Phase 9 Engine
            </span>
            <span className="text-xs text-slate-500">Live Examination Operations</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-white tracking-tight">Live Examination Studio</h1>
          <p className="text-xs text-slate-400">
            Assemble versioned examination papers from approved blueprints, monitor live student attempts & review results.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blueprints"
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Blueprints</span>
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Assemble Live Paper</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs font-semibold text-slate-400">Total Live Papers</span>
          <p className="mt-2 text-2xl font-bold text-white">{papers.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs font-semibold text-emerald-400">Active Exams</span>
          <p className="mt-2 text-2xl font-bold text-white">
            {papers.filter((p) => p.status === "ACTIVE").length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs font-semibold text-indigo-400">Student Attempts</span>
          <p className="mt-2 text-2xl font-bold text-white">{attempts.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs font-semibold text-amber-400">Evaluated Results</span>
          <p className="mt-2 text-2xl font-bold text-white">
            {attempts.filter((a) => a.status === "EVALUATED").length}
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`mb-6 flex items-center justify-between rounded-xl p-4 text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
              : "bg-rose-950/80 text-rose-300 border border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-slate-800 pb-3">
        {[
          { id: "papers", label: "Examination Papers", icon: FileText, count: papers.length },
          { id: "attempts", label: "Student Attempts & Grading", icon: Users, count: attempts.length },
          { id: "audit", label: "Audit Trail", icon: ShieldAlert, count: auditLogs.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              <span className="rounded-full bg-slate-950/60 px-2 py-0.5 text-[10px] text-slate-300">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Examination Papers */}
      {activeTab === "papers" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 w-full md:w-80">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search papers by code or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 text-xs rounded-lg border border-slate-800 px-3 py-1.5 text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="VALIDATED">VALIDATED</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="CLOSED">CLOSED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          {/* Papers Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="p-4 font-semibold">Paper Code</th>
                  <th className="p-4 font-semibold">Title</th>
                  <th className="p-4 font-semibold">Marks</th>
                  <th className="p-4 font-semibold">Duration</th>
                  <th className="p-4 font-semibold">Questions</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPapers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No examination papers found. Click &quot;Assemble Live Paper&quot; to create one from an approved blueprint.
                    </td>
                  </tr>
                ) : (
                  filteredPapers.map((paper) => {
                    const statusColors: Record<string, string> = {
                      DRAFT: "bg-slate-800 text-slate-300 border-slate-700",
                      VALIDATED: "bg-teal-500/20 text-teal-300 border-teal-500/30",
                      PUBLISHED: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
                      ACTIVE: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                      CLOSED: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                      ARCHIVED: "bg-rose-500/20 text-rose-300 border-rose-500/30",
                    };

                    return (
                      <tr key={paper.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-indigo-400">{paper.paperCode}</td>
                        <td className="p-4 font-medium text-slate-200">
                          <div>{paper.title}</div>
                          <span className="text-[10px] text-slate-500">ID: {paper.id}</span>
                        </td>
                        <td className="p-4 text-slate-300">{paper.totalMarks} m</td>
                        <td className="p-4 text-slate-300">{paper.durationMinutes} mins</td>
                        <td className="p-4 text-slate-300">{paper.questionCount}</td>
                        <td className="p-4">
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold border ${statusColors[paper.status]}`}>
                            {paper.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Validate */}
                            {paper.status === "DRAFT" && (
                              <button
                                onClick={() => handlePaperAction(paper.id, "validate")}
                                className="rounded bg-teal-600/20 px-2 py-1 text-[11px] font-medium text-teal-300 hover:bg-teal-600/30"
                              >
                                Validate
                              </button>
                            )}

                            {/* Publish */}
                            {paper.status === "VALIDATED" && (
                              <button
                                onClick={() => handlePaperAction(paper.id, "publish")}
                                className="rounded bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500"
                              >
                                Publish
                              </button>
                            )}

                            {/* Activate */}
                            {(paper.status === "PUBLISHED" || paper.status === "CLOSED") && (
                              <button
                                onClick={() => handlePaperAction(paper.id, "activate")}
                                className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 flex items-center gap-1"
                              >
                                <Play className="h-3 w-3" />
                                <span>Activate</span>
                              </button>
                            )}

                            {/* Close */}
                            {paper.status === "ACTIVE" && (
                              <button
                                onClick={() => handlePaperAction(paper.id, "close")}
                                className="rounded bg-amber-600/20 px-2 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-600/30 flex items-center gap-1"
                              >
                                <Pause className="h-3 w-3" />
                                <span>Close</span>
                              </button>
                            )}

                            {/* Analytics */}
                            <button
                              onClick={() => openAnalytics(paper)}
                              className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700"
                              title="View Paper Analytics"
                            >
                              Analytics
                            </button>

                            {/* Student Player Link */}
                            <Link
                              href={`/student/exam/${paper.id}`}
                              target="_blank"
                              className="rounded border border-indigo-500/40 bg-indigo-500/10 px-2 py-1 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-500/20 flex items-center gap-1"
                              title="Launch Student Online Examination Player"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Player</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Student Attempts & Grading */}
      {activeTab === "attempts" && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
              <tr>
                <th className="p-4 font-semibold">Attempt ID</th>
                <th className="p-4 font-semibold">Candidate</th>
                <th className="p-4 font-semibold">Paper</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Score</th>
                <th className="p-4 font-semibold">Grade</th>
                <th className="p-4 font-semibold">Time Spent</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No student attempts recorded yet. Launch the student player to take an exam.
                  </td>
                </tr>
              ) : (
                attempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="p-4 font-mono font-medium text-slate-300">{att.id}</td>
                    <td className="p-4 font-medium text-white">{att.studentName || att.studentId}</td>
                    <td className="p-4 text-indigo-300">{att.paperCode || att.paperId}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                          att.status === "EVALUATED"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : att.status === "IN_PROGRESS"
                            ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-white">
                      {att.status === "EVALUATED" ? `${att.obtainedMarks} / ${att.totalMarks} (${att.percentage}%)` : "--"}
                    </td>
                    <td className="p-4 font-bold text-indigo-300">
                      {att.status === "EVALUATED" ? att.grade : "--"}
                    </td>
                    <td className="p-4 text-slate-400">{att.timeSpentSeconds ? `${Math.round(att.timeSpentSeconds / 60)} mins` : "--"}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {att.status === "EVALUATED" && (
                          <>
                            <Link
                              href={`/student/results/${att.id}`}
                              target="_blank"
                              className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-700 flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Scorecard</span>
                            </Link>
                            <button
                              onClick={() => openOverrideDialog(att)}
                              className="rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 flex items-center gap-1"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>Override</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Audit Trail */}
      {activeTab === "audit" && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
              <tr>
                <th className="p-4 font-semibold">Timestamp</th>
                <th className="p-4 font-semibold">Action</th>
                <th className="p-4 font-semibold">Actor</th>
                <th className="p-4 font-semibold">Entity</th>
                <th className="p-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                    No examination audit logs found.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/50">
                    <td className="p-4 text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="p-4 font-bold text-indigo-400">{log.action}</td>
                    <td className="p-4 text-slate-300">{log.actorId} ({log.actorRole})</td>
                    <td className="p-4 text-slate-400">{log.entityType}: {log.entityId}</td>
                    <td className="p-4 text-slate-300 font-sans max-w-md truncate">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Assemble Live Paper Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Assemble Live Examination Paper</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreatePaper} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Source Examination Blueprint (Must be APPROVED):
                </label>
                {blueprints.length === 0 ? (
                  <p className="rounded-lg border border-amber-900/60 bg-amber-950/30 p-3 text-amber-300">
                    No approved blueprints found. Please approve a blueprint in the Blueprint Studio first.
                  </p>
                ) : (
                  <select
                    value={selectedBlueprintId}
                    onChange={(e) => setSelectedBlueprintId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Select an approved blueprint --</option>
                    {blueprints.map((bp) => (
                      <option key={bp.id} value={bp.id}>
                        {bp.title} ({bp.totalMarks} marks, {bp.slots?.length || 0} questions)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Paper Code (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. PAP-PHY-2025-001"
                  value={customPaperCode}
                  onChange={(e) => setCustomPaperCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100 focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Custom Title (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Midterm Examination - Physics Grade 9"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPaper || !selectedBlueprintId}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 font-bold text-white hover:bg-indigo-500 disabled:opacity-40"
                >
                  {creatingPaper ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Assembling & Validating...</span>
                    </>
                  ) : (
                    <span>Assemble Paper</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Score Override Modal */}
      {showOverrideModal && selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-xs">
            <h3 className="text-base font-bold text-white">Manual Score Override</h3>
            <p className="mt-1 text-slate-400">
              Override score for candidate: <strong>{selectedAttempt.studentName}</strong> (Attempt: {selectedAttempt.id})
            </p>

            <form onSubmit={handleSubmitOverride} className="mt-4 space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Paper Question ID:</label>
                <input
                  type="text"
                  value={selectedQuestionId}
                  onChange={(e) => setSelectedQuestionId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">New Marks Awarded:</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={newScore}
                  onChange={(e) => setNewScore(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mandatory Override Justification:</label>
                <textarea
                  rows={3}
                  placeholder="State the academic justification for changing the automated score..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overriding || !overrideReason.trim()}
                  className="flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 font-bold text-white hover:bg-amber-500 disabled:opacity-40"
                >
                  {overriding ? "Saving Override..." : "Save Override"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Analytics Drawer */}
      {selectedAnalyticsPaper && paperAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs">
          <div className="h-full w-full max-w-md border-l border-slate-800 bg-slate-900 p-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Paper Performance Analytics</h3>
              <button onClick={() => setSelectedAnalyticsPaper(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Paper</span>
                <p className="mt-1 font-bold text-white text-sm">{paperAnalytics.paperTitle}</p>
                <p className="font-mono text-indigo-400">{paperAnalytics.paperCode}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <span className="text-slate-400">Total Attempts</span>
                  <p className="mt-1 text-xl font-bold text-white">{paperAnalytics.totalAttempts}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <span className="text-slate-400">Evaluated</span>
                  <p className="mt-1 text-xl font-bold text-emerald-400">{paperAnalytics.evaluatedCount}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <span className="text-slate-400">Average Score</span>
                  <p className="mt-1 text-xl font-bold text-indigo-300">
                    {paperAnalytics.averageScore} / {paperAnalytics.totalMarks}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <span className="text-slate-400">Pass Rate</span>
                  <p className="mt-1 text-xl font-bold text-emerald-400">{paperAnalytics.passRate}%</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <span className="text-slate-400">Highest Score</span>
                  <p className="mt-1 text-xl font-bold text-white">{paperAnalytics.highestScore}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <span className="text-slate-400">Lowest Score</span>
                  <p className="mt-1 text-xl font-bold text-white">{paperAnalytics.lowestScore}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
