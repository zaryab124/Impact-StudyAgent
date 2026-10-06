"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  GraduationCap,
  BookOpen,
  Book,
  ListTree,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Award,
  Zap,
  TrendingDown,
  Play,
  FileCheck2,
  Layers,
} from "lucide-react";

export default function StudentPage() {
  // Step selections for Curriculum Explorer
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedBookId, setSelectedBookId] = useState<string>("");

  // Data lists
  const [boards, setBoards] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);

  // Live Exam Data
  const [activeExams, setActiveExams] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // 1. Load Real Dashboard Stats & Exams
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoadingStats(true);
        const [examsRes, resultsRes] = await Promise.all([
          fetch("/api/exams").then((r) => r.json()).catch(() => ({})),
          fetch("/api/results").then((r) => r.json()).catch(() => ({})),
        ]);

        if (examsRes?.data?.activeExams) {
          setActiveExams(examsRes.data.activeExams);
        }
        if (resultsRes?.data?.results) {
          setRecentResults(resultsRes.data.results);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoadingStats(false);
      }
    }

    loadDashboardData();
  }, []);

  // 2. Load Boards on mount
  useEffect(() => {
    fetch("/api/boards")
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.boards) setBoards(res.data.boards);
      })
      .catch((err) => console.error("Error loading boards:", err));
  }, []);

  // 3. Load Academic Years when Board changes
  useEffect(() => {
    if (!selectedBoardId) {
      setAcademicYears([]);
      return;
    }
    fetch(`/api/academic-years?boardId=${selectedBoardId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.academicYears) setAcademicYears(res.data.academicYears);
      });
    setSelectedYearId("");
    setSelectedClassId("");
    setSelectedSubjectId("");
    setSelectedBookId("");
    setChapters([]);
  }, [selectedBoardId]);

  // 4. Load Classes when Academic Year changes
  useEffect(() => {
    if (!selectedYearId) {
      setClasses([]);
      return;
    }
    fetch(`/api/classes?academicYearId=${selectedYearId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.classes) setClasses(res.data.classes);
      });
    setSelectedClassId("");
    setSelectedSubjectId("");
    setSelectedBookId("");
    setChapters([]);
  }, [selectedYearId]);

  // 5. Load Subjects when Class changes
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
    setChapters([]);
  }, [selectedClassId]);

  // 6. Load Books when Subject changes
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
    setChapters([]);
  }, [selectedSubjectId]);

  // 7. Load Chapters when Book changes
  useEffect(() => {
    if (!selectedBookId) {
      setChapters([]);
      return;
    }
    setLoadingChapters(true);
    fetch(`/api/books/${selectedBookId}/chapters`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.chapters) setChapters(res.data.chapters);
      })
      .finally(() => setLoadingChapters(false));
  }, [selectedBookId]);

  const selectedBoard = boards.find((b) => b.id === selectedBoardId);
  const selectedYear = academicYears.find((y) => y.id === selectedYearId);
  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const selectedBook = books.find((b) => b.id === selectedBookId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-8 shadow-2xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Study Agent • Live Examination Portal</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Welcome Back, Candidate
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl">
              Your comprehensive examination preparation workspace. Generate live papers, practice target chapters, take timed exams, and analyze your diagnostic scorecards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/student/create-paper"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Create Paper</span>
            </Link>
            <Link
              href="/student/practice"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all"
            >
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Practice Drill</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Primary Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Card 1: My Exams */}
        <Link
          href="/student/exams"
          className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow transition-all hover:border-indigo-500/50 hover:bg-slate-900"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="rounded-lg bg-indigo-600/20 p-2.5 text-indigo-400 border border-indigo-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
          </div>
          <h2 className="text-sm font-bold text-white">My Exams</h2>
          <p className="mt-1 text-xs text-slate-400">
            {activeExams.length} Available Paper{activeExams.length === 1 ? "" : "s"} ready to take
          </p>
        </Link>

        {/* Card 2: Practice */}
        <Link
          href="/student/practice"
          className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow transition-all hover:border-amber-500/50 hover:bg-slate-900"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="rounded-lg bg-amber-500/20 p-2.5 text-amber-400 border border-amber-500/20">
              <Zap className="h-5 w-5" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
          </div>
          <h2 className="text-sm font-bold text-white">Practice</h2>
          <p className="mt-1 text-xs text-slate-400">
            Rapid chapter drills with instant feedback
          </p>
        </Link>

        {/* Card 3: Results */}
        <Link
          href="/student/results"
          className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow transition-all hover:border-emerald-500/50 hover:bg-slate-900"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="rounded-lg bg-emerald-500/20 p-2.5 text-emerald-400 border border-emerald-500/20">
              <Award className="h-5 w-5" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </div>
          <h2 className="text-sm font-bold text-white">Results</h2>
          <p className="mt-1 text-xs text-slate-400">
            {recentResults.length} Evaluated Scorecard{recentResults.length === 1 ? "" : "s"}
          </p>
        </Link>

        {/* Card 4: Weak Areas */}
        <Link
          href="/student/weak-areas"
          className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow transition-all hover:border-rose-500/50 hover:bg-slate-900"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="rounded-lg bg-rose-500/20 p-2.5 text-rose-400 border border-rose-500/20">
              <TrendingDown className="h-5 w-5" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-rose-400 transition-colors" />
          </div>
          <h2 className="text-sm font-bold text-white">Weak Areas</h2>
          <p className="mt-1 text-xs text-slate-400">
            Diagnostic chapter analytics &amp; study plan
          </p>
        </Link>
      </div>

      {/* Real Live Exams & Recent Results Grid */}
      <div className="grid gap-6 lg:grid-cols-2 mb-10">
        {/* Available Exams */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Available Exams
            </h2>
            <Link href="/student/exams" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
              View All ({activeExams.length})
            </Link>
          </div>

          {loadingStats ? (
            <p className="text-xs text-slate-500 py-4 animate-pulse">Loading available papers...</p>
          ) : activeExams.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No exams available yet. Create a paper using the generator.
            </p>
          ) : (
            <div className="space-y-3">
              {activeExams.slice(0, 3).map((paper) => (
                <div
                  key={paper.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 p-3.5"
                >
                  <div>
                    <h3 className="text-xs font-bold text-white">{paper.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {paper.paperCode} • {paper.totalMarks || 60} Marks • {paper.durationMinutes || 60}m
                    </p>
                  </div>

                  <Link
                    href={`/student/exam/${paper.id}`}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-500 shadow"
                  >
                    <Play className="h-3 w-3 fill-white" />
                    <span>Start</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Recent Results
            </h2>
            <Link href="/student/results" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
              View All ({recentResults.length})
            </Link>
          </div>

          {loadingStats ? (
            <p className="text-xs text-slate-500 py-4 animate-pulse">Loading recent scorecards...</p>
          ) : recentResults.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No results available yet. Complete an exam to view your scores.
            </p>
          ) : (
            <div className="space-y-3">
              {recentResults.slice(0, 3).map((res) => {
                const id = res.attemptId || res.id;
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 p-3.5"
                  >
                    <div>
                      <h3 className="text-xs font-bold text-white">{res.paperTitle}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Score: <strong className="text-white">{res.totalMarksObtained ?? res.obtainedMarks} / {res.totalMarksPossible ?? res.totalMarks}</strong> ({res.percentage}%) • Grade: <strong className="text-emerald-400">{res.grade}</strong>
                      </p>
                    </div>

                    <Link
                      href={`/student/results/${id}`}
                      className="inline-flex items-center gap-1 rounded-md border border-indigo-600/30 bg-indigo-600/10 px-3 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/20"
                    >
                      <span>Scorecard</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Curriculum Explorer Drilldown View */}
      <div className="border-t border-slate-800 pt-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            <span>Curriculum Explorer</span>
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Browse through authorized education boards, academic years, classes, and prescribed textbooks to inspect chapters and learning outcomes.
          </p>
        </div>

        {/* Breadcrumb Path Indicator */}
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-300">
          <span className="font-semibold text-slate-400">Scope:</span>
          <span className="text-indigo-400 font-medium">{selectedBoard?.name || "All Boards"}</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
          <span className="text-indigo-400 font-medium">{selectedYear?.code || "Session"}</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
          <span className="text-indigo-400 font-medium">{selectedClass?.name || "Class"}</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
          <span className="text-indigo-400 font-medium">{selectedSubject?.name || "Subject"}</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
          <span className="text-indigo-400 font-medium">
            {selectedBook ? `${selectedBook.title} (v${selectedBook.version})` : "Textbook"}
          </span>
        </div>

        {/* 5-Step Selection Matrix */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          {/* Step 1: Board */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <label className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1.5 mb-2">
              <Building2 className="h-3.5 w-3.5 text-indigo-400" />
              <span>1. Board</span>
            </label>
            <select
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              className="w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-2 text-xs text-white"
            >
              <option value="">-- Choose Board --</option>
              {boards.map((b) => (
                <option key={b.id || b.code} value={b.id || b.code}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Academic Year */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <label className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1.5 mb-2">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              <span>2. Session</span>
            </label>
            <select
              disabled={!selectedBoardId}
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-2 text-xs text-white disabled:opacity-40"
            >
              <option value="">-- Choose Session --</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.code} ({y.name})
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Class */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <label className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1.5 mb-2">
              <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
              <span>3. Class</span>
            </label>
            <select
              disabled={!selectedYearId}
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-2 text-xs text-white disabled:opacity-40"
            >
              <option value="">-- Choose Class --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Step 4: Subject */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <label className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1.5 mb-2">
              <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
              <span>4. Subject</span>
            </label>
            <select
              disabled={!selectedClassId}
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-2 text-xs text-white disabled:opacity-40"
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Step 5: Book */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <label className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1.5 mb-2">
              <Book className="h-3.5 w-3.5 text-indigo-400" />
              <span>5. Book</span>
            </label>
            <select
              disabled={!selectedSubjectId}
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-2 text-xs text-white disabled:opacity-40"
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

        {/* Chapters list if book selected */}
        {selectedBookId && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ListTree className="h-4 w-4 text-indigo-400" />
                <span>Textbook Chapters ({chapters.length})</span>
              </h3>
              <Link
                href="/student/create-paper"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                Use in Paper Generator &rarr;
              </Link>
            </div>

            {loadingChapters ? (
              <p className="text-xs text-slate-400 py-6 text-center">Loading chapter tree...</p>
            ) : chapters.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No chapters found for this book.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {chapters.map((ch) => (
                  <div
                    key={ch.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs"
                  >
                    <span className="font-mono text-[10px] text-indigo-400 font-bold mr-2">
                      Ch {ch.chapterNumber}
                    </span>
                    <span className="font-semibold text-slate-200">{ch.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
