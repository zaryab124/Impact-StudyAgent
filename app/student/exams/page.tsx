"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  PlusCircle,
} from "lucide-react";

export default function MyExamsPage() {
  const [loading, setLoading] = useState(true);
  const [activeExams, setActiveExams] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [filter, setFilter] = useState<"ALL" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED">("ALL");

  useEffect(() => {
    async function loadExams() {
      try {
        setLoading(true);
        const res = await fetch("/api/exams");
        const data = await res.json();
        if (data.data) {
          setActiveExams(data.data.activeExams || []);
          setAttempts(data.data.attempts || []);
        }
      } catch (err) {
        console.error("Failed to load exams:", err);
      } finally {
        setLoading(false);
      }
    }
    loadExams();
  }, []);

  const completedAttempts = attempts.filter((a) => a.status === "SUBMITTED" || a.status === "EVALUATED");
  const inProgressAttempts = attempts.filter((a) => a.status === "IN_PROGRESS");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">My Exams</h1>
          <p className="mt-1 text-xs text-slate-400">
            View available examination papers, resume active sessions, or inspect graded scorecards.
          </p>
        </div>

        <Link
          href="/student/create-paper"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-950 hover:bg-indigo-500 transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Generate New Paper</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-slate-800 pb-2">
        {[
          { id: "ALL", label: "All Papers" },
          { id: "AVAILABLE", label: `Available (${activeExams.length})` },
          { id: "IN_PROGRESS", label: `In Progress (${inProgressAttempts.length})` },
          { id: "COMPLETED", label: `Completed (${completedAttempts.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === tab.id
                ? "bg-slate-800 text-indigo-400 border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-3" />
          <span>Loading examination records...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active In-Progress Sessions */}
          {(filter === "ALL" || filter === "IN_PROGRESS") && inProgressAttempts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Active Sessions In Progress
              </h2>
              {inProgressAttempts.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between rounded-xl border border-amber-900/40 bg-amber-950/20 p-5 shadow"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                        IN PROGRESS
                      </span>
                      <h3 className="text-sm font-bold text-white">{att.paperTitle}</h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-400 font-mono">
                      Started: {new Date(att.startedAt).toLocaleTimeString()} • Duration: {att.durationMinutes}m
                    </p>
                  </div>

                  <Link
                    href={`/student/exam/${att.paperId}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-amber-500"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Resume Exam</span>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Available Papers */}
          {(filter === "ALL" || filter === "AVAILABLE") && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Available Examination Papers
              </h2>
              {activeExams.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
                  No available exam papers currently. Create one using the Paper Generator.
                </div>
              ) : (
                activeExams.map((paper) => (
                  <div
                    key={paper.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow transition-all hover:border-slate-700"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                          {paper.paperCode || "EXAM"}
                        </span>
                        <h3 className="text-sm font-bold text-white">{paper.title}</h3>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {paper.questions?.length || paper.totalQuestions || 30} Questions • Total Marks: {paper.totalMarks || 60} • {paper.durationMinutes || 60} mins
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/student/paper/${paper.id}`}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                      >
                        Preview
                      </Link>
                      <Link
                        href={`/student/exam/${paper.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-950"
                      >
                        <Play className="h-3 w-3 fill-white" />
                        <span>Start</span>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Completed Exams */}
          {(filter === "ALL" || filter === "COMPLETED") && completedAttempts.length > 0 && (
            <div className="space-y-3 pt-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Completed Examinations
              </h2>
              {completedAttempts.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        COMPLETED
                      </span>
                      <h3 className="text-sm font-bold text-white">{att.paperTitle}</h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Score: <strong className="text-white">{att.obtainedMarks} / {att.totalMarks}</strong> ({att.percentage}%) • Grade: <strong className="text-emerald-400">{att.grade}</strong>
                    </p>
                  </div>

                  <Link
                    href={`/student/results/${att.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-600/40 bg-indigo-600/20 px-3.5 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30"
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>View Scorecard</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
