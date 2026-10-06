"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Calculator,
  Brain,
  Layers,
  Sparkles,
  GitCompare,
  Eye,
  Sliders,
  Award,
  BookOpen,
  FileCode2,
  Scale,
  ShieldAlert,
} from "lucide-react";
import {
  SamplePaperDTO,
  SamplePaperQuestionDTO,
  PaperPatternSpecificationDTO,
  PaperComparisonDTO,
  SampleQuestionType,
  SampleDifficultyLevel,
} from "@/types/sample-paper";

export default function SamplePaperIntelligencePage() {
  const [samplePapers, setSamplePapers] = useState<SamplePaperDTO[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<string>("");
  const [activePaper, setActivePaper] = useState<SamplePaperDTO | null>(null);
  const [questions, setQuestions] = useState<SamplePaperQuestionDTO[]>([]);
  const [patterns, setPatterns] = useState<PaperPatternSpecificationDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [learningPattern, setLearningPattern] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSubjectId, setUploadSubjectId] = useState("");
  const [uploadYear, setUploadYear] = useState(2025);
  const [uploadTotalMarks, setUploadTotalMarks] = useState(60);
  const [uploadDuration, setUploadDuration] = useState(180);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [autoProcess, setAutoProcess] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Multi-Paper Aggregation Selection
  const [selectedPaperIdsForPattern, setSelectedPaperIdsForPattern] = useState<string[]>([]);
  const [activePattern, setActivePattern] = useState<PaperPatternSpecificationDTO | null>(null);

  // Comparison State
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<PaperComparisonDTO | null>(null);
  const [comparing, setComparing] = useState(false);

  // Human Review Modal State
  const [reviewQuestion, setReviewQuestion] = useState<SamplePaperQuestionDTO | null>(null);
  const [reviewPrimaryType, setReviewPrimaryType] = useState<SampleQuestionType>("SHORT");
  const [reviewDifficulty, setReviewDifficulty] = useState<SampleDifficultyLevel>("MEDIUM");
  const [reviewMarks, setReviewMarks] = useState(2);
  const [reviewReason, setReviewReason] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Filter
  const [questionFilter, setQuestionFilter] = useState<string>("ALL");

  const loadData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [papersRes, subjectsRes, patternsRes] = await Promise.all([
        fetch("/api/sample-papers").then((r) => r.json()),
        fetch("/api/subjects").then((r) => r.json()),
        fetch("/api/patterns").then((r) => r.json()),
      ]);

      if (papersRes.data?.samplePapers) {
        setSamplePapers(papersRes.data.samplePapers);
        if (papersRes.data.samplePapers.length > 0 && !selectedPaperId) {
          setSelectedPaperId(papersRes.data.samplePapers[0].id);
        }
      }

      if (subjectsRes.data?.subjects) {
        setSubjects(subjectsRes.data.subjects);
        if (subjectsRes.data.subjects.length > 0 && !uploadSubjectId) {
          setUploadSubjectId(subjectsRes.data.subjects[0].id);
        }
      }

      if (patternsRes.data?.patterns) {
        setPatterns(patternsRes.data.patterns);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: `Failed to load data: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When selected paper changes, fetch details and questions
  useEffect(() => {
    if (!selectedPaperId) {
      setActivePaper(null);
      setQuestions([]);
      return;
    }

    const fetchPaperDetails = async () => {
      try {
        const [paperRes, qRes] = await Promise.all([
          fetch(`/api/sample-papers/${selectedPaperId}`).then((r) => r.json()),
          fetch(`/api/sample-papers/${selectedPaperId}/questions`).then((r) => r.json()),
        ]);

        if (paperRes.data) {
          setActivePaper(paperRes.data);
        }
        if (qRes.data?.questions) {
          setQuestions(qRes.data.questions);
        }
      } catch (err: any) {
        console.error("Failed to load paper details:", err);
      }
    };

    fetchPaperDetails();
  }, [selectedPaperId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setFeedback({ type: "error", message: "Please select a PDF file to upload." });
      return;
    }

    setUploading(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle || uploadFile.name.replace(".pdf", ""));
      formData.append("subjectId", uploadSubjectId);
      formData.append("year", String(uploadYear));
      formData.append("totalMarks", String(uploadTotalMarks));
      formData.append("durationMinutes", String(uploadDuration));
      formData.append("autoProcess", String(autoProcess));

      const res = await fetch("/api/sample-papers/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to upload");

      setFeedback({
        type: "success",
        message: data.data.isDuplicate
          ? `Duplicate detected: Existing sample paper "${data.data.samplePaper.title}" loaded.`
          : `Sample paper "${data.data.samplePaper.title}" uploaded successfully!`,
      });

      setUploadFile(null);
      setUploadTitle("");
      await loadData();
      if (data.data.samplePaper?.id) {
        setSelectedPaperId(data.data.samplePaper.id);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleTriggerProcess = async () => {
    if (!selectedPaperId) return;
    setProcessing(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/sample-papers/${selectedPaperId}/process`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Processing failed");

      setFeedback({ type: "success", message: "Sample paper analyzed successfully!" });
      setActivePaper(data.data.samplePaper);
      const qRes = await fetch(`/api/sample-papers/${selectedPaperId}/questions`).then((r) => r.json());
      if (qRes.data?.questions) {
        setQuestions(qRes.data.questions);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleLearnPattern = async () => {
    if (selectedPaperIdsForPattern.length === 0) {
      setFeedback({ type: "warning", message: "Select at least one sample paper to learn a pattern." });
      return;
    }

    setLearningPattern(true);
    setFeedback(null);
    try {
      const targetSubjectId = activePaper?.subjectId || subjects[0]?.id;
      const res = await fetch("/api/patterns/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: targetSubjectId,
          samplePaperIds: selectedPaperIdsForPattern,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Pattern learning failed");

      setFeedback({
        type: "success",
        message: `Pattern '${data.data.pattern.title}' (${data.data.pattern.version}) learned successfully!`,
      });
      setActivePattern(data.data.pattern);
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setLearningPattern(false);
    }
  };

  const handleCompare = async () => {
    if (selectedPaperIdsForPattern.length < 2) {
      setFeedback({ type: "warning", message: "Select at least 2 sample papers to compare." });
      return;
    }

    setComparing(true);
    try {
      const idsParam = selectedPaperIdsForPattern.join(",");
      const res = await fetch(`/api/sample-papers/compare?paperIds=${idsParam}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Comparison failed");

      setComparisonResult(data.data);
      setShowComparison(true);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setComparing(false);
    }
  };

  const openReviewModal = (q: SamplePaperQuestionDTO) => {
    setReviewQuestion(q);
    setReviewPrimaryType(q.primaryType);
    setReviewDifficulty(q.difficulty);
    setReviewMarks(q.marks);
    setReviewReason("");
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewQuestion || !selectedPaperId) return;

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/sample-papers/${selectedPaperId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: reviewQuestion.id,
          action: "GENERAL_OVERRIDE",
          primaryType: reviewPrimaryType,
          difficulty: reviewDifficulty,
          marks: Number(reviewMarks),
          reason: reviewReason || "Curriculum officer confirmed/adjusted question parameters.",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to submit review");

      setFeedback({ type: "success", message: `Question ${reviewQuestion.originalNumber} updated and audited.` });
      setReviewQuestion(null);

      // Refresh questions
      const qRes = await fetch(`/api/sample-papers/${selectedPaperId}/questions`).then((r) => r.json());
      if (qRes.data?.questions) {
        setQuestions(qRes.data.questions);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (questionFilter === "REVIEW_REQUIRED") return q.needsReview || q.difficulty === "UNKNOWN";
    if (questionFilter === "MCQ") return q.primaryType === "MCQ";
    if (questionFilter === "SHORT") return q.primaryType === "SHORT";
    if (questionFilter === "LONG") return q.primaryType === "LONG";
    if (questionFilter === "NUMERICAL") return q.primaryType === "NUMERICAL";
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
            <Sparkles className="h-4 w-4" />
            <span>Phase 5 Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Sample Paper Intelligence &amp; Pattern Learning
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Analyze authorized examination papers, extract deterministic structure and marks arithmetic, evaluate multi-signal difficulty, and aggregate reusable examination patterns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Admin Home</span>
          </Link>
          <Link
            href="/admin/books/intelligence"
            className="flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-600/20 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Books</span>
          </Link>
          <Link
            href="/admin/syllabus/intelligence"
            className="flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-600/20 px-3 py-2 text-xs font-semibold text-teal-300 hover:bg-teal-600/30"
          >
            <FileCode2 className="h-3.5 w-3.5" />
            <span>Syllabus</span>
          </Link>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`mb-6 flex items-center justify-between rounded-lg p-3 text-xs ${
            feedback.type === "success"
              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
              : feedback.type === "warning"
              ? "bg-amber-950/80 text-amber-300 border border-amber-800"
              : "bg-rose-950/80 text-rose-300 border border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : feedback.type === "warning" ? (
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Provenance Tier Legend */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs">
        <span className="font-semibold text-slate-300">Provenance Tiers:</span>
        <span className="rounded bg-cyan-950 px-2 py-0.5 text-[11px] font-medium text-cyan-300 border border-cyan-800">
          SOURCE FACT (Verbatim)
        </span>
        <span className="rounded bg-indigo-950 px-2 py-0.5 text-[11px] font-medium text-indigo-300 border border-indigo-800">
          DERIVED ANALYSIS (Arithmetic / Rules)
        </span>
        <span className="rounded bg-amber-950 px-2 py-0.5 text-[11px] font-medium text-amber-300 border border-amber-800">
          AI CLASSIFICATION (Multi-Signal)
        </span>
        <span className="rounded bg-emerald-950 px-2 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-800">
          HUMAN VERIFIED (Audited)
        </span>
      </div>

      {/* Top Action Grid: Upload & Paper Selector */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {/* Upload Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Upload className="h-4 w-4 text-purple-400" />
            <span>Upload Sample / Model Paper (PDF)</span>
          </h2>
          <form onSubmit={handleUpload} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Target Subject</label>
              <select
                required
                value={uploadSubjectId}
                onChange={(e) => setUploadSubjectId(e.target.value)}
                className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Paper Title</label>
              <input
                placeholder="e.g. Model Paper Physics 2024"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Session Year</label>
                <input
                  type="number"
                  value={uploadYear}
                  onChange={(e) => setUploadYear(parseInt(e.target.value) || 2025)}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Reported Marks</label>
                <input
                  type="number"
                  value={uploadTotalMarks}
                  onChange={(e) => setUploadTotalMarks(parseInt(e.target.value) || 60)}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Duration (Min)</label>
                <input
                  type="number"
                  value={uploadDuration}
                  onChange={(e) => setUploadDuration(parseInt(e.target.value) || 180)}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">PDF Document</label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                required
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-slate-300 file:mr-2 file:rounded file:border-0 file:bg-purple-600 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="autoProcess"
                checked={autoProcess}
                onChange={(e) => setAutoProcess(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-purple-600"
              />
              <label htmlFor="autoProcess" className="text-slate-300 text-[11px]">
                Auto-trigger pipeline processing upon upload
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full rounded bg-purple-600 py-2 font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
            >
              {uploading ? "Uploading & Hashing..." : "Upload & Validate Document"}
            </button>
          </form>
        </div>

        {/* Paper Selector & Provenance Card */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-cyan-400" />
                <span>Selected Sample Paper Provenance</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedPaperId}
                onChange={(e) => setSelectedPaperId(e.target.value)}
                className="rounded bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white"
              >
                {samplePapers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.year}) - {p.status}
                  </option>
                ))}
              </select>
              <button
                onClick={handleTriggerProcess}
                disabled={processing || !selectedPaperId}
                className="rounded bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
              >
                {processing ? "Analyzing..." : "Re-Analyze Pipeline"}
              </button>
            </div>
          </div>

          {activePaper ? (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div>
                  <div className="text-slate-500">Document Title</div>
                  <div className="font-semibold text-white truncate">{activePaper.title}</div>
                </div>
                <div>
                  <div className="text-slate-500">Status</div>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                      activePaper.status === "COMPLETED"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : activePaper.status === "COMPLETED_WITH_WARNINGS"
                        ? "bg-amber-950 text-amber-300 border border-amber-800"
                        : "bg-purple-950 text-purple-300 border border-purple-800"
                    }`}
                  >
                    {activePaper.status}
                  </span>
                </div>
                <div>
                  <div className="text-slate-500">Subject / Session</div>
                  <div className="text-slate-300">{activePaper.subjectName || "Subject"} ({activePaper.year})</div>
                </div>
                <div>
                  <div className="text-slate-500">Pages Extracted</div>
                  <div className="font-mono text-cyan-400">{activePaper.pageCount} page(s)</div>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-400">
                <div><span className="text-slate-500">SHA-256 Checksum:</span> {activePaper.checksum || "Pending"}</div>
                <div><span className="text-slate-500">Storage File:</span> {activePaper.fileName || "N/A"}</div>
              </div>

              {/* Aggregation Selection Checkbox */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPaperIdsForPattern.includes(activePaper.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPaperIdsForPattern([...selectedPaperIdsForPattern, activePaper.id]);
                      } else {
                        setSelectedPaperIdsForPattern(selectedPaperIdsForPattern.filter((id) => id !== activePaper.id));
                      }
                    }}
                    className="rounded border-slate-700 bg-slate-950 text-purple-600"
                  />
                  <span className="text-slate-300 text-xs">
                    Include in Pattern Learning Cohort ({selectedPaperIdsForPattern.length} selected)
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLearnPattern}
                    disabled={learningPattern || selectedPaperIdsForPattern.length === 0}
                    className="rounded bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                  >
                    {learningPattern ? "Aggregating..." : "Learn Examination Pattern"}
                  </button>
                  <button
                    onClick={handleCompare}
                    disabled={comparing || selectedPaperIdsForPattern.length < 2}
                    className="rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    <GitCompare className="h-3.5 w-3.5" />
                    <span>Compare Cohort</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">No sample paper selected.</div>
          )}
        </div>
      </div>

      {/* Middle Row: Deterministic Marks Arithmetic & Actual Observed Difficulty */}
      {activePaper && (
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          {/* Arithmetic Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-indigo-400" />
                <span>Deterministic Marks Arithmetic</span>
              </span>
              <span className="text-[10px] text-indigo-300 rounded bg-indigo-950 px-2 py-0.5 border border-indigo-800">
                DERIVED ANALYSIS
              </span>
            </h3>

            {activePaper.arithmeticValidation ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                  <div>
                    <div className="text-slate-500 text-[10px]">Reported Total</div>
                    <div className="text-base font-bold text-white">{activePaper.arithmeticValidation.reportedTotalMarks}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">Calculated Grand Total</div>
                    <div className="text-base font-bold text-indigo-400">
                      {activePaper.arithmeticValidation.calculatedTotalMarks}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">Compulsory / Optional</div>
                    <div className="text-xs font-bold text-slate-300">
                      {activePaper.arithmeticValidation.calculatedCompulsoryMarks} / {activePaper.arithmeticValidation.calculatedOptionalMarks}
                    </div>
                  </div>
                </div>

                {!activePaper.arithmeticValidation.isConsistent && (
                  <div className="rounded bg-rose-950/80 p-2.5 border border-rose-800 text-rose-300 flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-400" />
                    <div>
                      <div className="font-semibold">Source Arithmetic Inconsistency Detected:</div>
                      <ul className="list-disc pl-4 text-[11px] space-y-0.5 mt-1">
                        {activePaper.arithmeticValidation.discrepancyFlags.map((flag, idx) => (
                          <li key={idx}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="text-slate-400 font-semibold text-[11px]">Section Breakdown:</div>
                  {(activePaper.arithmeticValidation.sectionTotals || []).map((sec, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded bg-slate-950 px-3 py-1.5 border border-slate-800"
                    >
                      <span className="text-slate-300">{sec.sectionName}</span>
                      <span className="font-mono text-slate-200">
                        Calc: {sec.calculatedMarks} marks {sec.reportedMarks ? `(Reported: ${sec.reportedMarks})` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-xs py-4 text-center">Process paper to compute deterministic arithmetic.</div>
            )}
          </div>

          {/* Difficulty Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-amber-400" />
                <span>Observed Difficulty Distribution</span>
              </span>
              <span className="text-[10px] text-amber-300 rounded bg-amber-950 px-2 py-0.5 border border-amber-800">
                ACTUAL OBSERVED (NOT 33/33/33)
              </span>
            </h3>

            {activePaper.qualityReport?.observedDifficulty ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                  <div>
                    <div className="text-emerald-400 font-semibold">Easy</div>
                    <div className="text-base font-bold text-white">
                      {activePaper.qualityReport.observedDifficulty.easyPercentage}%
                    </div>
                    <div className="text-[10px] text-slate-500">
                      ({activePaper.qualityReport.observedDifficulty.easyCount} Qs)
                    </div>
                  </div>
                  <div>
                    <div className="text-amber-400 font-semibold">Medium</div>
                    <div className="text-base font-bold text-white">
                      {activePaper.qualityReport.observedDifficulty.mediumPercentage}%
                    </div>
                    <div className="text-[10px] text-slate-500">
                      ({activePaper.qualityReport.observedDifficulty.mediumCount} Qs)
                    </div>
                  </div>
                  <div>
                    <div className="text-rose-400 font-semibold">Difficult</div>
                    <div className="text-base font-bold text-white">
                      {activePaper.qualityReport.observedDifficulty.difficultPercentage}%
                    </div>
                    <div className="text-[10px] text-slate-500">
                      ({activePaper.qualityReport.observedDifficulty.difficultCount} Qs)
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-semibold">Unknown</div>
                    <div className="text-base font-bold text-white">
                      {activePaper.qualityReport.observedDifficulty.unknownPercentage}%
                    </div>
                    <div className="text-[10px] text-slate-500">
                      ({activePaper.qualityReport.observedDifficulty.unknownCount} Qs)
                    </div>
                  </div>
                </div>

                <div className="rounded bg-indigo-950/40 p-2.5 border border-indigo-800/60 text-slate-300 text-[11px]">
                  <span className="font-semibold text-indigo-300">Mandatory Specification Distinction:</span>{" "}
                  Phase 5 captures the <em>actual observed distribution</em> of the source paper. The 33/33/33 target will be deterministically applied downstream during Paper Blueprint generation.
                </div>

                <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1">
                  <span>Provenance Coverage: <strong className="text-cyan-400">{activePaper.qualityReport.provenanceCoverage}%</strong></span>
                  <span>Review Required: <strong className="text-amber-400">{activePaper.qualityReport.reviewRequiredCount} items</strong></span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-xs py-4 text-center">Process paper to evaluate difficulty distribution.</div>
            )}
          </div>
        </div>
      )}

      {/* Extracted Questions & Review Queue Table */}
      <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-400" />
              <span>Extracted Questions, Classifications &amp; Provenance</span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                {questions.length} total
              </span>
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {["ALL", "REVIEW_REQUIRED", "MCQ", "SHORT", "LONG", "NUMERICAL"].map((filter) => (
              <button
                key={filter}
                onClick={() => setQuestionFilter(filter)}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                  questionFilter === filter
                    ? "bg-purple-600 text-white"
                    : "bg-slate-950 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {filter === "REVIEW_REQUIRED" ? "Review Queue" : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Questions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-3">Q#</th>
                <th className="p-3">Section</th>
                <th className="p-3">Question Text &amp; Abstract Representation</th>
                <th className="p-3">Classification</th>
                <th className="p-3">Marks</th>
                <th className="p-3">Difficulty (Multi-Signal)</th>
                <th className="p-3">Curriculum Mapping</th>
                <th className="p-3 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Q Number & Page Provenance */}
                    <td className="p-3 font-mono">
                      <div className="font-semibold text-white">{q.originalNumber}</div>
                      <div className="text-[10px] text-slate-500">Norm: {q.normalizedNumber}</div>
                      <div className="text-[10px] text-cyan-400">Page {q.pageNumber}</div>
                    </td>

                    {/* Section */}
                    <td className="p-3">
                      <span className="rounded bg-slate-950 px-2 py-0.5 text-[11px] text-slate-300 border border-slate-800">
                        {q.sectionName}
                      </span>
                    </td>

                    {/* Text & Abstract Pattern */}
                    <td className="p-3 max-w-md">
                      <div className="text-white line-clamp-2">{q.text}</div>
                      {q.abstractRepresentation && (
                        <div className="mt-1 text-[10px] text-purple-300 font-mono italic">
                          {q.abstractRepresentation}
                        </div>
                      )}
                    </td>

                    {/* Classification */}
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        <span className="rounded bg-indigo-950 px-1.5 py-0.5 text-[10px] text-indigo-300 font-semibold border border-indigo-800">
                          {q.primaryType}
                        </span>
                        {q.secondaryTypes.map((st, i) => (
                          <span key={i} className="rounded bg-slate-800 px-1 py-0.5 text-[9px] text-slate-400">
                            {st}
                          </span>
                        ))}
                      </div>
                      {q.commandVerb && (
                        <div className="text-[10px] text-slate-400 mt-1">Verb: {q.commandVerb}</div>
                      )}
                    </td>

                    {/* Marks */}
                    <td className="p-3 font-mono font-semibold text-white">
                      {q.marks} m
                      {q.choiceRule && (
                        <div className="text-[9px] text-amber-400">Choice: {q.choiceRule.selectionType}</div>
                      )}
                    </td>

                    {/* Difficulty */}
                    <td className="p-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                          q.difficulty === "EASY"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : q.difficulty === "MEDIUM"
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : q.difficulty === "DIFFICULT"
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {q.difficulty} ({q.difficultyConfidence})
                      </span>
                      {q.difficultyEvidence?.cognitiveComplexity && (
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          {q.difficultyEvidence.cognitiveComplexity} • Steps: {q.difficultyEvidence.reasoningSteps}
                        </div>
                      )}
                    </td>

                    {/* Curriculum Mapping */}
                    <td className="p-3">
                      {q.chapterTitle ? (
                        <div>
                          <div className="text-white truncate max-w-[140px]">{q.chapterTitle}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{q.topicTitle}</div>
                          <div className="text-[10px] font-mono text-cyan-400">Conf: {q.mappingConfidence}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Unmapped</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="p-3 text-right">
                      <button
                        onClick={() => openReviewModal(q)}
                        className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          q.needsReview
                            ? "bg-amber-600 text-white hover:bg-amber-500 animate-pulse"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {q.verificationStatus === "VERIFIED" ? "Verified" : q.needsReview ? "Review Required" : "Edit"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    No questions matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Learned Examination Patterns Viewer */}
      {patterns.length > 0 && (
        <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-400" />
              <span>Learned Examination Patterns (Non-Destructive Versioning)</span>
            </span>
            <span className="rounded bg-purple-950 px-2 py-0.5 text-xs text-purple-300 border border-purple-800">
              {patterns.length} version(s)
            </span>
          </h3>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {patterns.map((p) => (
              <div
                key={p.id}
                className="rounded-lg bg-slate-950 p-4 border border-slate-800 text-xs space-y-2 hover:border-purple-600/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{p.title}</span>
                  <span className="rounded bg-indigo-950 px-2 py-0.5 text-[10px] font-mono text-indigo-400 border border-indigo-800">
                    {p.version}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Total Marks: <strong className="text-white">{p.totalMarks}</strong> • Duration:{" "}
                  <strong className="text-white">{p.durationMinutes}m</strong>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Cohort Size: <strong className="text-cyan-400">{p.supportingSampleCount} paper(s)</strong> • Conf:{" "}
                  <strong className="text-emerald-400">{p.patternConfidence}</strong>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Aggregation: <span className="text-purple-300 font-semibold">{p.aggregationLevel}</span>
                </div>
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[10px] text-slate-500 mb-1">Common Command Verbs:</div>
                  <div className="flex flex-wrap gap-1">
                    {(p.wordingCharacteristics?.commonCommandVerbs || []).slice(0, 5).map((v, i) => (
                      <span key={i} className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-300">
                        {v.verb} ({v.count})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Human Review Modal Dialog */}
      {reviewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center justify-between">
              <span>Review &amp; Override Question {reviewQuestion.originalNumber}</span>
              <button onClick={() => setReviewQuestion(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </h3>
            <p className="text-slate-400 text-xs mb-4 line-clamp-3 bg-slate-950 p-2.5 rounded border border-slate-800">
              {reviewQuestion.text}
            </p>

            <form onSubmit={handleSaveReview} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Primary Type</label>
                  <select
                    value={reviewPrimaryType}
                    onChange={(e) => setReviewPrimaryType(e.target.value as SampleQuestionType)}
                    className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                  >
                    {[
                      "MCQ", "SHORT", "LONG", "NUMERICAL", "CONCEPTUAL",
                      "DEFINITION", "EXPLANATION", "COMPARISON", "APPLICATION",
                      "DIAGRAM", "DERIVATION", "PROBLEM_SOLVING", "OTHER"
                    ].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Difficulty</label>
                  <select
                    value={reviewDifficulty}
                    onChange={(e) => setReviewDifficulty(e.target.value as SampleDifficultyLevel)}
                    className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="DIFFICULT">DIFFICULT</option>
                    <option value="UNKNOWN">UNKNOWN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Marks</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={reviewMarks}
                  onChange={(e) => setReviewMarks(parseInt(e.target.value) || 1)}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reviewer Rationale (Audit Trail Logged)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain reason for confirmation or override..."
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewQuestion(null)}
                  className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="rounded bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                >
                  {submittingReview ? "Saving Audit..." : "Confirm & Save Audit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cohort Comparison Modal */}
      {showComparison && comparisonResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-purple-400" />
                <span>Side-by-Side Descriptive Paper Comparison</span>
              </span>
              <button onClick={() => setShowComparison(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              Descriptive structural diffing across {comparisonResult.papers.length} sample papers (No ranking applied).
            </p>

            <div className="space-y-4 text-xs">
              {/* Total Marks & Duration Table */}
              <div className="overflow-x-auto rounded border border-slate-800">
                <table className="w-full text-left text-slate-300">
                  <thead className="bg-slate-950 text-[11px] text-slate-400">
                    <tr>
                      <th className="p-2.5">Paper</th>
                      <th className="p-2.5">Total Marks</th>
                      <th className="p-2.5">Compulsory / Optional</th>
                      <th className="p-2.5">Duration</th>
                      <th className="p-2.5">Sections</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {comparisonResult.papers.map((p) => {
                      const marks = comparisonResult.marksComparison.find((m) => m.paperId === p.id);
                      const dur = comparisonResult.durationComparison.find((d) => d.paperId === p.id);
                      const sec = comparisonResult.sectionComparison.find((s) => s.paperId === p.id);
                      return (
                        <tr key={p.id}>
                          <td className="p-2.5 font-semibold text-white">{p.title} ({p.year})</td>
                          <td className="p-2.5 font-mono">{marks?.totalMarks || 0}</td>
                          <td className="p-2.5 font-mono">{marks?.compulsoryMarks || 0} / {marks?.optionalMarks || 0}</td>
                          <td className="p-2.5 font-mono">{dur?.durationMinutes || 0}m</td>
                          <td className="p-2.5 font-mono">{sec?.sectionCount || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
