"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  FileCheck,
  Search,
  Sliders,
  Sparkles,
  BookOpen,
  Eye,
  ShieldCheck,
  Archive,
  ChevronRight,
  GitBranch,
  HelpCircle,
  ListOrdered,
} from "lucide-react";
import {
  ExaminationBlueprint,
  BlueprintSection,
  BlueprintQuestionSlot,
  QuestionSpecification,
  BlueprintAllocationExplanation,
} from "@/types/blueprint";

export default function AdminBlueprintsPage() {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  // Hierarchy datasets
  const [boards, setBoards] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [syllabi, setSyllabi] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [blueprintsList, setBlueprintsList] = useState<ExaminationBlueprint[]>([]);

  // Selection states
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSyllabus, setSelectedSyllabus] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedPattern, setSelectedPattern] = useState("");

  // Configuration states
  const [title, setTitle] = useState("Annual Physics Examination Blueprint 2025");
  const [totalMarks, setTotalMarks] = useState(75);
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [easyPct, setEasyPct] = useState(33.33);
  const [mediumPct, setMediumPct] = useState(33.33);
  const [difficultPct, setDifficultPct] = useState(33.34);

  // Active blueprint preview
  const [activeBlueprint, setActiveBlueprint] = useState<ExaminationBlueprint | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "sections" | "slots" | "allocations" | "specifications" | "validation"
  >("overview");

  // Explanation drawer
  const [selectedSlotForExplanation, setSelectedSlotForExplanation] =
    useState<BlueprintAllocationExplanation | null>(null);
  const [specsList, setSpecsList] = useState<QuestionSpecification[]>([]);

  // Load Hierarchy Data
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [bRes, yRes, cRes, sRes, sylRes, bkRes, patRes, bpRes] = await Promise.all([
        fetch("/api/boards").then((r) => r.json()),
        fetch("/api/academic-years").then((r) => r.json()),
        fetch("/api/classes").then((r) => r.json()),
        fetch("/api/subjects").then((r) => r.json()),
        fetch("/api/syllabus").then((r) => r.json()),
        fetch("/api/books").then((r) => r.json()),
        fetch("/api/patterns").then((r) => r.json().catch(() => ({ data: [] }))),
        fetch("/api/blueprints").then((r) => r.json().catch(() => ({ data: [] }))),
      ]);

      if (bRes.data?.boards) setBoards(bRes.data.boards);
      if (yRes.data?.academicYears) setYears(yRes.data.academicYears);
      if (cRes.data?.classes) setClasses(cRes.data.classes);
      if (sRes.data?.subjects) setSubjects(sRes.data.subjects);
      if (sylRes.data?.syllabi) setSyllabi(sylRes.data.syllabi);
      if (bkRes.data?.books) setBooks(bkRes.data.books);
      if (patRes.data) setPatterns(Array.isArray(patRes.data) ? patRes.data : []);
      if (bpRes.data) {
        setBlueprintsList(Array.isArray(bpRes.data) ? bpRes.data : []);
        if (bpRes.data.length > 0 && !activeBlueprint) {
          setActiveBlueprint(bpRes.data[0]);
        }
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: `Data load failed: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered dropdowns
  const availableSyllabi = syllabi.filter(
    (s) =>
      (!selectedSubject || s.subjectId === selectedSubject) &&
      (!selectedClass || s.classId === selectedClass)
  );

  const availableBooks = books.filter(
    (b) =>
      (!selectedSubject || b.subjectId === selectedSubject) &&
      (!selectedClass || b.classId === selectedClass)
  );

  // Dynamically update blueprint title when Subject/Class changes
  useEffect(() => {
    if (selectedSubject) {
      const s = subjects.find((sub) => sub.id === selectedSubject);
      const c = classes.find((cls) => cls.id === selectedClass);
      const b = boards.find((brd) => brd.id === selectedBoard);
      const sName = s?.name || "Examination";
      const cName = c?.name ? ` (${c.name})` : "";
      const bCode = b?.code ? ` [${b.code}]` : "";
      setTitle(`${sName}${cName}${bCode} Blueprint 2025`);
    }
  }, [selectedSubject, selectedClass, selectedBoard, subjects, classes, boards]);

  // Auto-select first matching syllabus when subject/class changes
  useEffect(() => {
    if (availableSyllabi.length > 0) {
      if (!selectedSyllabus || !availableSyllabi.some((s) => s.id === selectedSyllabus)) {
        setSelectedSyllabus(availableSyllabi[0].id);
      }
    } else {
      setSelectedSyllabus("");
    }
  }, [selectedSubject, selectedClass, syllabi]);

  // Difficulty presets
  const applyDifficultyPreset = (easy: number, med: number, diff: number) => {
    setEasyPct(easy);
    setMediumPct(med);
    setDifficultPct(diff);
  };

  // Generate / Create Blueprint
  const handleGenerateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const payload = {
        boardId: selectedBoard || (boards[0]?.id || "board-fed-01"),
        academicYearId: selectedYear || (years[0]?.id || "year-2024-25"),
        classId: selectedClass || (classes[0]?.id || "class-grade-9"),
        subjectId: selectedSubject || (subjects[0]?.id || "sub-phy-9"),
        syllabusId: selectedSyllabus || (availableSyllabi[0]?.id || "syl-verified-curriculum"),
        bookId: selectedBook || (availableBooks[0]?.id || undefined),
        patternId: selectedPattern || undefined,
        title: title.trim() || "Annual Examination Blueprint 2025",
        totalMarks: Number(totalMarks),
        durationMinutes: Number(durationMinutes),
        requestedDifficultyDistribution: {
          easyPct: Number(easyPct),
          mediumPct: Number(mediumPct),
          difficultPct: Number(difficultPct),
        },
      };

      const res = await fetch("/api/blueprints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "ADMIN",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to generate examination blueprint.");
      }

      const created = json.data;
      setActiveBlueprint(created);
      setBlueprintsList((prev) => [created, ...prev.filter((b) => b.id !== created.id)]);
      setFeedback({
        type: "success",
        message: `Blueprint "${created.title}" (${created.version}) created and mathematically validated!`,
      });
      loadInitialData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Lifecycle actions
  const handleReview = async () => {
    if (!activeBlueprint) return;
    try {
      const res = await fetch(`/api/blueprints/${activeBlueprint.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": "ADMIN" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Review transition failed");
      const updated = json.data;
      setActiveBlueprint(updated);
      setBlueprintsList((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setFeedback({ type: "success", message: "Blueprint transitioned to UNDER_REVIEW." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleApprove = async () => {
    if (!activeBlueprint) return;
    try {
      const res = await fetch(`/api/blueprints/${activeBlueprint.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": "ADMIN" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Approval failed");
      const updated = json.data;
      setActiveBlueprint(updated);
      setBlueprintsList((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setFeedback({ type: "success", message: "Blueprint APPROVED! Ready for Phase 8 generation." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleCreateNewVersion = async () => {
    if (!activeBlueprint) return;
    try {
      const res = await fetch(`/api/blueprints/${activeBlueprint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-role": "ADMIN" },
        body: JSON.stringify({
          title: `${activeBlueprint.title} (Revised)`,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Version creation failed");
      const nextBp = json.data.blueprint || json.data;
      setActiveBlueprint(nextBp);
      setBlueprintsList((prev) => [nextBp, ...prev.filter((b) => b.id !== nextBp.id)]);
      setFeedback({
        type: "success",
        message: `Created new blueprint version ${nextBp.version}!`,
      });
      loadInitialData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleArchive = async () => {
    if (!activeBlueprint) return;
    try {
      const res = await fetch(`/api/blueprints/${activeBlueprint.id}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": "ADMIN" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Archive failed");
      const updated = json.data;
      setActiveBlueprint(updated);
      setBlueprintsList((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setFeedback({ type: "warning", message: "Blueprint ARCHIVED." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  // Generate question specifications
  const handleGenerateSpecifications = async () => {
    if (!activeBlueprint) return;
    setLoading(true);
    try {
      const res = await fetch("/api/question-specifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": "ADMIN" },
        body: JSON.stringify({ blueprintId: activeBlueprint.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to generate question specifications.");
      setSpecsList(json.data);
      setActiveTab("specifications");
      setFeedback({
        type: "success",
        message: `Generated ${json.data.length} QuestionSpecifications for future Phase 8 generation!`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Admin Dashboard</span>
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl flex items-center gap-2.5">
            <Layers className="h-7 w-7 text-amber-400" />
            <span>Examination Blueprint &amp; Question Intelligence</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Phase 7: Transforms syllabus weightages, textbook structures, and observed exam patterns into deterministic, audited paper blueprints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/retrieval"
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-600/20 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-600/30 transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span>RAG Retrieval</span>
          </Link>
          <button
            onClick={loadInitialData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`mb-6 flex items-center gap-2 rounded-lg p-3.5 text-xs font-medium border ${
            feedback.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
              : feedback.type === "warning"
              ? "bg-amber-950/40 border-amber-500/50 text-amber-300"
              : "bg-rose-950/40 border-rose-500/50 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : feedback.type === "warning" ? (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Grid: Generator Controls (Left 4 cols) vs Blueprint Details (Right 8 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Configuration & Generator Form */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleGenerateBlueprint}
            className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl backdrop-blur space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-400" />
                <span>Blueprint Parameters</span>
              </h2>
              <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300 border border-amber-500/20">
                Phase 7 Engine
              </span>
            </div>

            {/* Hierarchy Selectors */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  1. Examination Board
                </label>
                <select
                  value={selectedBoard}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Select Board (or Default Federal)</option>
                  {boards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    2. Academic Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Select Session</option>
                    {years.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name || y.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    3. Grade / Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  4. Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>5. Official Syllabus</span>
                  <span className="text-[10px] text-teal-400">Hard Gate Precedence</span>
                </label>
                <select
                  value={selectedSyllabus}
                  onChange={(e) => setSelectedSyllabus(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="">
                    {availableSyllabi.length > 0
                      ? "Select Verified Syllabus (or Default)"
                      : "Standard Verified Syllabus (Auto-Selected)"}
                  </option>
                  {availableSyllabi.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title || "Syllabus"} ({s.version}) [{s.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    6. Authorized Book
                  </label>
                  <select
                    value={selectedBook}
                    onChange={(e) => setSelectedBook(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Select Textbook</option>
                    {availableBooks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    7. Sample Pattern
                  </label>
                  <select
                    value={selectedPattern}
                    onChange={(e) => setSelectedPattern(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Select Exam Pattern</option>
                    {patterns.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.totalMarks}m)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Paper Specs: Title, Marks, Duration */}
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Blueprint Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    min={10}
                    max={200}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    min={30}
                    max={300}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Target Difficulty Allocation Controls */}
            <div className="border-t border-slate-800 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-300">
                  Difficulty Target Ratio
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => applyDifficultyPreset(33.33, 33.33, 33.34)}
                    className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                  >
                    33/33/33
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDifficultyPreset(40, 40, 20)}
                    className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                  >
                    40/40/20
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDifficultyPreset(25, 50, 25)}
                    className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                  >
                    25/50/25
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded bg-emerald-950/30 border border-emerald-500/20 p-1.5">
                  <div className="text-[10px] text-emerald-400 font-medium">Easy %</div>
                  <input
                    type="number"
                    value={easyPct}
                    onChange={(e) => setEasyPct(Number(e.target.value))}
                    className="w-full text-center bg-transparent text-white font-bold text-xs"
                    step="0.1"
                  />
                </div>
                <div className="rounded bg-amber-950/30 border border-amber-500/20 p-1.5">
                  <div className="text-[10px] text-amber-400 font-medium">Medium %</div>
                  <input
                    type="number"
                    value={mediumPct}
                    onChange={(e) => setMediumPct(Number(e.target.value))}
                    className="w-full text-center bg-transparent text-white font-bold text-xs"
                    step="0.1"
                  />
                </div>
                <div className="rounded bg-rose-950/30 border border-rose-500/20 p-1.5">
                  <div className="text-[10px] text-rose-400 font-medium">Difficult %</div>
                  <input
                    type="number"
                    value={difficultPct}
                    onChange={(e) => setDifficultPct(Number(e.target.value))}
                    className="w-full text-center bg-transparent text-white font-bold text-xs"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 text-xs transition-colors shadow-lg shadow-amber-500/10"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate Examination Blueprint</span>
            </button>
          </form>

          {/* Existing Blueprints List */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
              <span>Saved Blueprints ({blueprintsList.length})</span>
              <ListOrdered className="h-3.5 w-3.5 text-slate-400" />
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {blueprintsList.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500">
                  No blueprints generated yet.
                </div>
              ) : (
                blueprintsList.map((bp) => (
                  <button
                    key={bp.id}
                    onClick={() => setActiveBlueprint(bp)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex items-center justify-between ${
                      activeBlueprint?.id === bp.id
                        ? "border-amber-500/60 bg-amber-500/10 text-white"
                        : "border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="font-medium line-clamp-1">{bp.title}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{bp.version}</span>
                        <span>•</span>
                        <span>{bp.totalMarks} Marks</span>
                        <span>•</span>
                        <span>{bp.slots?.length || 0} Slots</span>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        bp.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : bp.status === "VALIDATED"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : bp.status === "UNDER_REVIEW"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {bp.status}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Blueprint Active View & Panels */}
        <div className="lg:col-span-8 space-y-6">
          {activeBlueprint ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl space-y-6">
              {/* Header Status Bar & Lifecycle Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">{activeBlueprint.version}</span>
                    <span className="text-slate-600">•</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                        activeBlueprint.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : activeBlueprint.status === "VALIDATED"
                          ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                          : activeBlueprint.status === "UNDER_REVIEW"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-slate-700/50 text-slate-300 border-slate-600"
                      }`}
                    >
                      {activeBlueprint.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">{activeBlueprint.title}</h2>
                  <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap gap-x-3">
                    <span>Grand Total: <strong>{activeBlueprint.totalMarks} Marks</strong></span>
                    <span>Duration: <strong>{activeBlueprint.durationMinutes} mins</strong></span>
                    <span>Sections: <strong>{activeBlueprint.sections.length}</strong></span>
                    <span>Slots: <strong>{activeBlueprint.slots.length}</strong></span>
                  </div>
                </div>

                {/* Workflow Buttons */}
                <div className="flex flex-wrap gap-2">
                  {activeBlueprint.status === "DRAFT" && (
                    <button
                      onClick={handleReview}
                      className="px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/20 text-amber-300 text-xs font-semibold hover:bg-amber-500/30"
                    >
                      Submit for Review
                    </button>
                  )}
                  {(activeBlueprint.status === "UNDER_REVIEW" || activeBlueprint.status === "VALIDATED") && (
                    <button
                      onClick={handleApprove}
                      className="px-3 py-1.5 rounded-lg border border-emerald-500/50 bg-emerald-600/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-600/40 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Approve Blueprint</span>
                    </button>
                  )}
                  {activeBlueprint.status === "APPROVED" && (
                    <button
                      onClick={handleCreateNewVersion}
                      className="px-3 py-1.5 rounded-lg border border-blue-500/40 bg-blue-600/20 text-blue-300 text-xs font-semibold hover:bg-blue-600/30 flex items-center gap-1.5"
                    >
                      <GitBranch className="h-3.5 w-3.5" />
                      <span>New Version</span>
                    </button>
                  )}
                  {activeBlueprint.status !== "ARCHIVED" && (
                    <button
                      onClick={handleArchive}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-1 border-b border-slate-800 pb-2 text-xs font-medium">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    activeTab === "overview"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Overview &amp; Distributions
                </button>
                <button
                  onClick={() => setActiveTab("sections")}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    activeTab === "sections"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Sections ({activeBlueprint.sections.length})
                </button>
                <button
                  onClick={() => setActiveTab("slots")}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    activeTab === "slots"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Question Slots ({activeBlueprint.slots.length})
                </button>
                <button
                  onClick={() => setActiveTab("allocations")}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    activeTab === "allocations"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Chapter Weightages
                </button>
                <button
                  onClick={() => setActiveTab("specifications")}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    activeTab === "specifications"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Question Contracts ({specsList.length})
                </button>
                <button
                  onClick={() => setActiveTab("validation")}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    activeTab === "validation"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Audit Report ({activeBlueprint.validationReport?.errors.length || 0})
                </button>
              </div>

              {/* TAB 1: OVERVIEW & 4 SEPARATE PANELS (Requirement 23) */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Pattern Conflict Warning if present */}
                  {activeBlueprint.patternConflicts && activeBlueprint.patternConflicts.length > 0 && (
                    <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 p-3.5 text-xs text-amber-300">
                      <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-200">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Pattern-Syllabus Conflicts Detected &amp; Resolved</span>
                      </div>
                      <ul className="list-disc pl-5 space-y-1">
                        {activeBlueprint.patternConflicts.map((c) => (
                          <li key={c.id}>
                            <strong>{c.entityType} &quot;{c.entityTitle}&quot;:</strong> {c.patternObservation}, but {c.syllabusStatus}. <em>{c.resolution}</em>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 4 DISTINCT PANELS (DO NOT MERGE) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PANEL 1: CURRICULUM WEIGHTAGE */}
                    <div className="rounded-lg border border-teal-500/30 bg-teal-950/20 p-4">
                      <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>1. Curriculum Weightage</span>
                        <span className="text-[10px] text-teal-300 font-mono">Official Syllabus</span>
                      </h4>
                      <div className="space-y-1 text-xs text-slate-300">
                        {activeBlueprint.coverageAllocation?.chapters.map((ch) => (
                          <div key={ch.chapterId} className="flex justify-between py-0.5 border-b border-teal-500/10">
                            <span className="line-clamp-1">{ch.chapterTitle}</span>
                            <span className="font-mono text-teal-300">{ch.curriculumWeightage || 10}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* PANEL 2: OBSERVED PATTERN */}
                    <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 p-4">
                      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>2. Observed Sample Pattern</span>
                        <span className="text-[10px] text-purple-300 font-mono">Historical Papers</span>
                      </h4>
                      <div className="space-y-1 text-xs text-slate-300">
                        <div className="flex justify-between py-0.5 border-b border-purple-500/10">
                          <span>Observed Easy Ratio:</span>
                          <span className="font-mono text-purple-300">
                            {activeBlueprint.difficultyComparison?.observedSampleDistribution?.easyPct || 40}%
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-purple-500/10">
                          <span>Observed Medium Ratio:</span>
                          <span className="font-mono text-purple-300">
                            {activeBlueprint.difficultyComparison?.observedSampleDistribution?.mediumPct || 35}%
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-purple-500/10">
                          <span>Observed Difficult Ratio:</span>
                          <span className="font-mono text-purple-300">
                            {activeBlueprint.difficultyComparison?.observedSampleDistribution?.difficultPct || 25}%
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-purple-500/10">
                          <span>Pattern Model:</span>
                          <span className="font-mono text-purple-300">
                            {activeBlueprint.sourcePatternId ? "Linked Phase 5 Pattern" : "Standard Model"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* PANEL 3: REQUESTED TARGET */}
                    <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-4">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>3. Requested User Target</span>
                        <span className="text-[10px] text-blue-300 font-mono">Exam Policy Input</span>
                      </h4>
                      <div className="space-y-1 text-xs text-slate-300">
                        <div className="flex justify-between py-0.5 border-b border-blue-500/10">
                          <span>Requested Total Marks:</span>
                          <span className="font-mono text-blue-300">{activeBlueprint.totalMarks}</span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-blue-500/10">
                          <span>Target Easy %:</span>
                          <span className="font-mono text-blue-300">
                            {activeBlueprint.difficultyComparison?.requestedTargetDistribution.easyPct}%
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-blue-500/10">
                          <span>Target Medium %:</span>
                          <span className="font-mono text-blue-300">
                            {activeBlueprint.difficultyComparison?.requestedTargetDistribution.mediumPct}%
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-blue-500/10">
                          <span>Target Difficult %:</span>
                          <span className="font-mono text-blue-300">
                            {activeBlueprint.difficultyComparison?.requestedTargetDistribution.difficultPct}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* PANEL 4: BLUEPRINT ALLOCATION */}
                    <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>4. Final Blueprint Allocation</span>
                        <span className="text-[10px] text-amber-300 font-mono">Discrete Integer Result</span>
                      </h4>
                      <div className="space-y-1 text-xs text-slate-300">
                        <div className="flex justify-between py-0.5 border-b border-amber-500/10">
                          <span>Allocated Easy Marks:</span>
                          <span className="font-mono text-emerald-400 font-bold">
                            {activeBlueprint.difficultyComparison?.finalBlueprintDistribution.easyMarks} marks (
                            {activeBlueprint.difficultyComparison?.finalBlueprintDistribution.easyPct}%)
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-amber-500/10">
                          <span>Allocated Medium Marks:</span>
                          <span className="font-mono text-amber-400 font-bold">
                            {activeBlueprint.difficultyComparison?.finalBlueprintDistribution.mediumMarks} marks (
                            {activeBlueprint.difficultyComparison?.finalBlueprintDistribution.mediumPct}%)
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-amber-500/10">
                          <span>Allocated Difficult Marks:</span>
                          <span className="font-mono text-rose-400 font-bold">
                            {activeBlueprint.difficultyComparison?.finalBlueprintDistribution.difficultMarks} marks (
                            {activeBlueprint.difficultyComparison?.finalBlueprintDistribution.difficultPct}%)
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-amber-500/10">
                          <span>Arithmetic Check:</span>
                          <span className="font-mono text-emerald-400 font-bold">EXACT {activeBlueprint.totalMarks} MARKS</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reconciliation Explanation */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400">
                    <strong className="text-white">Deterministic Reconciliation Trace:</strong>{" "}
                    {activeBlueprint.difficultyComparison?.reconciliationExplanation}
                  </div>
                </div>
              )}

              {/* TAB 2: SECTIONS TABLE */}
              {activeTab === "sections" && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Order</th>
                          <th className="p-3">Section Name</th>
                          <th className="p-3">Question Types</th>
                          <th className="p-3">Questions</th>
                          <th className="p-3">Marks/Q</th>
                          <th className="p-3">Choice Rule</th>
                          <th className="p-3">Obtainable Marks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {activeBlueprint.sections.map((sec) => (
                          <tr key={sec.id} className="hover:bg-slate-800/40">
                            <td className="p-3 font-bold text-slate-400">#{sec.sectionOrder}</td>
                            <td className="p-3 font-medium text-white">{sec.sectionName}</td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {sec.questionTypes.map((t) => (
                                  <span key={t} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-amber-300">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-3 font-mono">{sec.questionCount}</td>
                            <td className="p-3 font-mono">{sec.marksPerQuestion}m</td>
                            <td className="p-3">
                              <span className="rounded bg-blue-950 text-blue-300 px-2 py-0.5 text-[10px] font-mono">
                                {sec.choiceRule?.type || "NO_CHOICE"}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-emerald-400 font-mono">
                              {sec.maximumObtainableMarks} Marks
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: QUESTION SLOTS TABLE */}
              {activeTab === "slots" && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">Section</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">Marks</th>
                          <th className="p-2.5">Difficulty</th>
                          <th className="p-2.5">Cognitive</th>
                          <th className="p-2.5">Chapter &amp; Topic</th>
                          <th className="p-2.5">Audit Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {activeBlueprint.slots.map((slot) => (
                          <tr key={slot.id} className="hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-slate-400">#{slot.sequence}</td>
                            <td className="p-2.5 font-medium text-slate-300">{slot.sectionName}</td>
                            <td className="p-2.5">
                              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-amber-300">
                                {slot.questionType}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono">{slot.marks}m</td>
                            <td className="p-2.5">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  slot.targetDifficulty === "EASY"
                                    ? "bg-emerald-950 text-emerald-400 border border-emerald-500/20"
                                    : slot.targetDifficulty === "MEDIUM"
                                    ? "bg-amber-950 text-amber-400 border border-amber-500/20"
                                    : "bg-rose-950 text-rose-400 border border-rose-500/20"
                                }`}
                              >
                                {slot.targetDifficulty}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <span className="rounded bg-indigo-950/60 text-indigo-300 px-1.5 py-0.5 text-[10px]">
                                {slot.cognitiveLevel}
                              </span>
                            </td>
                            <td className="p-2.5 max-w-xs">
                              <div className="font-medium text-white truncate">{slot.chapterTitle}</div>
                              <div className="text-[10px] text-slate-400 truncate">{slot.topicTitle}</div>
                            </td>
                            <td className="p-2.5">
                              <button
                                onClick={async () => {
                                  // Fetch factual explanation
                                  const exp = await fetch(`/api/blueprints/${activeBlueprint.id}/slots`)
                                    .then((r) => r.json())
                                    .then(() => {
                                      // Render local explanation
                                      setSelectedSlotForExplanation({
                                        slotSequence: slot.sequence,
                                        sectionName: slot.sectionName,
                                        marks: slot.marks,
                                        questionType: slot.questionType,
                                        difficulty: slot.targetDifficulty,
                                        cognitiveLevel: slot.cognitiveLevel,
                                        chapter: {
                                          id: slot.chapterId,
                                          title: slot.chapterTitle,
                                          reason: `Selected to fulfill curriculum quota in ${activeBlueprint.syllabusTitle || "syllabus"}.`,
                                        },
                                        topic: {
                                          id: slot.topicId,
                                          title: slot.topicTitle,
                                          reason: `Verified ELIGIBLE textbook concept grounded in page citations.`,
                                        },
                                        weightageEvidence: {
                                          targetAllocationMarks: slot.marks,
                                        },
                                        retrievalExpectation: `Query: "${slot.topicTitle}" seeking [${slot.retrievalRequirements.knowledgeTypes.join(
                                          ", "
                                        )}] chunks.`,
                                      });
                                    });
                                }}
                                className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-700"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Why this?</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Explanation Modal / Drawer */}
                  {selectedSlotForExplanation && (
                    <div className="rounded-xl border border-amber-500/40 bg-slate-950 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                          <HelpCircle className="h-4 w-4" />
                          <span>Factual Allocation Evidence: Slot #{selectedSlotForExplanation.slotSequence}</span>
                        </div>
                        <button
                          onClick={() => setSelectedSlotForExplanation(null)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          ✕ Close
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1.5">
                          <div>
                            <span className="text-slate-400">Chapter Rationale:</span>
                            <p className="text-slate-200 font-medium">
                              {selectedSlotForExplanation.chapter.title} — {selectedSlotForExplanation.chapter.reason}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400">Topic Rationale:</span>
                            <p className="text-slate-200 font-medium">
                              {selectedSlotForExplanation.topic.title} — {selectedSlotForExplanation.topic.reason}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div>
                            <span className="text-slate-400">Cognitive &amp; Difficulty Grounding:</span>
                            <p className="text-slate-200 font-medium">
                              {selectedSlotForExplanation.cognitiveLevel} cognitive level for {selectedSlotForExplanation.difficulty} difficulty ({selectedSlotForExplanation.questionType}).
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400">Phase 6 Retrieval Grounding:</span>
                            <p className="text-cyan-300 font-mono text-[11px]">
                              {selectedSlotForExplanation.retrievalExpectation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CHAPTER WEIGHTAGES & COVERAGE */}
              {activeTab === "allocations" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {activeBlueprint.coverageAllocation?.chapters.map((ch) => (
                      <div key={ch.chapterId} className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                        <div className="font-bold text-white text-xs">{ch.chapterTitle}</div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Allocated Marks:</span>
                          <span className="text-amber-400 font-bold font-mono">{ch.marks} Marks ({ch.percentage}%)</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Question Slots:</span>
                          <span className="font-mono text-slate-200">{ch.questionCount}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400 space-y-1">
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Allocated Topics:</div>
                          {ch.topicAllocations.map((top) => (
                            <div key={top.topicId} className="flex justify-between text-[11px]">
                              <span className="truncate max-w-[160px] text-slate-300">{top.topicTitle}</span>
                              <span className="font-mono text-emerald-400 text-[10px]">{top.marks}m</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: QUESTION SPECIFICATIONS (PHASE 8 CONTRACT) */}
              {activeTab === "specifications" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white">QuestionSpecification Contracts</h3>
                      <p className="text-[11px] text-slate-400">
                        Formal contracts for Phase 8 generation (does NOT generate question text).
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateSpecifications}
                      disabled={loading}
                      className="flex items-center gap-1.5 rounded-lg border border-indigo-500/50 bg-indigo-600/30 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/40"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{specsList.length > 0 ? "Regenerate Contracts" : "Generate Specifications"}</span>
                    </button>
                  </div>

                  {specsList.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-400">
                      No question specifications generated yet. Click &quot;Generate Specifications&quot; to create the Phase 8 contract.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {specsList.map((spec) => (
                        <div key={spec.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">
                              Slot #{spec.sequenceNumber} ({spec.sectionName}) — {spec.questionType} ({spec.marks} Marks)
                            </span>
                            <span className="rounded bg-indigo-950 text-indigo-300 px-2 py-0.5 text-[10px] font-mono">
                              {spec.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-400 text-[11px]">
                            <div>Difficulty: <strong className="text-slate-200">{spec.difficulty}</strong></div>
                            <div>Cognitive: <strong className="text-slate-200">{spec.cognitiveLevel}</strong></div>
                            <div>Depth: <strong className="text-slate-200">{spec.answerDepth}</strong></div>
                            <div>Evidence Req: <strong className="text-slate-200">{spec.requiredEvidenceCount} Chunks</strong></div>
                          </div>
                          <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400">
                            <strong>Phase 6 Retrieval Query:</strong>{" "}
                            <span className="text-cyan-300 font-mono">{spec.retrievalQuery}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            <strong>Constraints ({spec.constraints.length}):</strong>
                            <ul className="list-disc pl-5 text-[10px] text-slate-400 space-y-0.5 mt-1">
                              {spec.constraints.slice(0, 3).map((con, idx) => (
                                <li key={idx}>{con}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: VALIDATION AUDIT REPORT */}
              {activeTab === "validation" && (
                <div className="space-y-4">
                  <div
                    className={`rounded-xl border p-4 text-xs ${
                      activeBlueprint.validationReport?.isValid
                        ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-300"
                        : "border-rose-500/40 bg-rose-950/20 text-rose-300"
                    }`}
                  >
                    <div className="font-bold text-sm flex items-center gap-2 mb-2">
                      {activeBlueprint.validationReport?.isValid ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          <span>Blueprint Validation Passed (0 Errors)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-rose-400" />
                          <span>Validation Failed ({activeBlueprint.validationReport?.errors.length} Errors)</span>
                        </>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
                      <div>Marks Arithmetic: <strong>{activeBlueprint.validationReport?.isMarksArithmeticValid ? "PASS" : "FAIL"}</strong></div>
                      <div>Hierarchy Check: <strong>{activeBlueprint.validationReport?.isHierarchyValid ? "PASS" : "FAIL"}</strong></div>
                      <div>Difficulty Valid: <strong>{activeBlueprint.validationReport?.isDifficultyValid ? "PASS" : "FAIL"}</strong></div>
                      <div>Coverage Valid: <strong>{activeBlueprint.validationReport?.isCoverageValid ? "PASS" : "FAIL"}</strong></div>
                    </div>

                    {activeBlueprint.validationReport?.errors && activeBlueprint.validationReport.errors.length > 0 && (
                      <div className="space-y-1">
                        <strong className="text-rose-200">Errors:</strong>
                        <ul className="list-disc pl-5 text-rose-200">
                          {activeBlueprint.validationReport.errors.map((e, idx) => (
                            <li key={idx}>{e}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {activeBlueprint.validationReport?.warnings && activeBlueprint.validationReport.warnings.length > 0 && (
                      <div className="space-y-1 mt-3">
                        <strong className="text-amber-300">Warnings:</strong>
                        <ul className="list-disc pl-5 text-amber-300 text-[11px]">
                          {activeBlueprint.validationReport.warnings.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-500 text-xs">
              Select or generate a blueprint to preview its sections, slots, and distributions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
