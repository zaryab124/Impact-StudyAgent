"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Clock,
  Award,
  Layers,
  ChevronRight,
  Play,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Printer,
} from "lucide-react";

export default function PaperPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const paperId = params.paperId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paper, setPaper] = useState<any>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function fetchPaper() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/papers/${paperId}?forStudent=true`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error?.message || "Failed to load examination paper.");
        }

        setPaper(data.data);
      } catch (err: any) {
        setError(err.message || "Failed to load examination paper.");
      } finally {
        setLoading(false);
      }
    }

    if (paperId) {
      fetchPaper();
    }
  }, [paperId]);

  const handleStartExam = async () => {
    try {
      setStarting(true);
      const res = await fetch(`/api/exams/${paperId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: "student_live_01",
          studentName: "Student Candidate",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to initiate examination attempt.");
      }

      router.push(`/student/exam/${paperId}`);
    } catch (err: any) {
      alert(`Start Exam Error: ${err.message}`);
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <span>Loading examination paper preview...</span>
        </div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-rose-400 mb-3" />
        <h2 className="text-lg font-bold text-white">Paper Not Found</h2>
        <p className="mt-1 text-xs text-rose-300">{error || "Could not retrieve the specified paper."}</p>
        <Link
          href="/student/create-paper"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Create New Paper
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Action */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <Link
          href="/student"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/student/paper/${paperId}/print`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-600/20 px-4 py-2.5 text-xs font-bold text-indigo-300 shadow-md hover:bg-indigo-600/30 hover:border-indigo-400 active:scale-95 transition-all"
          >
            <Printer className="h-4 w-4 text-indigo-300" />
            <span>PRINT READY PAPER (FOR ORGANIZATION)</span>
          </Link>

          <button
            onClick={handleStartExam}
            disabled={starting}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950 hover:bg-emerald-500 active:scale-95 transition-all"
          >
            {starting ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Starting Exam Session...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>START EXAM</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero Paper Meta Card */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-8 shadow-xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="rounded-md bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
                Official Blueprint Specification
              </span>
              <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                {paper.status || "ACTIVE"}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl tracking-tight">
              {paper.title}
            </h1>
            <p className="mt-1 text-xs text-slate-400 font-mono">
              Paper Code: {paper.paperCode}
            </p>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <div className="text-3xl font-extrabold text-white">{paper.totalMarks}</div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Total Marks</span>
            </div>
            <div className="h-10 w-px bg-slate-800" />
            <div>
              <div className="text-3xl font-extrabold text-white">{paper.questions?.length || 0}</div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Questions</span>
            </div>
            <div className="h-10 w-px bg-slate-800" />
            <div>
              <div className="text-3xl font-extrabold text-white">{paper.durationMinutes || 60}m</div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Duration</span>
            </div>
          </div>
        </div>

        {paper.instructions && (
          <div className="mt-6 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Instructions: </span>
            {paper.instructions}
          </div>
        )}
      </div>

      {/* Sections Overview */}
      {paper.sections && paper.sections.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-400" />
            <span>Examination Sections</span>
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            {paper.sections.map((sec: any) => (
              <div
                key={sec.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow"
              >
                <div className="text-xs font-semibold text-indigo-400">{sec.sectionName}</div>
                <div className="mt-2 text-xl font-bold text-white">
                  {sec.totalQuestions} Questions
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span>Type: {sec.questionType}</span>
                  <span className="font-semibold text-emerald-400">{sec.maximumObtainableMarks} Marks</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions Preview (Answers sanitized) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-6 flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo-400" />
          <span>Questions Preview ({paper.questions?.length || 0} Items)</span>
        </h2>

        <div className="space-y-6">
          {paper.questions?.map((q: any, idx: number) => (
            <div
              key={q.id || idx}
              className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 transition-all hover:border-slate-700"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-indigo-500/20 px-2 py-0.5 font-mono text-xs font-bold text-indigo-300">
                    Q{q.sequence || idx + 1}
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                    {q.sectionName || "Section"}
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-mono">
                    {q.difficulty || "MEDIUM"}
                  </span>
                </div>

                <span className="text-xs font-semibold text-emerald-400">
                  {q.marks} Mark{q.marks > 1 ? "s" : ""}
                </span>
              </div>

              <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
                {q.questionText}
              </p>

              {/* Options for MCQ without indicating correct answer */}
              {q.options && q.options.length > 0 && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt: any) => (
                    <div
                      key={opt.key}
                      className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-xs text-slate-300"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-indigo-400">
                        {opt.key}
                      </span>
                      <span>{opt.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Start Exam CTA */}
        <div className="mt-8 border-t border-slate-800 pt-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/student/paper/${paperId}/print`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-600/20 px-6 py-3.5 text-xs font-bold text-indigo-300 shadow-md hover:bg-indigo-600/30 hover:border-indigo-400 active:scale-95 transition-all"
          >
            <Printer className="h-4 w-4 text-indigo-300" />
            <span>PRINT READY TEST PAPER (FOR ORGANIZATION)</span>
          </Link>

          <button
            onClick={handleStartExam}
            disabled={starting}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-950 hover:bg-emerald-500 active:scale-95 transition-all cursor-pointer"
          >
            {starting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Starting Exam Session...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>START EXAM NOW</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
