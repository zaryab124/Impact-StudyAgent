"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  GraduationCap,
  BookOpen,
  Book,
  ListTree,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { calculateDifficultyDistribution } from "@/lib/blueprint/calculator";

export default function CreatePaperPage() {
  const router = useRouter();

  // Selections
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [totalQuestions, setTotalQuestions] = useState<number>(30);
  const [paperTitle, setPaperTitle] = useState<string>("");

  // Data lists
  const [boards, setBoards] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);

  // State
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Difficulty calculation
  const distribution = calculateDifficultyDistribution(totalQuestions > 0 ? totalQuestions : 1);

  // 1. Load Boards
  useEffect(() => {
    fetch("/api/boards")
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.boards) setBoards(res.data.boards);
      })
      .catch((err) => console.error("Error loading boards:", err));
  }, []);

  // 2. Load Classes when Board changes
  useEffect(() => {
    if (!selectedBoardId) {
      setClasses([]);
      return;
    }
    fetch("/api/classes")
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.classes) setClasses(res.data.classes);
      });
    setSelectedClassId("");
    setSelectedSubjectId("");
    setSelectedBookId("");
    setSelectedChapterIds([]);
    setChapters([]);
  }, [selectedBoardId]);

  // 3. Load Subjects when Class changes
  useEffect(() => {
    if (!selectedClassId) {
      setSubjects([]);
      return;
    }
    fetch(`/api/subjects?classId=${selectedClassId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.subjects) setSubjects(res.data.subjects);
      });
    setSelectedSubjectId("");
    setSelectedBookId("");
    setSelectedChapterIds([]);
    setChapters([]);
  }, [selectedClassId]);

  // 4. Load Books when Subject changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setBooks([]);
      return;
    }
    fetch(`/api/books?subjectId=${selectedSubjectId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.books) setBooks(res.data.books);
      });
    setSelectedBookId("");
    setSelectedChapterIds([]);
    setChapters([]);
  }, [selectedSubjectId]);

  // 5. Load Chapters when Book changes
  useEffect(() => {
    if (!selectedBookId) {
      setChapters([]);
      setSelectedChapterIds([]);
      return;
    }
    setLoadingChapters(true);
    fetch(`/api/books/${selectedBookId}/chapters`)
      .then((r) => r.json())
      .then((res) => {
        const chaps = res.data?.chapters || [];
        setChapters(chaps);
        // Default select all eligible chapters
        setSelectedChapterIds(chaps.map((c: any) => c.id));
      })
      .catch(() => setChapters([]))
      .finally(() => setLoadingChapters(false));
  }, [selectedBookId]);

  const toggleChapter = (chapterId: string) => {
    setSelectedChapterIds((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const handleSelectAllChapters = () => {
    if (selectedChapterIds.length === chapters.length) {
      setSelectedChapterIds([]);
    } else {
      setSelectedChapterIds(chapters.map((c) => c.id));
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedBoardId || !selectedClassId || !selectedSubjectId || !selectedBookId) {
      setError("Please complete all curriculum hierarchy selections (Board, Class, Subject, Book).");
      return;
    }

    if (selectedChapterIds.length === 0) {
      setError("Please select at least one chapter to generate questions from.");
      return;
    }

    try {
      setGenerating(true);

      const selSubject = subjects.find((s) => s.id === selectedSubjectId);
      const selBook = books.find((b) => b.id === selectedBookId);
      const title = paperTitle.trim() || `${selSubject?.name || "Exam"} Practice Paper - ${selBook?.title || ""}`;

      const res = await fetch("/api/papers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId: selectedBoardId,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          bookId: selectedBookId,
          chapterIds: selectedChapterIds,
          totalQuestions,
          difficultyDistribution: {
            easy: distribution.percentageSummary.easyPct,
            medium: distribution.percentageSummary.mediumPct,
            difficult: distribution.percentageSummary.difficultPct,
          },
          title,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to generate examination paper.");
      }

      const paper = data.data.paper;
      router.push(`/student/paper/${paper.id}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during paper generation.");
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Sparkles className="h-4 w-4" />
          <span>Automated Examination Studio</span>
        </div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Create Examination Paper</h1>
        <p className="mt-1 text-xs text-slate-400">
          Configure curriculum parameters, select eligible textbook chapters, and assemble a live examination grounded in authoritative syllabus content.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-900/60 bg-rose-950/40 p-4 text-xs text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <span className="font-bold">Generation Error: </span>
            {error}
          </div>
        </div>
      )}

      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Step 1: Education Hierarchy */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-400" />
            <span>1. Curriculum Hierarchy</span>
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Board */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Board
              </label>
              <select
                value={selectedBoardId}
                onChange={(e) => setSelectedBoardId(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- Choose Board --</option>
                {boards.map((b) => (
                  <option key={b.id || b.code} value={b.id || b.code}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Class / Grade
              </label>
              <select
                disabled={!selectedBoardId}
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none disabled:opacity-40"
              >
                <option value="">-- Choose Class --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Subject
              </label>
              <select
                disabled={!selectedClassId}
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none disabled:opacity-40"
              >
                <option value="">-- Choose Subject --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Book */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Prescribed Book
              </label>
              <select
                disabled={!selectedSubjectId}
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none disabled:opacity-40"
              >
                <option value="">-- Choose Book --</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} (v{b.version})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Syllabus-Aware Chapter Selection */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ListTree className="h-4 w-4 text-indigo-400" />
              <span>2. Eligible Chapters ({selectedChapterIds.length} Selected)</span>
            </h2>

            {chapters.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllChapters}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                {selectedChapterIds.length === chapters.length ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>

          {!selectedBookId ? (
            <p className="text-xs text-slate-500 italic py-4">
              Select a book version above to load curriculum chapters.
            </p>
          ) : loadingChapters ? (
            <p className="text-xs text-slate-400 py-4 animate-pulse">Loading textbook chapters...</p>
          ) : chapters.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">
              No registered chapters found for this book. Questions will be synthesized from general subject concepts.
            </p>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {chapters.map((ch) => {
                const isSelected = selectedChapterIds.includes(ch.id);
                return (
                  <label
                    key={ch.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                      isSelected
                        ? "border-indigo-500/60 bg-indigo-950/30 text-white"
                        : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleChapter(ch.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-slate-200">
                        Chapter {ch.chapterNumber}: {ch.title}
                      </div>
                      {ch.topics && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {ch.topics.length} topic(s)
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 3: Paper Configuration */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-indigo-400" />
            <span>3. Paper Configuration</span>
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Paper Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Paper Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Midterm Comprehensive Assessment"
                value={paperTitle}
                onChange={(e) => setPaperTitle(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Questions count */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Number of Questions
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Math.max(5, parseInt(e.target.value) || 5))}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Difficulty Allocation Breakdown */}
          <div className="mt-6 border-t border-slate-800 pt-5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Deterministic Difficulty Distribution (~33% Rule)
            </label>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-3">
                <span className="text-[11px] font-semibold text-emerald-400">Easy</span>
                <div className="text-lg font-bold text-white mt-0.5">{distribution.easy} Qs</div>
                <span className="text-[10px] text-slate-400">{distribution.percentageSummary.easyPct}%</span>
              </div>

              <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-3">
                <span className="text-[11px] font-semibold text-amber-400">Medium</span>
                <div className="text-lg font-bold text-white mt-0.5">{distribution.medium} Qs</div>
                <span className="text-[10px] text-slate-400">{distribution.percentageSummary.mediumPct}%</span>
              </div>

              <div className="rounded-lg border border-rose-900/50 bg-rose-950/20 p-3">
                <span className="text-[11px] font-semibold text-rose-400">Difficult</span>
                <div className="text-lg font-bold text-white mt-0.5">{distribution.difficult} Qs</div>
                <span className="text-[10px] text-slate-400">{distribution.percentageSummary.difficultPct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={generating}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
          >
            {generating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Generating Paper via Live RAG Pipeline...</span>
              </>
            ) : (
              <>
                <span>GENERATE PAPER</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
