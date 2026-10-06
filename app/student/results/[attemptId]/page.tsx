"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  BarChart3,
  BookOpen,
  ArrowLeft,
  Printer,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Layers,
} from "lucide-react";

export default function StudentExamResultPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [detailedReview, setDetailedReview] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"sections" | "difficulty" | "chapters" | "questions">("sections");
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadResult() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/exams/${attemptId}/result`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error?.message || "Failed to retrieve examination results.");
        }

        setResultData(data.data.result);
        setDetailedReview(data.data.detailedReview || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (attemptId) {
      loadResult();
    }
  }, [attemptId]);

  const toggleExpand = (qId: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-300">Generating comprehensive performance report...</p>
        </div>
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 p-6 text-slate-100">
        <div className="max-w-md rounded-xl border border-rose-900/60 bg-rose-950/40 p-6 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-400" />
          <h2 className="mt-3 text-lg font-bold text-white">Result Not Available</h2>
          <p className="mt-2 text-xs text-rose-200">{error || "No result found for this attempt."}</p>
          <button
            onClick={() => router.push("/admin/exams")}
            className="mt-5 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const formatSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  };

  const gradeColors: Record<string, string> = {
    "A+": "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    A: "bg-emerald-600/20 text-emerald-400 border-emerald-600/40",
    B: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    C: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    D: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    F: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-8 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/exams"
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Link>
            <div>
              <h1 className="text-base font-bold text-white">{resultData.paperTitle}</h1>
              <p className="text-[11px] text-slate-400">
                Paper: <span className="font-mono text-indigo-300">{resultData.paperCode}</span> | Attempt ID: {resultData.attemptId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Scorecard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-8 pt-8">
        {/* Hero Score Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="rounded-md bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
                  Examination Result
                </span>
                <span
                  className={`rounded-md px-2.5 py-0.5 text-xs font-semibold border ${
                    resultData.status === "FINAL"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  }`}
                >
                  {resultData.status}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Performance Summary</h2>
              <p className="text-xs text-slate-400">
                Candidate: <strong className="text-slate-200">{resultData.studentName || "Candidate"}</strong> | Evaluated At: {new Date(resultData.evaluatedAt).toLocaleString()}
              </p>
            </div>

            {/* Score & Grade Display */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-4xl font-extrabold text-white tracking-tight">
                  {resultData.obtainedMarks}{" "}
                  <span className="text-xl font-normal text-slate-500">/ {resultData.totalMarks}</span>
                </div>
                <div className="text-sm font-semibold text-indigo-400">{resultData.percentage}% Score</div>
              </div>

              {/* Grade Badge */}
              <div
                className={`flex h-20 w-20 flex-col items-center justify-center rounded-2xl border text-center shadow-lg ${
                  gradeColors[resultData.grade] || "bg-slate-800 text-white border-slate-700"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Grade</span>
                <span className="text-2xl font-black">{resultData.grade}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-6 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Correct</span>
              </div>
              <p className="mt-1 text-xl font-bold text-white">{resultData.correctCount}</p>
            </div>

            <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <XCircle className="h-4 w-4 text-rose-400" />
                <span>Incorrect</span>
              </div>
              <p className="mt-1 text-xl font-bold text-white">{resultData.incorrectCount}</p>
            </div>

            <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <HelpCircle className="h-4 w-4 text-slate-400" />
                <span>Unanswered</span>
              </div>
              <p className="mt-1 text-xl font-bold text-white">{resultData.unansweredCount}</p>
            </div>

            <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Clock className="h-4 w-4 text-indigo-400" />
                <span>Time Spent</span>
              </div>
              <p className="mt-1 text-xl font-bold text-white">{formatSeconds(resultData.timeSpentSeconds)}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 flex gap-2 border-b border-slate-800 pb-2">
          {[
            { id: "sections", label: "Section Breakdown", icon: Layers },
            { id: "difficulty", label: "Difficulty Analysis", icon: BarChart3 },
            { id: "chapters", label: "Chapter Breakdown", icon: BookOpen },
            { id: "questions", label: "Detailed Review", icon: CheckCircle2 },
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
              </button>
            );
          })}
        </div>

        {/* Tab 1: Section Breakdown */}
        {activeTab === "sections" && (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4">
              {resultData.sectionBreakdown?.map((sec: any) => (
                <div
                  key={sec.sectionId}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 transition-all hover:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{sec.sectionName}</h4>
                      <p className="text-xs text-slate-400">
                        Attempted: {sec.attemptedCount} of {sec.questionCount} questions
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {sec.marksObtained} <span className="text-xs text-slate-500">/ {sec.maxMarks}</span>
                      </div>
                      <span className="text-xs font-semibold text-indigo-400">{sec.percentage}%</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, sec.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Difficulty Analysis */}
        {activeTab === "difficulty" && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {["easy", "medium", "difficult"].map((level) => {
              const diff = resultData.difficultyBreakdown?.[level] || {
                marksObtained: 0,
                maxMarks: 0,
                percentage: 0,
                questionCount: 0,
              };

              const colors: Record<string, { border: string; bg: string; text: string }> = {
                easy: { border: "border-emerald-800/60", bg: "bg-emerald-950/20", text: "text-emerald-400" },
                medium: { border: "border-amber-800/60", bg: "bg-amber-950/20", text: "text-amber-400" },
                difficult: { border: "border-rose-800/60", bg: "bg-rose-950/20", text: "text-rose-400" },
              };

              const c = colors[level];

              return (
                <div key={level} className={`rounded-xl border ${c.border} ${c.bg} p-6`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>{level}</span>
                    <span className="text-xs text-slate-400">{diff.questionCount} Questions</span>
                  </div>
                  <div className="mt-4 text-3xl font-extrabold text-white">
                    {diff.marksObtained} <span className="text-base text-slate-500 font-normal">/ {diff.maxMarks}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-300">{diff.percentage}% Success Rate</div>

                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        level === "easy"
                          ? "bg-emerald-500"
                          : level === "medium"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, diff.percentage))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Chapter Breakdown */}
        {activeTab === "chapters" && (
          <div className="mt-6 space-y-3">
            {resultData.chapterBreakdown?.map((chap: any) => (
              <div
                key={chap.chapterId}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{chap.chapterTitle}</h4>
                  <p className="text-xs text-slate-400">{chap.questionCount} question(s) tested</p>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-white">
                    {chap.marksObtained} <span className="text-xs text-slate-500">/ {chap.maxMarks}</span>
                  </div>
                  <span className="text-xs font-semibold text-indigo-400">{chap.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Detailed Question Review */}
        {activeTab === "questions" && (
          <div className="mt-6 space-y-4">
            {detailedReview.map((item: any, idx: number) => {
              const isExpanded = expandedQuestions[item.paperQuestionId] !== false;
              const isCorrect = item.marksAwarded === item.marks;
              const isPartial = item.marksAwarded > 0 && item.marksAwarded < item.marks;

              return (
                <div
                  key={item.paperQuestionId}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden"
                >
                  {/* Question Review Header */}
                  <div
                    onClick={() => toggleExpand(item.paperQuestionId)}
                    className="flex cursor-pointer items-center justify-between p-4 hover:bg-slate-850 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 font-mono text-xs font-bold text-slate-200">
                        Q{item.sequence || idx + 1}
                      </span>
                      <div>
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400 mr-2">
                          {item.questionType}
                        </span>
                        <span className="text-xs font-medium text-slate-300">
                          {item.questionText?.substring(0, 80)}...
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                            isCorrect
                              ? "bg-emerald-500/20 text-emerald-300"
                              : isPartial
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {item.marksAwarded} / {item.marks}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Solution & Feedback */}
                  {isExpanded && (
                    <div className="border-t border-slate-800 bg-slate-950/60 p-5 space-y-4 text-xs">
                      <div>
                        <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Full Question:</p>
                        <p className="mt-1 text-slate-200 leading-relaxed">{item.questionText}</p>
                      </div>

                      <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3.5">
                        <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Your Answer:</p>
                        <p className="mt-1 font-mono text-sm text-indigo-300 whitespace-pre-wrap">
                          {String(item.studentAnswer)}
                        </p>
                      </div>

                      {item.feedback && (
                        <div className="rounded-lg border border-indigo-900/40 bg-indigo-950/20 p-3.5">
                          <p className="font-semibold uppercase tracking-wider text-indigo-400 text-[10px]">Feedback & Solution Notes:</p>
                          <p className="mt-1 text-slate-300 leading-relaxed">{item.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
