"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Database,
  ShieldCheck,
  Cpu,
  Layers,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Info,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { RetrievalMode, RetrievedKnowledgePackage, RetrievalResultItem } from "@/types/retrieval";

export default function AdminRetrievalPage() {
  // Educational Hierarchy
  const [boards, setBoards] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [syllabi, setSyllabi] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);

  // Selected hierarchy
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedSyllabusId, setSelectedSyllabusId] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");

  // Query parameters
  const [query, setQuery] = useState("Explain Newton's second law of motion and its formula");
  const [mode, setMode] = useState<RetrievalMode>("GENERAL_KNOWLEDGE");
  const [topK, setTopK] = useState(5);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.3);
  const [targetQuestionType, setTargetQuestionType] = useState("");
  const [targetMarks, setTargetMarks] = useState<number | "">("");
  const [diagnosticMode, setDiagnosticMode] = useState(false);

  // Execution states
  const [loading, setLoading] = useState(false);
  const [resultPackage, setResultPackage] = useState<RetrievedKnowledgePackage | null>(null);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Load initial dropdown data
  useEffect(() => {
    async function loadHierarchy() {
      try {
        const [bRes, yRes, cRes, sRes, bkRes, sylRes] = await Promise.all([
          fetch("/api/boards").then((r) => r.json()),
          fetch("/api/academic-years").then((r) => r.json()),
          fetch("/api/classes").then((r) => r.json()),
          fetch("/api/subjects").then((r) => r.json()),
          fetch("/api/books").then((r) => r.json()),
          fetch("/api/syllabus").then((r) => r.json()),
        ]);

        const loadedBoards = bRes.data?.boards || [];
        const loadedYears = yRes.data?.academicYears || [];
        const loadedClasses = cRes.data?.classes || [];
        const loadedSubjects = sRes.data?.subjects || [];
        const loadedBooks = bkRes.data?.books || [];
        const loadedSyllabi = sylRes.data?.syllabi || [];

        setBoards(loadedBoards);
        setAcademicYears(loadedYears);
        setClasses(loadedClasses);
        setSubjects(loadedSubjects);
        setBooks(loadedBooks);
        setSyllabi(loadedSyllabi);

        if (loadedBoards.length > 0) setSelectedBoardId(loadedBoards[0].id);
        if (loadedYears.length > 0) setSelectedYearId(loadedYears[0].id);
        if (loadedClasses.length > 0) setSelectedClassId(loadedClasses[0].id);
        if (loadedSubjects.length > 0) setSelectedSubjectId(loadedSubjects[0].id);
        if (loadedBooks.length > 0) setSelectedBookId(loadedBooks[0].id);
        if (loadedSyllabi.length > 0) setSelectedSyllabusId(loadedSyllabi[0].id);
      } catch (err: any) {
        console.error("Failed to load hierarchy data:", err);
      }
    }
    loadHierarchy();
  }, []);

  const handleExecuteSearch = async (isContextAssemble: boolean = false) => {
    if (!query.trim()) {
      setError("Please enter a search query.");
      return;
    }

    setLoading(true);
    setError(null);
    setResultPackage(null);

    const endpoint = isContextAssemble ? "/api/retrieval/context" : "/api/retrieval/search";

    const payload = {
      boardId: selectedBoardId || "board-default",
      academicYearId: selectedYearId || "year-default",
      classId: selectedClassId || "class-default",
      subjectId: selectedSubjectId || "subject-default",
      syllabusId: selectedSyllabusId || "syl-default",
      bookId: selectedBookId || undefined,
      query: query.trim(),
      mode,
      topK,
      similarityThreshold,
      diagnosticMode,
      patternContext:
        targetQuestionType || targetMarks
          ? {
              targetQuestionType: targetQuestionType || undefined,
              targetMarks: targetMarks ? Number(targetMarks) : undefined,
            }
          : undefined,
    };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "ADMIN",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Retrieval execution failed.");
      }

      setResultPackage(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setError(null);
    setValidationResult(null);

    try {
      const res = await fetch("/api/retrieval/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "ADMIN",
        },
        body: JSON.stringify({
          boardId: selectedBoardId || "board-default",
          academicYearId: selectedYearId || "year-default",
          classId: selectedClassId || "class-default",
          subjectId: selectedSubjectId || "subject-default",
          syllabusId: selectedSyllabusId || "syl-default",
          query: query.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Validation failed.");
      }

      setValidationResult(json.data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Link href="/admin" className="hover:text-slate-200">
              Admin
            </Link>
            <span>/</span>
            <span className="text-indigo-400">RAG Knowledge Retrieval Sandbox</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Controlled Knowledge Retrieval Engine
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Test syllabus-gated retrieval, hybrid ranking, deduplication, and context window budgeting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/syllabus/intelligence"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
            <span>Syllabus Gate</span>
          </Link>
          <Link
            href="/admin/books/intelligence"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
          >
            <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
            <span>Book Chunks</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Form Left, Results Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Retrieval Configuration */}
        <div className="space-y-6 lg:col-span-5">
          {/* Hierarchy Gate Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>1. Educational Hierarchy &amp; Syllabus Gate</span>
              </h2>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                Hard Gate Active
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-300">Board</label>
                  <select
                    value={selectedBoardId}
                    onChange={(e) => setSelectedBoardId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {boards.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} - {b.name}
                      </option>
                    ))}
                    {boards.length === 0 && <option value="">BISE Federal (Demo)</option>}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-medium text-slate-300">Academic Year</label>
                  <select
                    value={selectedYearId}
                    onChange={(e) => setSelectedYearId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {academicYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name || y.code}
                      </option>
                    ))}
                    {academicYears.length === 0 && <option value="">2024-2025</option>}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-300">Class / Grade</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    {classes.length === 0 && <option value="">Grade 9</option>}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-medium text-slate-300">Subject</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                    {subjects.length === 0 && <option value="">Physics</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-300">
                  Target Syllabus (Verified/Published Required)
                </label>
                <select
                  value={selectedSyllabusId}
                  onChange={(e) => setSelectedSyllabusId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                >
                  {syllabi.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.status}] {s.title || s.version} (v{s.version})
                    </option>
                  ))}
                  {syllabi.length === 0 && <option value="syl-verified">[VERIFIED] Official 2025 Physics Syllabus</option>}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-300">Textbook (Optional Filter)</label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">All Subject Textbooks</option>
                  {books.map((bk) => (
                    <option key={bk.id} value={bk.id}>
                      {bk.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Query & Retrieval Controls */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sliders className="h-4 w-4 text-indigo-400" />
                <span>2. Search Query &amp; Retrieval Mode</span>
              </h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-medium text-slate-300">Pedagogical Query</label>
                <textarea
                  rows={3}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. State Newton's second law of motion and derive F = ma"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-300">Retrieval Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as RetrievalMode)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="GENERAL_KNOWLEDGE">GENERAL_KNOWLEDGE (Broad Search)</option>
                  <option value="DEFINITION">DEFINITION (Strict Definitions)</option>
                  <option value="FORMULA">FORMULA (Laws &amp; Equations)</option>
                  <option value="EXAMPLE">EXAMPLE (Worked Textbook Examples)</option>
                  <option value="EXERCISE">EXERCISE (Review &amp; Practice Questions)</option>
                  <option value="CONCEPT">CONCEPT (Conceptual Explanations)</option>
                  <option value="NUMERICAL">NUMERICAL (Formulas &amp; Calculation Problems)</option>
                  <option value="DIAGRAM">DIAGRAM (Figures &amp; Visual Schematics)</option>
                  <option value="TABLE">TABLE (Summary &amp; Data Tables)</option>
                  <option value="TOPIC_SUMMARY">TOPIC_SUMMARY (SLOs &amp; Overviews)</option>
                  <option value="QUESTION_SUPPORT">QUESTION_SUPPORT (Exam Evidence Pack)</option>
                </select>
              </div>

              {/* Sliders: Top K & Similarity */}
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-800/50 p-3">
                <div>
                  <div className="flex justify-between text-slate-300">
                    <span>Top K Candidates</span>
                    <span className="font-semibold text-indigo-400">{topK}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={topK}
                    onChange={(e) => setTopK(Number(e.target.value))}
                    className="mt-2 w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300">
                    <span>Similarity Cutoff</span>
                    <span className="font-semibold text-indigo-400">
                      {(similarityThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.9}
                    step={0.05}
                    value={similarityThreshold}
                    onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                    className="mt-2 w-full accent-indigo-500"
                  />
                </div>
              </div>

              {/* Optional Pattern Context */}
              <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Paper Pattern Context (Phase 5 Link)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400">Target Question Type</label>
                    <input
                      type="text"
                      placeholder="e.g. NUMERICAL, MCQ"
                      value={targetQuestionType}
                      onChange={(e) => setTargetQuestionType(e.target.value)}
                      className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Target Marks</label>
                    <input
                      type="number"
                      placeholder="e.g. 3, 5"
                      value={targetMarks}
                      onChange={(e) => setTargetMarks(e.target.value ? Number(e.target.value) : "")}
                      className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Diagnostic Mode Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-amber-900/30 bg-amber-950/20 p-2.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-200 text-xs">Diagnostic Mode (Admin Only)</span>
                </div>
                <input
                  type="checkbox"
                  checked={diagnosticMode}
                  onChange={(e) => setDiagnosticMode(e.target.checked)}
                  className="h-4 w-4 rounded accent-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleExecuteSearch(false)}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span>Search Knowledge</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteSearch(true)}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-teal-500 disabled:opacity-50"
                >
                  <Layers className="h-4 w-4" />
                  <span>Assemble Context</span>
                </button>

                <button
                  type="button"
                  onClick={handleValidate}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 font-medium text-slate-300 hover:bg-slate-700"
                  title="Run pre-flight validation"
                >
                  Check
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Search Results & Observability */}
        <div className="space-y-6 lg:col-span-7">
          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-xs text-rose-300">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                <span>Retrieval Error</span>
              </div>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {validationResult && (
            <div className="rounded-xl border border-teal-500/40 bg-teal-950/30 p-4 text-xs text-teal-300">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-400" />
                  Pre-Flight Hierarchy Validation
                </span>
                <span className="rounded bg-teal-500/20 px-2 py-0.5 text-[11px]">
                  Status: {validationResult.syllabusStatus}
                </span>
              </div>
              <div className="mt-2 text-slate-300">
                <span>Detected Intent: </span>
                <span className="font-semibold text-white">
                  {validationResult.queryUnderstanding?.intent}
                </span>
                <span className="ml-3">Knowledge Type: </span>
                <span className="font-semibold text-white">
                  {validationResult.queryUnderstanding?.requestedKnowledgeType}
                </span>
              </div>
            </div>
          )}

          {/* Result Package Stats Header */}
          {resultPackage && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      resultPackage.status === "SUCCESS"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {resultPackage.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    Mode: <strong className="text-white">{resultPackage.retrievalMode}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-indigo-400" />
                    <strong>{resultPackage.latencyMs}ms</strong>
                  </span>
                  <span>|</span>
                  <span>
                    Returned: <strong className="text-white">{resultPackage.returnedCount}</strong> /{" "}
                    {resultPackage.totalCandidates}
                  </span>
                  <span>|</span>
                  <span>
                    Tokens: <strong className="text-white">{resultPackage.contextBudget?.usedTokens}</strong> /{" "}
                    {resultPackage.contextBudget?.maxTokens}
                  </span>
                </div>
              </div>

              {/* Query Understanding Pill */}
              {resultPackage.queryUnderstanding && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded bg-indigo-500/10 px-2 py-1 text-indigo-300 border border-indigo-500/20">
                    Intent: <strong>{resultPackage.queryUnderstanding.intent}</strong>
                  </span>
                  <span className="rounded bg-teal-500/10 px-2 py-1 text-teal-300 border border-teal-500/20">
                    Type: <strong>{resultPackage.queryUnderstanding.requestedKnowledgeType}</strong>
                  </span>
                  {resultPackage.queryUnderstanding.extractedConcepts?.map((c, i) => (
                    <span
                      key={i}
                      className="rounded bg-slate-800 px-2 py-1 text-slate-400 border border-slate-700"
                    >
                      #{c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Results List */}
          {resultPackage && resultPackage.results && resultPackage.results.length > 0 ? (
            <div className="space-y-4">
              {resultPackage.results.map((item: RetrievalResultItem, idx: number) => {
                const isExpanded = expandedItem === item.chunkId;
                return (
                  <div
                    key={item.chunkId || idx}
                    className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 transition-all hover:border-slate-700"
                  >
                    {/* Item Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-indigo-500/20 px-2 py-0.5 font-bold text-indigo-400">
                          #{(idx + 1).toString().padStart(2, "0")}
                        </span>
                        <span className="font-semibold text-slate-200">
                          {item.heading || item.provenance.chapterTitle || "Textbook Section"}
                        </span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                          {item.chunkType}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                          {(item.relevanceScore * 100).toFixed(1)}% Match
                        </span>
                        <button
                          onClick={() => setExpandedItem(isExpanded ? null : item.chunkId)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Verbatim Content */}
                    <p className="mt-3 text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
                      {item.content}
                    </p>

                    {/* Educational Provenance Lineage */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                      <span className="flex items-center gap-1 font-medium text-slate-300">
                        <BookOpen className="h-3 w-3 text-indigo-400" />
                        {item.provenance.bookTitle}
                      </span>
                      <span>&bull;</span>
                      <span>Ch: {item.provenance.chapterTitle || "General"}</span>
                      <span>&bull;</span>
                      <span>Topic: {item.provenance.topicTitle || "General"}</span>
                      <span>&bull;</span>
                      <span className="font-semibold text-indigo-300">Page {item.provenance.pageNumber}</span>
                      <span>&bull;</span>
                      <span className="text-emerald-400 font-semibold">
                        Syllabus: {item.provenance.eligibilityStatus}
                      </span>
                    </div>

                    {/* Diagnostic Explanation Drawer */}
                    {isExpanded && (
                      <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-3 text-[11px] space-y-1.5 text-slate-400">
                        <div className="font-semibold text-slate-200">Retrieval Diagnostic Breakdown:</div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <div>
                            Semantic Score:{" "}
                            <strong className="text-indigo-300">
                              {(item.explanation.semanticScore * 100).toFixed(1)}%
                            </strong>
                          </div>
                          <div>
                            Keyword Score:{" "}
                            <strong className="text-teal-300">
                              {(item.explanation.keywordScore * 100).toFixed(1)}%
                            </strong>
                          </div>
                          <div>
                            Metadata Score:{" "}
                            <strong className="text-amber-300">
                              {(item.explanation.metadataScore * 100).toFixed(1)}%
                            </strong>
                          </div>
                          <div>
                            Provenance:{" "}
                            <strong className="text-emerald-400">
                              {item.explanation.provenanceVerified ? "VERIFIED" : "INCOMPLETE"}
                            </strong>
                          </div>
                        </div>
                        <div className="pt-1 text-[10px] text-slate-500">
                          Chunk ID: {item.chunkId} | Tokens: ~{item.tokenCount}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            !loading && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center text-xs text-slate-500">
                <Database className="mb-3 h-8 w-8 text-slate-600" />
                <p className="font-medium text-slate-400">No knowledge chunks retrieved yet.</p>
                <p className="mt-1 max-w-sm">
                  Configure your educational hierarchy, syllabus, and query on the left and click &quot;Search Knowledge&quot; to test retrieval.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
