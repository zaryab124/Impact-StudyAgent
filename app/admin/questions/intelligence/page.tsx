"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  BookOpen,
  Filter,
  Eye,
  EyeOff,
  Check,
  X,
  Layers,
  Database,
  ShieldCheck,
  Cpu,
  RefreshCw,
} from "lucide-react";
import {
  QuestionCandidate,
  QuestionBankItem,
  QuestionGenerationBatch,
} from "@/types/question-generation";
import { ExaminationBlueprint, QuestionSpecification } from "@/types/blueprint";

export default function QuestionIntelligencePage() {
  // Navigation & Data States
  const [blueprints, setBlueprints] = useState<ExaminationBlueprint[]>([]);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>("");
  const [selectedBlueprint, setSelectedBlueprint] = useState<ExaminationBlueprint | null>(null);
  const [specifications, setSpecifications] = useState<QuestionSpecification[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");

  // Candidates & Bank States
  const [candidates, setCandidates] = useState<QuestionCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<QuestionCandidate | null>(null);
  const [bankItems, setBankItems] = useState<QuestionBankItem[]>([]);
  const [batches, setBatches] = useState<QuestionGenerationBatch[]>([]);

  // UI & Loading States
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [activeTab, setActiveTab] = useState<"workspace" | "bank" | "batches">("workspace");

  // Search & Filter
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch blueprints
      const bpRes = await fetch("/api/blueprints");
      const bpData = await bpRes.json();
      if (bpData.success && bpData.data) {
        setBlueprints(bpData.data);
        const approved = bpData.data.find((b: ExaminationBlueprint) => b.status === "APPROVED");
        if (approved) {
          setSelectedBlueprintId(approved.id);
          setSelectedBlueprint(approved);
          loadSpecifications(approved.id);
          loadCandidates(approved.id);
        } else if (bpData.data.length > 0) {
          setSelectedBlueprintId(bpData.data[0].id);
          setSelectedBlueprint(bpData.data[0]);
          loadSpecifications(bpData.data[0].id);
          loadCandidates(bpData.data[0].id);
        }
      }

      // 2. Fetch Question Bank
      loadBankItems();

      // 3. Fetch batches
      const batchRes = await fetch("/api/question-batches");
      const batchData = await batchRes.json();
      if (batchData.success && batchData.data) {
        setBatches(batchData.data.batches || []);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to load initial data." });
    } finally {
      setLoading(false);
    }
  };

  const loadSpecifications = async (blueprintId: string) => {
    try {
      const res = await fetch(`/api/question-specifications?blueprintId=${blueprintId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setSpecifications(data.data);
        if (data.data.length > 0) {
          setSelectedSlotId(data.data[0].blueprintSlotId);
        }
      }
    } catch {
      // specifications fetch
    }
  };

  const loadCandidates = async (blueprintId: string) => {
    try {
      const res = await fetch(`/api/questions?blueprintId=${blueprintId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setCandidates(data.data.candidates || []);
        if (data.data.candidates && data.data.candidates.length > 0) {
          setSelectedCandidate(data.data.candidates[0]);
        }
      }
    } catch {
      // candidate fetch
    }
  };

  const loadBankItems = async () => {
    try {
      const res = await fetch("/api/questions");
      const data = await res.json();
      if (data.success && data.data) {
        setBankItems(data.data.bankItems || []);
      }
    } catch {
      // bank fetch
    }
  };

  const handleSelectBlueprint = (id: string) => {
    setSelectedBlueprintId(id);
    const bp = blueprints.find((b) => b.id === id) || null;
    setSelectedBlueprint(bp);
    if (id) {
      loadSpecifications(id);
      loadCandidates(id);
    }
  };

  const handleGenerateSingle = async () => {
    if (!selectedBlueprintId || !selectedSlotId) return;
    setGenerating(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": "ADMIN" },
        body: JSON.stringify({
          blueprintId: selectedBlueprintId,
          blueprintSlotId: selectedSlotId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Question generation failed.");
      }

      setFeedback({ type: "success", message: "Question candidate generated and grounded successfully!" });
      setSelectedCandidate(data.data);
      loadCandidates(selectedBlueprintId);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateBatch = async () => {
    if (!selectedBlueprintId) return;
    setGenerating(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/questions/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": "ADMIN" },
        body: JSON.stringify({
          blueprintId: selectedBlueprintId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Batch question generation failed.");
      }

      setFeedback({
        type: "success",
        message: `Batch completed! Generated ${data.data.generatedCount} candidate(s).`,
      });
      loadCandidates(selectedBlueprintId);
      loadBankItems();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleReviewAction = async (action: "APPROVE" | "REJECT") => {
    if (!selectedCandidate) return;
    try {
      const res = await fetch(`/api/questions/${selectedCandidate.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": "ADMIN" },
        body: JSON.stringify({
          action,
          reason: `Review decision: ${action} by Admin`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Review action failed.");

      setFeedback({
        type: "success",
        message: action === "APPROVE" ? "Question approved into official Question Bank!" : "Candidate rejected.",
      });
      setSelectedCandidate(data.data);
      loadCandidates(selectedBlueprintId);
      loadBankItems();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const filteredBankItems = bankItems.filter((item) => {
    if (filterDifficulty !== "ALL" && item.difficulty !== filterDifficulty) return false;
    if (filterType !== "ALL" && item.questionType !== filterType) return false;
    if (bankSearchQuery) {
      const q = bankSearchQuery.toLowerCase();
      return (
        item.questionText.toLowerCase().includes(q) ||
        item.topicTitle.toLowerCase().includes(q) ||
        item.chapterTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/blueprints"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Blueprints</span>
            </Link>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-indigo-400" />
            <span>Grounded Question Intelligence &amp; Question Bank</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Phase 8: Generate traceable educational question candidates strictly grounded in Phase 6 textbook retrieval and approved blueprints.
          </p>
        </div>

        {/* Global Tab Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("workspace")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === "workspace"
                ? "bg-indigo-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Generation Workspace</span>
          </button>
          <button
            onClick={() => setActiveTab("bank")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === "bank"
                ? "bg-indigo-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Question Bank ({bankItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("batches")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === "batches"
                ? "bg-indigo-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Audit Batches ({batches.length})</span>
          </button>
          <button
            onClick={loadInitialData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-lg p-3.5 text-xs ${
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
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* TAB 1: WORKSPACE */}
      {activeTab === "workspace" && (
        <div className="space-y-6">
          {/* Blueprint Selector Bar */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  1. Target Examination Blueprint
                </label>
                <select
                  value={selectedBlueprintId}
                  onChange={(e) => handleSelectBlueprint(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select an Approved Blueprint...</option>
                  {blueprints.map((bp) => (
                    <option key={bp.id} value={bp.id}>
                      {bp.title} ({bp.version}) — {bp.status} [{bp.totalMarks} Marks]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  2. Question Slot Target
                </label>
                <select
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  disabled={!selectedBlueprint || specifications.length === 0}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                >
                  <option value="">Choose Question Slot...</option>
                  {specifications.map((spec) => (
                    <option key={spec.blueprintSlotId} value={spec.blueprintSlotId}>
                      Slot #{spec.sequenceNumber} ({spec.sectionName}) — {spec.questionType} [{spec.marks}M, {spec.difficulty}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <button
                  onClick={handleGenerateSingle}
                  disabled={generating || !selectedBlueprintId || !selectedSlotId}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-indigo-500/50 bg-indigo-600/30 px-3 py-2 text-xs font-semibold text-indigo-200 hover:bg-indigo-600/40 disabled:opacity-50"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
                  <span>{generating ? "Generating..." : "Generate Slot"}</span>
                </button>
                <button
                  onClick={handleGenerateBatch}
                  disabled={generating || !selectedBlueprint || selectedBlueprint.status !== "APPROVED"}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-purple-500/50 bg-purple-600/30 px-3 py-2 text-xs font-semibold text-purple-200 hover:bg-purple-600/40 disabled:opacity-50"
                >
                  <Layers className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
                  <span>Generate Batch</span>
                </button>
              </div>
            </div>

            {selectedBlueprint && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <strong className="text-slate-300">Status:</strong>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedBlueprint.status === "APPROVED"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : "bg-amber-950 text-amber-300 border border-amber-800"
                    }`}
                  >
                    {selectedBlueprint.status}
                  </span>
                </span>
                <span>•</span>
                <span>
                  <strong className="text-slate-300">Syllabus:</strong> {selectedBlueprint.syllabusTitle} ({selectedBlueprint.syllabusVersion})
                </span>
                <span>•</span>
                <span>
                  <strong className="text-slate-300">Textbook:</strong> {selectedBlueprint.bookTitle || "Standard Book"}
                </span>
                <span>•</span>
                <span>
                  <strong className="text-slate-300">Slots:</strong> {selectedBlueprint.slots?.length || 0}
                </span>
              </div>
            )}
          </div>

          {/* Main Inspection Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Generated Candidates List (4 cols) */}
            <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Candidates ({candidates.length})</span>
                </h3>
                <span className="text-[10px] text-slate-500">Click to Inspect</span>
              </div>

              {candidates.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  No question candidates generated yet for this blueprint. Select a slot and click &quot;Generate Slot&quot;.
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {candidates.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCandidate(c)}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition-colors ${
                        selectedCandidate?.id === c.id
                          ? "border-indigo-500/80 bg-indigo-950/40"
                          : "border-slate-800 bg-slate-950/60 hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white">
                          Slot #{c.blueprintSlotId.slice(-4)} — {c.questionType}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.reviewStatus === "APPROVED"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : c.reviewStatus === "AUTO_VALIDATED"
                              ? "bg-indigo-950 text-indigo-300 border border-indigo-800"
                              : c.reviewStatus === "REJECTED"
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : "bg-amber-950 text-amber-300 border border-amber-800"
                          }`}
                        >
                          {c.reviewStatus}
                        </span>
                      </div>
                      <p className="text-slate-300 line-clamp-2">{c.questionText}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                        <span>
                          {c.difficulty} • {c.marks}M • {c.cognitiveLevel}
                        </span>
                        <span className="font-semibold text-emerald-400">Quality: {c.qualityScore}%</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Candidate Detail & Validation Inspector (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {selectedCandidate ? (
                <>
                  {/* Action Bar */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-semibold">Review Action:</span>
                      <button
                        onClick={() => handleReviewAction("APPROVE")}
                        className="flex items-center gap-1 rounded bg-emerald-600/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-600/30"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Approve into Bank</span>
                      </button>
                      <button
                        onClick={() => handleReviewAction("REJECT")}
                        className="flex items-center gap-1 rounded bg-rose-600/20 border border-rose-500/40 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-600/30"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Reject Candidate</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setShowAnswerKey(!showAnswerKey)}
                      className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                    >
                      {showAnswerKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      <span>{showAnswerKey ? "Hide Answer Key" : "Preview Answer Key"}</span>
                    </button>
                  </div>

                  {/* Panel 1: GENERATED QUESTION */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                          GENERATED QUESTION
                        </span>
                        <span className="text-xs font-semibold text-slate-300">
                          {selectedCandidate.questionType} ({selectedCandidate.marks} Marks)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Difficulty: <strong className="text-slate-200">{selectedCandidate.difficulty}</strong></span>
                        <span>•</span>
                        <span>Cognitive: <strong className="text-slate-200">{selectedCandidate.cognitiveLevel}</strong></span>
                      </div>
                    </div>

                    {/* Question Text */}
                    <div className="text-sm font-medium text-white leading-relaxed bg-slate-950/80 p-4 rounded-lg border border-slate-800">
                      {selectedCandidate.questionText}
                    </div>

                    {/* MCQ Options (if MCQ) */}
                    {selectedCandidate.questionType === "MCQ" &&
                      selectedCandidate.answerMaterial?.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {selectedCandidate.answerMaterial.options.map((opt) => (
                            <div
                              key={opt.key}
                              className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                                showAnswerKey && opt.isCorrect
                                  ? "border-emerald-500/60 bg-emerald-950/30 text-emerald-200"
                                  : "border-slate-800 bg-slate-950 text-slate-300"
                              }`}
                            >
                              <span className="font-bold text-indigo-400">{opt.key}.</span>
                              <div className="flex-1">
                                <span>{opt.text}</span>
                                {showAnswerKey && opt.distractorRationale && (
                                  <p className="mt-1 text-[10px] text-slate-500 italic">
                                    {opt.distractorRationale}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    {/* Multi-parts (if Long) */}
                    {selectedCandidate.parts && selectedCandidate.parts.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {selectedCandidate.parts.map((p) => (
                          <div key={p.partLabel} className="p-3 rounded-lg border border-slate-800 bg-slate-950 text-xs">
                            <span className="font-bold text-indigo-300">({p.partLabel})</span>{" "}
                            <span className="text-slate-200">{p.text}</span>{" "}
                            <span className="text-slate-500 font-semibold">[{p.marks} Marks]</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Protected Answer Material Drawer */}
                    {showAnswerKey && (
                      <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-4 text-xs space-y-2">
                        <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Authorized Examiner Answer Material &amp; Rubric</span>
                        </div>
                        {selectedCandidate.answerMaterial?.expectedKeyPoints && (
                          <div>
                            <strong className="text-slate-300">Expected Key Points:</strong>
                            <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-400">
                              {selectedCandidate.answerMaterial.expectedKeyPoints.map((pt, i) => (
                                <li key={i}>{pt}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedCandidate.answerMaterial?.rubricBreakdown && (
                          <div>
                            <strong className="text-slate-300">Marking Rubric:</strong>
                            <div className="mt-1 space-y-1">
                              {selectedCandidate.answerMaterial.rubricBreakdown.map((r, i) => (
                                <div key={i} className="flex justify-between border-b border-emerald-900/40 pb-1">
                                  <span className="text-slate-300">{r.criterion}:</span>
                                  <span className="text-emerald-400 font-bold">{r.marks}M</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedCandidate.answerMaterial?.numericalData && (
                          <div className="space-y-1">
                            <strong className="text-slate-300">Deterministic Computation:</strong>
                            <p className="text-slate-400">
                              Formula: <code>{selectedCandidate.answerMaterial.numericalData.formula}</code>
                            </p>
                            <p className="text-emerald-300 font-bold">
                              Final Result: {selectedCandidate.answerMaterial.numericalData.finalValue}{" "}
                              {selectedCandidate.answerMaterial.numericalData.unit}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Panel 2: SOURCE EVIDENCE & PROVENANCE */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800">
                        SOURCE EVIDENCE &amp; 13-COORDINATE PROVENANCE
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Pages: {selectedCandidate.sourcePages.join(", ")}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Chapter</span>
                        <span className="text-slate-200 font-medium">{selectedCandidate.chapterTitle}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Topic</span>
                        <span className="text-slate-200 font-medium">{selectedCandidate.topicTitle}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Syllabus Version</span>
                        <span className="text-slate-200 font-medium">{selectedCandidate.syllabusVersion}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Textbook</span>
                        <span className="text-slate-200 font-medium">{selectedCandidate.bookTitle || "Official Textbook"}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                      <strong className="text-slate-300 block text-[10px]">Retrieved Chunk IDs:</strong>
                      <div className="flex flex-wrap gap-1">
                        {selectedCandidate.sourceChunkIds.map((cid) => (
                          <span key={cid} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300">
                            {cid}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Panel 3: MULTI-AGENT VALIDATION & DETERMINISTIC AUDIT */}
                  {selectedCandidate.validationReport && (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          DETERMINISTIC VALIDATION &amp; QUALITY AUDIT
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          Quality Score: {selectedCandidate.validationReport.overallQualityScore}%
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950 space-y-1">
                          <span className="font-bold text-slate-300 block">Grounding Check</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              selectedCandidate.validationReport.grounding.isGrounded
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            {selectedCandidate.validationReport.grounding.isGrounded ? "GROUNDED" : "DEFICIENT"}
                          </span>
                          <p className="text-[10px] text-slate-500">
                            {selectedCandidate.validationReport.grounding.verificationNotes}
                          </p>
                        </div>

                        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950 space-y-1">
                          <span className="font-bold text-slate-300 block">Difficulty Alignment</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              selectedCandidate.validationReport.difficulty.isAligned
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }`}
                          >
                            {selectedCandidate.validationReport.difficulty.evaluatedDifficulty}
                          </span>
                          <p className="text-[10px] text-slate-500">
                            {selectedCandidate.validationReport.difficulty.reconciliationNotes}
                          </p>
                        </div>

                        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950 space-y-1">
                          <span className="font-bold text-slate-300 block">Duplicate Check</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              !selectedCandidate.validationReport.duplication.hasDuplicates
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }`}
                          >
                            {selectedCandidate.validationReport.duplication.duplicateLevel}
                          </span>
                          <p className="text-[10px] text-slate-500">
                            {selectedCandidate.validationReport.duplication.analysisDetails}
                          </p>
                        </div>
                      </div>

                      {selectedCandidate.validationReport.issues &&
                        selectedCandidate.validationReport.issues.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 block">Audit Issues:</span>
                            {selectedCandidate.validationReport.issues.map((iss, idx) => (
                              <div
                                key={idx}
                                className={`text-[10px] p-2 rounded border flex items-center gap-1.5 ${
                                  iss.severity === "ERROR"
                                    ? "border-rose-800 bg-rose-950/40 text-rose-300"
                                    : "border-amber-800 bg-amber-950/40 text-amber-300"
                                }`}
                              >
                                <span className="font-bold">[{iss.code}]</span> {iss.message}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-[400px] rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs">
                  <BookOpen className="h-8 w-8 mb-2 opacity-50" />
                  <span>Select a generated question candidate on the left to inspect its grounded evidence and validation audit.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUESTION BANK */}
      {activeTab === "bank" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-400" />
                <span>Official Immutable Question Bank</span>
              </h2>
              <p className="text-xs text-slate-400">
                Authorized educational questions promoted through the Human Review Gate.
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search questions or topics..."
                  value={bankSearchQuery}
                  onChange={(e) => setBankSearchQuery(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none w-52"
                />
              </div>

              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
              >
                <option value="ALL">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="DIFFICULT">Difficult</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
              >
                <option value="ALL">All Types</option>
                <option value="MCQ">MCQ</option>
                <option value="SHORT">Short</option>
                <option value="LONG">Long</option>
                <option value="NUMERICAL">Numerical</option>
              </select>
            </div>
          </div>

          {filteredBankItems.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
              No approved questions in the Question Bank matching the criteria. Approve candidate questions from the workspace.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBankItems.map((item) => (
                <div key={item.id} className="p-4 rounded-lg border border-slate-800 bg-slate-950 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">#{item.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {item.questionType}
                      </span>
                      <span className="text-slate-400">
                        {item.chapterTitle} &gt; {item.topicTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <span>Ver: <strong className="text-slate-200">{item.version}</strong></span>
                      <span>•</span>
                      <span>Marks: <strong className="text-slate-200">{item.marks}M</strong></span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">Score: {item.qualityScore}%</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-200">{item.questionText}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                    <span>Approved By: {item.approvedBy} on {new Date(item.approvedAt).toLocaleDateString()}</span>
                    <span>Pages: {item.sourcePages?.join(", ") || "1"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT BATCHES */}
      {activeTab === "batches" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-400" />
              <span>Generation Batch Audit Trail</span>
            </h2>
            <p className="text-xs text-slate-400">
              Complete provenance tracking for multi-slot batch generation runs.
            </p>
          </div>

          {batches.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
              No generation batches recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {batches.map((b) => (
                <div key={b.id} className="p-4 rounded-lg border border-slate-800 bg-slate-950 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Batch #{b.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === "COMPLETED"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-amber-950 text-amber-300 border border-amber-800"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-400">
                    <div>Requested: <strong className="text-slate-200">{b.requestedCount}</strong></div>
                    <div>Generated: <strong className="text-slate-200">{b.generatedCount}</strong></div>
                    <div>Accepted: <strong className="text-emerald-400">{b.acceptedCount}</strong></div>
                    <div>Blocked: <strong className="text-rose-400">{b.blockedCount}</strong></div>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900 flex justify-between">
                    <span>Provider: {b.provider} ({b.model})</span>
                    <span>Started: {new Date(b.startedAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
