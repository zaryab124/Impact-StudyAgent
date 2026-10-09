"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Book,
  Sparkles,
  Zap,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Play,
} from "lucide-react";
import { RouteGuard } from "@/components/auth/RouteGuard";

function PracticeContent() {
  const router = useRouter();

  const [subjects, setSubjects] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);

  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [questionCount, setQuestionCount] = useState(15);
  const [difficulty, setDifficulty] = useState<"EASY" | "BALANCED" | "DIFFICULT">("BALANCED");

  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subjects")
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.subjects) setSubjects(res.data.subjects);
      })
      .catch(() => {});
  }, []);

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
    setSelectedChapterId("");
    setChapters([]);
  }, [selectedSubjectId]);

  useEffect(() => {
    if (!selectedBookId) {
      setChapters([]);
      return;
    }
    fetch(`/api/books/${selectedBookId}/chapters`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.chapters) setChapters(res.data.chapters);
      });
  }, [selectedBookId]);

  const handleStartPractice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedSubjectId || !selectedBookId) {
      setError("Please choose a subject and prescribed book to begin practice.");
      return;
    }

    try {
      setStarting(true);
      const selSubj = subjects.find((s) => s.id === selectedSubjectId);
      const selBook = books.find((b) => b.id === selectedBookId);

      const chapterIds = selectedChapterId ? [selectedChapterId] : chapters.map((c) => c.id);

      const res = await fetch("/api/papers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId: "board-fed-01",
          classId: "class-9",
          subjectId: selectedSubjectId,
          bookId: selectedBookId,
          chapterIds,
          totalQuestions: questionCount,
          title: `Instant Practice: ${selSubj?.name || "Subject"} (${selBook?.title || "Textbook"})`,
          durationMinutes: 30,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to assemble practice session.");
      }

      const paper = data.data.paper;
      router.push(`/student/exam/${paper.id}`);
    } catch (err: any) {
      setError(err.message || "An error occurred starting the practice session.");
      setStarting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Zap className="h-4 w-4" />
          <span>Interactive Student Practice</span>
        </div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Instant Drill &amp; Practice</h1>
        <p className="mt-1 text-xs text-slate-400">
          Target specific textbook chapters or take a rapid diagnostic drill. Real-time scoring and explanations provided on completion.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-900/60 bg-rose-950/40 p-4 text-xs text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleStartPractice} className="space-y-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              1. Choose Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">-- Select Subject --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              2. Prescribed Textbook
            </label>
            <select
              disabled={!selectedSubjectId}
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none disabled:opacity-40"
            >
              <option value="">-- Select Textbook --</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} (v{b.version})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              3. Target Chapter (Optional — All Chapters if Unselected)
            </label>
            <select
              disabled={!selectedBookId}
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none disabled:opacity-40"
            >
              <option value="">-- All Prescribed Chapters --</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  Chapter {c.chapterNumber}: {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Questions Count
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              >
                <option value={10}>10 Questions (Quick ~15m)</option>
                <option value={15}>15 Questions (Standard ~25m)</option>
                <option value={20}>20 Questions (Extended ~35m)</option>
                <option value={30}>30 Questions (Full Paper ~50m)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Difficulty Focus
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="BALANCED">Balanced (~33% Easy/Med/Diff)</option>
                <option value="EASY">Foundational Focus (Easy)</option>
                <option value="DIFFICULT">Challenging Focus (Difficult)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={starting}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
          >
            {starting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Launching Practice Session...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>START PRACTICE NOW</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PracticePage() {
  return (
    <RouteGuard allowedRoles={["STUDENT", "ADMIN"]} portalName="Practice Drills">
      <PracticeContent />
    </RouteGuard>
  );
}
