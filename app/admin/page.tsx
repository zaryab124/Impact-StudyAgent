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
  FileCode2,
  FileText,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  Compass,
  Sparkles,
  ClipboardCheck,
  Database,
  Cpu,
  ShieldAlert,
  ShieldCheck,
  Rocket,
} from "lucide-react";

type AdminTab =
  | "boards"
  | "academicYears"
  | "classes"
  | "subjects"
  | "books"
  | "chaptersTopics"
  | "syllabus";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("boards");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Data states
  const [boards, setBoards] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [syllabi, setSyllabi] = useState<any[]>([]);

  // Form states for creating new entities
  const [newBoard, setNewBoard] = useState({ code: "", name: "", country: "Pakistan", region: "" });
  const [newYear, setNewYear] = useState({ boardId: "", code: "", name: "" });
  const [newClass, setNewClass] = useState({ academicYearId: "", name: "", numericLevel: 9 });
  const [newSubject, setNewSubject] = useState({ classId: "", code: "", name: "" });
  const [newBook, setNewBook] = useState({
    title: "",
    publisher: "",
    version: "2025.1",
    classId: "",
    subjectId: "",
  });
  const [newChapter, setNewChapter] = useState({
    bookId: "",
    chapterNumber: 1,
    title: "",
    orderIndex: 1,
  });
  const [newTopic, setNewTopic] = useState({
    chapterId: "",
    title: "",
    orderIndex: 1,
    topicCode: "1.1",
  });
  const [newSyllabus, setNewSyllabus] = useState({
    title: "",
    version: "2025-v1",
    academicYearId: "",
    classId: "",
    subjectId: "",
  });

  const loadAllData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      await fetch("/api/admin/bootstrap", { method: "POST" }).catch(() => {});

      const [bRes, yRes, cRes, sRes, bkRes, sylRes] = await Promise.all([
        fetch("/api/boards").then((r) => r.json()),
        fetch("/api/academic-years").then((r) => r.json()),
        fetch("/api/classes").then((r) => r.json()),
        fetch("/api/subjects").then((r) => r.json()),
        fetch("/api/books").then((r) => r.json()),
        fetch("/api/syllabus").then((r) => r.json()),
      ]);

      if (bRes.data?.boards) setBoards(bRes.data.boards);
      if (yRes.data?.academicYears) setAcademicYears(yRes.data.academicYears);
      if (cRes.data?.classes) setClasses(cRes.data.classes);
      if (sRes.data?.subjects) setSubjects(sRes.data.subjects);
      if (bkRes.data?.books) setBooks(bkRes.data.books);
      if (sylRes.data?.syllabi) setSyllabi(sylRes.data.syllabi);
    } catch (err: any) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBoard),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create board");
      setFeedback({ type: "success", message: `Board "${newBoard.name}" created successfully!` });
      setNewBoard({ code: "", name: "", country: "Pakistan", region: "" });
      loadAllData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/academic-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newYear),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create academic year");
      setFeedback({ type: "success", message: `Academic Year "${newYear.name}" created!` });
      setNewYear({ boardId: "", code: "", name: "" });
      loadAllData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newClass, numericLevel: Number(newClass.numericLevel) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create class");
      setFeedback({ type: "success", message: `Class "${newClass.name}" created!` });
      setNewClass({ academicYearId: "", name: "", numericLevel: 9 });
      loadAllData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSubject),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create subject");
      setFeedback({ type: "success", message: `Subject "${newSubject.name}" created!` });
      setNewSubject({ classId: "", code: "", name: "" });
      loadAllData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBook),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create book");
      setFeedback({ type: "success", message: `Book version "${newBook.version}" registered!` });
      setNewBook({ title: "", publisher: "", version: "2025.1", classId: "", subjectId: "" });
      loadAllData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newChapter,
          chapterNumber: Number(newChapter.chapterNumber),
          orderIndex: Number(newChapter.orderIndex),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create chapter");
      setFeedback({ type: "success", message: `Chapter created successfully!` });
      setNewChapter({ bookId: "", chapterNumber: 1, title: "", orderIndex: 1 });
      loadAllData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTopic,
          orderIndex: Number(newTopic.orderIndex),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create topic");
      setFeedback({ type: "success", message: `Topic created successfully!` });
      setNewTopic({ chapterId: "", title: "", orderIndex: 1, topicCode: "1.1" });
      loadAllData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleCreateSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSyllabus),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create syllabus");
      setFeedback({ type: "success", message: `Syllabus version "${newSyllabus.version}" published!` });
      setNewSyllabus({ title: "", version: "2025-v1", academicYearId: "", classId: "", subjectId: "" });
      loadAllData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Education Hierarchy &amp; Syllabus Administration
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Manage educational boards, academic sessions, grades, subjects, versioned textbooks, and syllabus structures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/books/intelligence"
            className="flex items-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-600/20 px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Book Intelligence</span>
          </Link>
          <Link
            href="/admin/syllabus/intelligence"
            className="flex items-center gap-2 rounded-lg border border-teal-500/40 bg-teal-600/20 px-3.5 py-2 text-xs font-semibold text-teal-300 hover:bg-teal-600/30 transition-colors"
          >
            <FileCode2 className="h-3.5 w-3.5" />
            <span>Syllabus Intelligence</span>
          </Link>
          <Link
            href="/admin/sample-papers/intelligence"
            className="flex items-center gap-2 rounded-lg border border-purple-500/40 bg-purple-600/20 px-3.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-600/30 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Sample Papers</span>
          </Link>
          <Link
            href="/admin/retrieval"
            className="flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-600/20 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-600/30 transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span>RAG Retrieval</span>
          </Link>
          <Link
            href="/admin/blueprints"
            className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-600/20 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-600/30 transition-colors"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Blueprints</span>
          </Link>
          <Link
            href="/admin/questions/intelligence"
            className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-600/20 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Question Bank</span>
          </Link>
          <Link
            href="/admin/exams"
            className="flex items-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-600/20 px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition-colors"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span>Live Exams</span>
          </Link>
          <Link
            href="/admin/data-import"
            className="flex items-center gap-2 rounded-lg border border-sky-500/40 bg-sky-600/20 px-3.5 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-600/30 transition-colors"
          >
            <Database className="h-3.5 w-3.5" />
            <span>Data Ingestion</span>
          </Link>
          <Link
            href="/admin/ai-usage"
            className="flex items-center gap-2 rounded-lg border border-violet-500/40 bg-violet-600/20 px-3.5 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-600/30 transition-colors"
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>AI Usage & Telemetry</span>
          </Link>
          <Link
            href="/admin/data-quality"
            className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-600/20 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-600/30 transition-colors"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Data Governance</span>
          </Link>
          <Link
            href="/admin/validation"
            className="flex items-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-600/20 px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Validation Center</span>
          </Link>
          <Link
            href="/admin/validation/launch"
            className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-600/20 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30 transition-colors"
          >
            <Rocket className="h-3.5 w-3.5" />
            <span>Launch Gate</span>
          </Link>
          <button
            onClick={loadAllData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`mb-6 flex items-center justify-between rounded-lg p-3 text-xs ${
            feedback.type === "success"
              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
              : "bg-rose-950/80 text-rose-300 border border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
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

      {/* Tab Navigation */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: "boards", label: "Boards", icon: Building2, count: boards.length },
          { id: "academicYears", label: "Academic Years", icon: Calendar, count: academicYears.length },
          { id: "classes", label: "Classes", icon: GraduationCap, count: classes.length },
          { id: "subjects", label: "Subjects", icon: BookOpen, count: subjects.length },
          { id: "books", label: "Books & Versions", icon: Book, count: books.length },
          { id: "chaptersTopics", label: "Chapters & Topics", icon: ListTree },
          { id: "syllabus", label: "Syllabus Versions", icon: FileCode2, count: syllabi.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as AdminTab);
                setFeedback(null);
              }}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panes */}

      {/* 1. BOARDS TAB */}
      {activeTab === "boards" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" />
              <span>Create Educational Board</span>
            </h3>
            <form onSubmit={handleCreateBoard} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Board Code (Unique Upper)</label>
                <input
                  required
                  placeholder="e.g. DEMO_BOARD"
                  value={newBoard.code}
                  onChange={(e) => setNewBoard({ ...newBoard, code: e.target.value.toUpperCase() })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Board Name</label>
                <input
                  required
                  placeholder="e.g. Example Educational Board"
                  value={newBoard.name}
                  onChange={(e) => setNewBoard({ ...newBoard, name: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Region</label>
                <input
                  placeholder="e.g. Demo Region"
                  value={newBoard.region}
                  onChange={(e) => setNewBoard({ ...newBoard, region: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-500"
              >
                Register Board
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Registered Boards</h3>
            <div className="space-y-2">
              {boards.map((b) => (
                <div key={b.id || b.code} className="flex items-center justify-between rounded bg-slate-950 p-3 border border-slate-800 text-xs">
                  <div>
                    <div className="font-semibold text-white">{b.name}</div>
                    <div className="text-slate-400 font-mono">Code: {b.code} • {b.region || "National"}</div>
                  </div>
                  <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-800">
                    {b.status || "ACTIVE"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. ACADEMIC YEARS TAB */}
      {activeTab === "academicYears" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" />
              <span>Add Academic Session</span>
            </h3>
            <form onSubmit={handleCreateYear} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Parent Board</label>
                <select
                  required
                  value={newYear.boardId}
                  onChange={(e) => setNewYear({ ...newYear, boardId: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                >
                  <option value="">-- Select Board --</option>
                  {boards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Year Code</label>
                <input
                  required
                  placeholder="e.g. 2025-2026"
                  value={newYear.code}
                  onChange={(e) => setNewYear({ ...newYear, code: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Display Name</label>
                <input
                  required
                  placeholder="e.g. Academic Session 2025-2026"
                  value={newYear.name}
                  onChange={(e) => setNewYear({ ...newYear, name: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-500"
              >
                Create Academic Year
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Academic Sessions</h3>
            <div className="space-y-2">
              {academicYears.map((y) => (
                <div key={y.id} className="flex items-center justify-between rounded bg-slate-950 p-3 border border-slate-800 text-xs">
                  <div>
                    <div className="font-semibold text-white">{y.name}</div>
                    <div className="text-slate-400 font-mono">Code: {y.code} • Board: {y.board?.name || "Assigned"}</div>
                  </div>
                  <span className="rounded bg-indigo-950 px-2 py-0.5 text-[10px] text-indigo-400 border border-indigo-800">
                    {y.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. CLASSES TAB */}
      {activeTab === "classes" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" />
              <span>Create Class / Grade</span>
            </h3>
            <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Academic Year</label>
                <select
                  required
                  value={newClass.academicYearId}
                  onChange={(e) => setNewClass({ ...newClass, academicYearId: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                >
                  <option value="">-- Select Academic Year --</option>
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name} ({y.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Class Name</label>
                <input
                  required
                  placeholder="e.g. Class 9 / SSC Part 1"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Numeric Level (1-16)</label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  required
                  value={newClass.numericLevel}
                  onChange={(e) => setNewClass({ ...newClass, numericLevel: parseInt(e.target.value) || 9 })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-500"
              >
                Register Class
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Classes / Grade Levels</h3>
            <div className="space-y-2">
              {classes.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded bg-slate-950 p-3 border border-slate-800 text-xs">
                  <div>
                    <div className="font-semibold text-white">{c.name}</div>
                    <div className="text-slate-400 font-mono">
                      Numeric Level: {c.numericLevel} • Session: {c.academicYear?.code || "Current"}
                    </div>
                  </div>
                  <span className="rounded bg-sky-950 px-2 py-0.5 text-[10px] text-sky-400 border border-sky-800">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. SUBJECTS TAB */}
      {activeTab === "subjects" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" />
              <span>Create Subject</span>
            </h3>
            <form onSubmit={handleCreateSubject} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Class / Grade</label>
                <select
                  required
                  value={newSubject.classId}
                  onChange={(e) => setNewSubject({ ...newSubject, classId: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                >
                  <option value="">-- Select Class --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Level {c.numericLevel})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Subject Code</label>
                <input
                  required
                  placeholder="e.g. SCI-09"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Subject Name</label>
                <input
                  required
                  placeholder="e.g. General Science"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-500"
              >
                Register Subject
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Registered Subjects</h3>
            <div className="space-y-2">
              {subjects.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded bg-slate-950 p-3 border border-slate-800 text-xs">
                  <div>
                    <div className="font-semibold text-white">{s.name}</div>
                    <div className="text-slate-400 font-mono">Code: {s.code} • Class: {s.class?.name || "Assigned"}</div>
                  </div>
                  <span className="rounded bg-indigo-950 px-2 py-0.5 text-[10px] text-indigo-400 border border-indigo-800">
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. BOOKS & VERSIONS TAB */}
      {activeTab === "books" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" />
              <span>Register Book Version</span>
            </h3>
            <form onSubmit={handleCreateBook} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Class</label>
                <select
                  required
                  value={newBook.classId}
                  onChange={(e) => setNewBook({ ...newBook, classId: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                >
                  <option value="">-- Select Class --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Subject</label>
                <select
                  required
                  value={newBook.subjectId}
                  onChange={(e) => setNewBook({ ...newBook, subjectId: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects
                    .filter((s) => !newBook.classId || s.classId === newBook.classId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Book Title</label>
                <input
                  required
                  placeholder="e.g. Science Fundamentals"
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Publisher</label>
                <input
                  required
                  placeholder="e.g. National Curriculum Board"
                  value={newBook.publisher}
                  onChange={(e) => setNewBook({ ...newBook, publisher: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Version String (e.g. 2025.1)</label>
                <input
                  required
                  placeholder="e.g. 2025.1"
                  value={newBook.version}
                  onChange={(e) => setNewBook({ ...newBook, version: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-500"
              >
                Save Versioned Book
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Multi-Version Textbook Catalog</h3>
            <div className="space-y-2">
              {books.map((bk) => (
                <div key={bk.id} className="flex items-center justify-between rounded bg-slate-950 p-3 border border-slate-800 text-xs">
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{bk.title}</span>
                      <span className="rounded bg-indigo-950 px-1.5 py-0.5 text-[10px] font-mono text-indigo-400 border border-indigo-800">
                        v{bk.version}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Publisher: {bk.publisher} • Subject: {bk.subject?.name} • Class: {bk.class?.name}
                    </div>
                  </div>
                  <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-800">
                    {bk.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. CHAPTERS & TOPICS TAB */}
      {activeTab === "chaptersTopics" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Create Chapter Form */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" />
              <span>Add Chapter to Book</span>
            </h3>
            <form onSubmit={handleCreateChapter} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Book Version</label>
                <select
                  required
                  value={newChapter.bookId}
                  onChange={(e) => setNewChapter({ ...newChapter, bookId: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                >
                  <option value="">-- Select Book --</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} (v{b.version})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Chapter Number</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newChapter.chapterNumber}
                    onChange={(e) =>
                      setNewChapter({
                        ...newChapter,
                        chapterNumber: parseInt(e.target.value) || 1,
                        orderIndex: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Order Index</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newChapter.orderIndex}
                    onChange={(e) => setNewChapter({ ...newChapter, orderIndex: parseInt(e.target.value) || 1 })}
                    className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Chapter Title</label>
                <input
                  required
                  placeholder="e.g. Introduction to Physics"
                  value={newChapter.title}
                  onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-500"
              >
                Add Chapter
              </button>
            </form>
          </div>

          {/* Create Topic Form */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-400" />
              <span>Add Topic to Chapter</span>
            </h3>
            <form onSubmit={handleCreateTopic} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Parent Chapter</label>
                <input
                  required
                  placeholder="Paste Chapter UUID or ID"
                  value={newTopic.chapterId}
                  onChange={(e) => setNewTopic({ ...newTopic, chapterId: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Topic Code</label>
                  <input
                    placeholder="e.g. 1.1"
                    value={newTopic.topicCode}
                    onChange={(e) => setNewTopic({ ...newTopic, topicCode: e.target.value })}
                    className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Order Index</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newTopic.orderIndex}
                    onChange={(e) => setNewTopic({ ...newTopic, orderIndex: parseInt(e.target.value) || 1 })}
                    className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Topic Title</label>
                <input
                  required
                  placeholder="e.g. Physical Quantities"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-500"
              >
                Add Topic
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. SYLLABUS VERSIONS TAB */}
      {activeTab === "syllabus" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" />
              <span>Create Syllabus Version</span>
            </h3>
            <form onSubmit={handleCreateSyllabus} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Academic Year</label>
                <select
                  required
                  value={newSyllabus.academicYearId}
                  onChange={(e) => setNewSyllabus({ ...newSyllabus, academicYearId: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                >
                  <option value="">-- Select Academic Year --</option>
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name} ({y.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Class</label>
                <select
                  required
                  value={newSyllabus.classId}
                  onChange={(e) => setNewSyllabus({ ...newSyllabus, classId: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                >
                  <option value="">-- Select Class --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Subject</label>
                <select
                  required
                  value={newSyllabus.subjectId}
                  onChange={(e) => setNewSyllabus({ ...newSyllabus, subjectId: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects
                    .filter((s) => !newSyllabus.classId || s.classId === newSyllabus.classId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Syllabus Title</label>
                <input
                  required
                  placeholder="e.g. Science Annual Syllabus"
                  value={newSyllabus.title}
                  onChange={(e) => setNewSyllabus({ ...newSyllabus, title: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Syllabus Version String</label>
                <input
                  required
                  placeholder="e.g. 2025-v1"
                  value={newSyllabus.version}
                  onChange={(e) => setNewSyllabus({ ...newSyllabus, version: e.target.value })}
                  className="w-full rounded bg-slate-950 border border-slate-800 px-3 py-2 text-white font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-500"
              >
                Publish Syllabus Version
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Multi-Version Syllabi &amp; Weightages</h3>
            <div className="space-y-3">
              {syllabi.map((syl) => (
                <div key={syl.id} className="rounded bg-slate-950 p-4 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{syl.title}</span>
                      <span className="rounded bg-indigo-950 px-1.5 py-0.5 text-[10px] font-mono text-indigo-400 border border-indigo-800">
                        {syl.version}
                      </span>
                    </div>
                    <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-800">
                      {syl.status}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-1">
                    Subject: {syl.subject?.name} • Class: {syl.class?.name} • Session: {syl.academicYear?.code}
                  </div>
                  {syl.chapterItems && syl.chapterItems.length > 0 && (
                    <div className="mt-3 border-t border-slate-900 pt-2">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Chapter Weightages &amp; Inclusions:</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {syl.chapterItems.map((ci: any) => (
                          <span
                            key={ci.id}
                            className={`rounded px-2 py-0.5 text-[10px] border ${
                              ci.isIncluded
                                ? "bg-slate-900 text-slate-300 border-slate-800"
                                : "bg-rose-950/40 text-rose-400 border-rose-900 line-through"
                            }`}
                          >
                            Ch {ci.chapter?.chapterNumber || "?"} ({ci.weightage || 0}%) - {ci.examinationRelevance}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
