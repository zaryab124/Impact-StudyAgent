"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function StudentResultsIndexPage() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    async function loadResults() {
      try {
        setLoading(true);
        const res = await fetch("/api/results");
        const data = await res.json();
        if (data.data?.results) {
          setResults(data.data.results);
        }
      } catch (err) {
        console.error("Failed to load results:", err);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, []);

  const gradeColors: Record<string, string> = {
    "A+": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    A: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30",
    B: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    C: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    D: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    F: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Examination Results</h1>
        <p className="mt-1 text-xs text-slate-400">
          Official evaluated scorecards and multi-dimensional performance breakdowns across all attempted exams.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-3" />
          <span>Retrieving evaluation records...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
          <Award className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h2 className="text-base font-semibold text-white">No Results Available Yet</h2>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            You haven&apos;t completed any live examination sessions yet. Take an exam to receive deterministic grading and diagnostic analytics.
          </p>
          <Link
            href="/student/exams"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500"
          >
            Take Available Exam
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((r) => {
            const grade = r.grade || "B";
            const id = r.attemptId || r.id;
            return (
              <div
                key={id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-md transition-all hover:border-slate-700"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-black border ${
                        gradeColors[grade] || "bg-slate-800 text-white"
                      }`}
                    >
                      {grade}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {r.paperTitle || "Examination Session"}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400">
                    Candidate: <strong className="text-slate-300">{r.studentName || "Candidate"}</strong> • Evaluated on: {new Date(r.evaluatedAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-slate-800/80 pt-3 sm:border-0 sm:pt-0">
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-white">
                      {r.totalMarksObtained ?? r.obtainedMarks ?? 0}{" "}
                      <span className="text-xs text-slate-500 font-normal">
                        / {r.totalMarksPossible ?? r.totalMarks ?? 60}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-indigo-400">
                      {r.percentage || Math.round(((r.totalMarksObtained ?? r.obtainedMarks ?? 0) / (r.totalMarksPossible ?? r.totalMarks ?? 60)) * 100)}% Score
                    </span>
                  </div>

                  <Link
                    href={`/student/results/${id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/20 px-4 py-2 text-xs font-bold text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all"
                  >
                    <span>View Scorecard</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
