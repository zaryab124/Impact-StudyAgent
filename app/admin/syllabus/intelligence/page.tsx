"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileCode2,
  BookOpen,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  GitCompare,
  Layers,
  Sparkles,
  ExternalLink,
  Sliders,
  Archive,
  Send,
  Eye,
  Percent,
} from "lucide-react";
import {
  SyllabusStatus,
  AlignmentStatus,
  EligibilityStatus,
  VerificationStatus,
  SyllabusComparisonResult,
} from "@/types/syllabus";

export default function SyllabusIntelligencePage() {
  const [syllabi, setSyllabi] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [selectedSyllabusId, setSelectedSyllabusId] = useState<string>("");
  const [activeSyllabus, setActiveSyllabus] = useState<any | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aligning, setAligning] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  // Alignment Trigger State
  const [targetBookId, setTargetBookId] = useState<string>("");

  // Review Modal State
  const [reviewItem, setReviewItem] = useState<{
    item: any;
    itemType: "CHAPTER" | "TOPIC";
  } | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Comparison State
  const [showComparison, setShowComparison] = useState(false);
  const [compareTargetId, setCompareTargetId] = useState<string>("");
  const [comparisonResult, setComparisonResult] = useState<SyllabusComparisonResult | null>(null);
  const [comparing, setComparing] = useState(false);

  // Matrix Filter
  const [eligibilityFilter, setEligibilityFilter] = useState<string>("ALL");

  // Load initial data
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [sylRes, booksRes] = await Promise.all([
        fetch("/api/syllabus").then((r) => r.json()),
        fetch("/api/books").then((r) => r.json()),
      ]);

      if (sylRes.data?.syllabi) {
        setSyllabi(sylRes.data.syllabi);
        if (sylRes.data.syllabi.length > 0 && !selectedSyllabusId) {
          setSelectedSyllabusId(sylRes.data.syllabi[0].id);
        }
      }

      if (booksRes.data?.books) {
        setBooks(booksRes.data.books);
        if (booksRes.data.books.length > 0 && !targetBookId) {
          setTargetBookId(booksRes.data.books[0].id);
        }
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: `Failed to load syllabi: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch syllabus details, chapters & topics when selected
  useEffect(() => {
    if (!selectedSyllabusId) {
      setActiveSyllabus(null);
      setChapters([]);
      setTopics([]);
      return;
    }

    const fetchDetails = async () => {
      try {
        const [detRes, chapRes, topRes] = await Promise.all([
          fetch(`/api/syllabus/${selectedSyllabusId}`).then((r) => r.json()),
          fetch(`/api/syllabus/${selectedSyllabusId}/chapters`).then((r) => r.json()),
          fetch(`/api/syllabus/${selectedSyllabusId}/topics`).then((r) => r.json()),
        ]);

        if (detRes.data) setActiveSyllabus(detRes.data);
        if (chapRes.data?.chapters) setChapters(chapRes.data.chapters);
        if (topRes.data?.topics) setTopics(topRes.data.topics);
      } catch (err: any) {
        console.error("Failed to fetch syllabus details:", err);
      }
    };

    fetchDetails();
  }, [selectedSyllabusId]);

  // Run curriculum alignment
  const handleTriggerAlign = async () => {
    if (!selectedSyllabusId || !targetBookId) {
      setFeedback({ type: "error", message: "Please select a syllabus and target book." });
      return;
    }

    setAligning(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/syllabus/${selectedSyllabusId}/align`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: targetBookId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Curriculum alignment failed");

      setFeedback({
        type: "success",
        message: `Alignment completed! Overall coverage: ${data.data.report.overallCoveragePct}%. Matched: ${data.data.report.matchedChapters} chapters, ${data.data.report.matchedTopics} topics.`,
      });

      // Refresh items
      const [chapRes, topRes] = await Promise.all([
        fetch(`/api/syllabus/${selectedSyllabusId}/chapters`).then((r) => r.json()),
        fetch(`/api/syllabus/${selectedSyllabusId}/topics`).then((r) => r.json()),
      ]);
      if (chapRes.data?.chapters) setChapters(chapRes.data.chapters);
      if (topRes.data?.topics) setTopics(topRes.data.topics);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setAligning(false);
    }
  };

  // Publish syllabus
  const handlePublish = async () => {
    if (!selectedSyllabusId) return;
    setPublishing(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/syllabus/${selectedSyllabusId}/publish`, {
        method: "POST",
        headers: { "x-user-role": "ADMIN" },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to publish syllabus");

      setFeedback({
        type: "success",
        message: `Syllabus version "${data.data.syllabus.version}" successfully published and verified!`,
      });

      setActiveSyllabus(data.data.syllabus);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setPublishing(false);
    }
  };

  // Archive syllabus
  const handleArchive = async () => {
    if (!selectedSyllabusId) return;
    setArchiving(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/syllabus/${selectedSyllabusId}/archive`, {
        method: "POST",
        headers: { "x-user-role": "ADMIN" },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to archive syllabus");

      setFeedback({
        type: "warning",
        message: `Syllabus version "${data.data.syllabus.version}" archived.`,
      });

      setActiveSyllabus(data.data.syllabus);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setArchiving(false);
    }
  };

  // Submit review decision
  const handleSubmitReview = async (decision: "CONFIRMED" | "REJECTED" | "MODIFIED") => {
    if (!reviewItem || !selectedSyllabusId) return;

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/syllabus/${selectedSyllabusId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": "ADMIN" },
        body: JSON.stringify({
          itemId: reviewItem.item.id,
          itemType: reviewItem.itemType,
          decision,
          notes: reviewNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to submit review");

      setFeedback({
        type: "success",
        message: `Alignment decision recorded as "${decision}". State updated.`,
      });

      setReviewItem(null);
      setReviewNotes("");

      // Refresh items
      const [chapRes, topRes] = await Promise.all([
        fetch(`/api/syllabus/${selectedSyllabusId}/chapters`).then((r) => r.json()),
        fetch(`/api/syllabus/${selectedSyllabusId}/topics`).then((r) => r.json()),
      ]);
      if (chapRes.data?.chapters) setChapters(chapRes.data.chapters);
      if (topRes.data?.topics) setTopics(topRes.data.topics);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSubmittingReview(false);
    }
  };

  // Compare syllabus versions
  const handleCompareVersions = async () => {
    if (!selectedSyllabusId || !compareTargetId) return;
    setComparing(true);
    try {
      const res = await fetch(
        `/api/syllabus/compare?versionA=${selectedSyllabusId}&versionB=${compareTargetId}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Comparison failed");
      setComparisonResult(data.data);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setComparing(false);
    }
  };

  const getStatusBadge = (status: SyllabusStatus) => {
    switch (status) {
      case "PUBLISHED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" /> Published</span>;
      case "VERIFIED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300"><ShieldCheck className="w-3.5 h-3.5" /> Verified</span>;
      case "UNDER_REVIEW":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300"><Clock className="w-3.5 h-3.5" /> Under Review</span>;
      case "ARCHIVED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 border border-slate-300"><Archive className="w-3.5 h-3.5" /> Archived</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300"><Clock className="w-3.5 h-3.5" /> Draft</span>;
    }
  };

  const getEligibilityBadge = (eligibility: EligibilityStatus) => {
    switch (eligibility) {
      case "ELIGIBLE":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">ELIGIBLE</span>;
      case "EXCLUDED":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">EXCLUDED</span>;
      case "REQUIRES_REVIEW":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">REQUIRES REVIEW</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">UNKNOWN</span>;
    }
  };

  const filteredChapters = chapters.filter((c) =>
    eligibilityFilter === "ALL" ? true : c.eligibility === eligibilityFilter
  );
  const filteredTopics = topics.filter((t) =>
    eligibilityFilter === "ALL" ? true : t.eligibility === eligibilityFilter
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Education Foundation
            </Link>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold shadow">
                <FileCode2 className="w-4 h-4" />
              </div>
              <h1 className="text-lg font-bold text-slate-800">Syllabus Intelligence & Curriculum Alignment</h1>
            </div>
          </div>
          <button
            onClick={loadInitialData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl flex items-start gap-3 border shadow-sm ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : feedback.type === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {feedback.type === "success" && <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            {feedback.type === "warning" && <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            {feedback.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <div className="text-sm font-medium">{feedback.message}</div>
          </div>
        )}

        {/* Section 1: Selector, Provenance, & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Syllabus Selector Card */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-slate-800">Select Syllabus Version</h2>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                {syllabi.length} Versions
              </span>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Syllabus Version
              </label>
              <select
                value={selectedSyllabusId}
                onChange={(e) => setSelectedSyllabusId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {syllabi.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.version}) • {s.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Curriculum Alignment Action Card */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Target Book for Alignment
              </label>
              <select
                value={targetBookId}
                onChange={(e) => setTargetBookId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.version})
                  </option>
                ))}
              </select>

              <button
                onClick={handleTriggerAlign}
                disabled={aligning || !selectedSyllabusId || !targetBookId}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow transition-colors flex items-center justify-center gap-2"
              >
                {aligning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Running Alignment...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Run Curriculum Alignment
                  </>
                )}
              </button>
            </div>

            {/* Lifecycle Publishing Controls */}
            {activeSyllabus && (
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                {activeSyllabus.status !== "PUBLISHED" && (
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="flex-1 py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {publishing ? "Publishing..." : "Publish & Verify"}
                  </button>
                )}

                {activeSyllabus.status !== "ARCHIVED" && (
                  <button
                    onClick={handleArchive}
                    disabled={archiving}
                    className="py-2 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Archive
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Source Provenance & Metadata Card */}
          {activeSyllabus && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-800">{activeSyllabus.title}</h2>
                      {getStatusBadge(activeSyllabus.status)}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Subject: <span className="font-semibold">{activeSyllabus.subjectName}</span> • Class: <span className="font-semibold">{activeSyllabus.className}</span> • Year: <span className="font-semibold">{activeSyllabus.academicYearName}</span> • Version: <span className="font-semibold">{activeSyllabus.version}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => setShowComparison(!showComparison)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    Compare Versions
                  </button>
                </div>

                {/* Provenance Box */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>Official Syllabus Source Provenance</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-500">Source Type:</span>{" "}
                      <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-slate-200 text-slate-700 font-bold">
                        {activeSyllabus.provenance?.sourceType || "ADMIN_ENTRY"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Verification:</span>{" "}
                      <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-emerald-100 text-emerald-800 font-bold">
                        {activeSyllabus.provenance?.verificationStatus || "UNVERIFIED"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Reference:</span>{" "}
                      <span>{activeSyllabus.provenance?.sourceReference || "Official Curriculum Document"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Page:</span>{" "}
                      <span>{activeSyllabus.provenance?.sourcePage ? `Page ${activeSyllabus.provenance.sourcePage}` : "Document Scope"}</span>
                    </div>
                  </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <div className="text-lg font-black text-slate-800">{chapters.length}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Chapters</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <div className="text-lg font-black text-slate-800">{topics.length}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Topics</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <div className="text-lg font-black text-emerald-600">
                      {chapters.filter((c) => c.eligibility === "ELIGIBLE").length +
                        topics.filter((t) => t.eligibility === "ELIGIBLE").length}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">Eligible Items</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <div className="text-lg font-black text-amber-600">
                      {chapters.filter((c) => c.alignmentStatus === "REQUIRES_REVIEW").length +
                        topics.filter((t) => t.alignmentStatus === "REQUIRES_REVIEW").length}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">Review Required</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Created: {new Date(activeSyllabus.createdAt).toLocaleDateString()}</span>
                <span>Production Examination Gate: {activeSyllabus.status === "PUBLISHED" ? "AUTHORIZED" : "LOCKED"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Year-to-Year Comparison Tool (Expandable) */}
        {showComparison && (
          <div className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800">Year-to-Year Syllabus Comparison Tool</h3>
              </div>
              <button
                onClick={() => setShowComparison(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="text-xs font-semibold text-slate-600">Compare Current With:</div>
              <select
                value={compareTargetId}
                onChange={(e) => setCompareTargetId(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
              >
                <option value="">-- Select Target Version --</option>
                {syllabi
                  .filter((s) => s.id !== selectedSyllabusId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.version}) • {s.academicYearName}
                    </option>
                  ))}
              </select>
              <button
                onClick={handleCompareVersions}
                disabled={comparing || !compareTargetId}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {comparing ? "Comparing..." : "Execute Diff Analysis"}
              </button>
            </div>

            {comparisonResult && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="font-bold text-slate-800 text-sm">
                  Differences: {comparisonResult.versionA.version} vs {comparisonResult.versionB.version}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-bold text-emerald-700">Added Chapters ({comparisonResult.addedChapters.length}):</span>
                    {comparisonResult.addedChapters.length === 0 ? (
                      <p className="text-slate-400 italic">None</p>
                    ) : (
                      <ul className="list-disc list-inside mt-1 text-slate-700">
                        {comparisonResult.addedChapters.map((c, i) => (
                          <li key={i}>Chapter {c.chapterNumber}: {c.title}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-rose-700">Removed Chapters ({comparisonResult.removedChapters.length}):</span>
                    {comparisonResult.removedChapters.length === 0 ? (
                      <p className="text-slate-400 italic">None</p>
                    ) : (
                      <ul className="list-disc list-inside mt-1 text-slate-700">
                        {comparisonResult.removedChapters.map((c, i) => (
                          <li key={i}>Chapter {c.chapterNumber}: {c.title}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {comparisonResult.changedWeightage.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="font-bold text-purple-700">Changed Weightages:</span>
                    <ul className="list-disc list-inside mt-1 text-slate-700">
                      {comparisonResult.changedWeightage.map((w, i) => (
                        <li key={i}>
                          {w.codeOrNumber} ({w.title}): {w.oldWeight ?? 0}% &rarr; <span className="font-bold">{w.newWeight ?? 0}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Section 3: Curriculum Alignment & Eligibility Matrix */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-800">Curriculum Alignment & Eligibility Matrix</h3>
            </div>

            {/* Eligibility Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {["ALL", "ELIGIBLE", "EXCLUDED", "REQUIRES_REVIEW", "UNKNOWN"].map((f) => (
                <button
                  key={f}
                  onClick={() => setEligibilityFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    eligibilityFilter === f
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Chapters Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Syllabus Chapters ({filteredChapters.length})
            </h4>

            {filteredChapters.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-3 border rounded-xl">No chapters matching filter.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {filteredChapters.map((ch) => (
                  <div key={ch.id} className="p-3.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {ch.chapterNumber}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                          Chapter {ch.chapterNumber}: {ch.chapterTitle}
                          {getEligibilityBadge(ch.eligibility)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Status: <span className="font-semibold">{ch.alignmentStatus}</span> • Confidence: {(ch.confidence * 100).toFixed(0)}% • Weightage: <span className="font-semibold text-purple-700">{ch.weightage ?? 0}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {ch.alignmentStatus === "REQUIRES_REVIEW" && (
                        <button
                          onClick={() => setReviewItem({ item: ch, itemType: "CHAPTER" })}
                          className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg border border-amber-300 transition-colors"
                        >
                          Review Match
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Topics Table */}
          <div className="space-y-2 pt-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Syllabus Topics ({filteredTopics.length})
            </h4>

            {filteredTopics.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-3 border rounded-xl">No topics matching filter.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                {filteredTopics.map((tp) => (
                  <div key={tp.id} className="p-3.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-bold flex-shrink-0">
                        {tp.topicCode || "Topic"}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                          {tp.topicTitle}
                          {getEligibilityBadge(tp.eligibility)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Status: <span className="font-semibold">{tp.alignmentStatus}</span> • Confidence: {(tp.confidence * 100).toFixed(0)}% • Mappings: {tp.mappings?.length || 0} candidate sections
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {tp.alignmentStatus === "REQUIRES_REVIEW" && (
                        <button
                          onClick={() => setReviewItem({ item: tp, itemType: "TOPIC" })}
                          className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg border border-amber-300 transition-colors"
                        >
                          Review Match
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Review Modal Dialog */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">
                Manual Alignment Review: {reviewItem.itemType}
              </h3>
              <button
                onClick={() => setReviewItem(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                &times;
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                <span className="font-bold">Item:</span>{" "}
                {reviewItem.itemType === "CHAPTER"
                  ? `Chapter ${reviewItem.item.chapterNumber}: ${reviewItem.item.chapterTitle}`
                  : `${reviewItem.item.topicCode || ""} ${reviewItem.item.topicTitle}`}
              </p>
              <p>
                <span className="font-bold">Confidence:</span> {(reviewItem.item.confidence * 100).toFixed(0)}% (Low Confidence Threshold Triggered)
              </p>
              <p className="text-slate-500">
                Confirm whether this syllabus content aligns with the proposed textbook section, or reject it to exclude it from future examination questions.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reviewer Notes</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter justification for confirmation or rejection..."
                rows={3}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setReviewItem(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmitReview("REJECTED")}
                disabled={submittingReview}
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Reject Alignment
              </button>
              <button
                onClick={() => handleSubmitReview("CONFIRMED")}
                disabled={submittingReview}
                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                Confirm Alignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
