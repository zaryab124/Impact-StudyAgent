"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Award,
  BookOpen,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { RouteGuard } from "@/components/auth/RouteGuard";

function ParentPortalContent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadParentData() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/parent/analytics");
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error?.message || "Failed to load parent portal data.");
        }

        setData(json.data);
      } catch (err: any) {
        setError(err.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    }

    loadParentData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[75vh] w-full items-center justify-center text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-300">Loading Child Progress Analytics...</p>
        </div>
      </div>
    );
  }

  const student = data?.analytics?.student || { name: "Muhammad Student", email: "student@candidate.edu.pk" };
  const summary = data?.analytics?.summary || { totalExamsTaken: 0, averageScore: 0, status: "NEEDS_IMPROVEMENT" };
  const weakAreas = data?.analytics?.weakAreas || [];
  const attempts = data?.analytics?.recentAttempts || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 mb-2">
            <Users className="h-3.5 w-3.5" />
            <span>Parent & Guardian Oversight Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Child Performance & Study Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Monitoring active progress for candidate: <span className="font-semibold text-white">{student.name}</span> ({student.email})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/student"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-all"
          >
            <span>Student Practice Room</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-300">
          <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
          <p>{error}</p>
        </div>
      )}

      {/* KPI Highlights Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Average Performance</span>
            <Award className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{summary.averageScore}%</span>
            <span className={`text-xs font-semibold ${summary.averageScore >= 60 ? "text-emerald-400" : "text-amber-400"}`}>
              {summary.averageScore >= 80 ? "Grade A+" : summary.averageScore >= 60 ? "Grade B" : "Action Needed"}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Computed across all completed examinations and practice drills.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Exams Attempted</span>
            <BookOpen className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{summary.totalExamsTaken}</span>
            <span className="text-xs text-slate-400">Papers completed</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Objective MCQs + Subjective handwritten/app answers.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Identified Weak Areas</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{weakAreas.length}</span>
            <span className="text-xs text-slate-400">Target chapters</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Specific syllabus units needing reinforcement before board exam.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Academic Status</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-400">
              {summary.status === "ON_TRACK" ? "On Track" : "Needs Revision"}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {summary.averageScore >= 60 ? "Ready for upcoming board sessions" : "Focus on identified weak topics"}
          </p>
        </div>
      </div>

      {/* Weak Areas & AI Guidance Section */}
      <div className="rounded-2xl border border-amber-500/30 bg-slate-900/70 p-6 backdrop-blur space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Detailed Weak Area Breakdown & Guidance
              </h2>
              <p className="text-xs text-slate-400">
                Topics and chapters where student lost marks during objective and subjective testing.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
            Prescriptive Study Plan
          </span>
        </div>

        {weakAreas.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-8 text-center text-slate-400">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
            <p className="text-sm font-semibold text-slate-200">No Major Weak Areas Detected Yet!</p>
            <p className="text-xs text-slate-400 mt-1">
              As your child attempts more practice papers and submits handwritten or typed tests, algorithmic analysis will highlight specific areas here.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {weakAreas.map((area: any, idx: number) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2 hover:border-amber-500/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate max-w-[200px]">
                    {area.topic}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      area.severity === "HIGH"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {area.severity} Priority
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Mistakes observed in <span className="font-semibold text-white">{area.frequency} questions</span>.
                </p>

                {area.recommendations && area.recommendations.length > 0 && (
                  <div className="rounded bg-slate-900 p-2 text-[11px] text-slate-300 border border-slate-800">
                    <span className="font-semibold text-amber-400 block mb-0.5">Examiner Note:</span>
                    <span className="line-clamp-2">{area.recommendations[0]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historical Attempts Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Recent Test History</h2>
          </div>
          <span className="text-xs text-slate-400">Showing last attempts</span>
        </div>

        {attempts.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-8 text-center text-slate-400">
            <p className="text-sm">No exam attempts recorded yet for this candidate.</p>
            <p className="text-xs mt-1 text-slate-500">
              When your child begins testing on the Student Portal, each test attempt and grade will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-semibold uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4">Paper Title</th>
                  <th className="py-3 px-4">Date Attempted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {attempts.map((att: any) => (
                  <tr key={att.id} className="hover:bg-slate-850/40">
                    <td className="py-3 px-4 font-semibold text-white">{att.paperTitle}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {att.date ? new Date(att.date).toLocaleDateString() : "Recent"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                        {att.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {att.percentage !== null ? `${att.percentage}%` : "In Progress"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-indigo-500/20 px-2 py-0.5 font-bold text-indigo-300">
                        {att.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/student/results/${att.id}`}
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                      >
                        <span>Full Report</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ParentPortalPage() {
  return (
    <RouteGuard allowedRoles={["PARENT", "ADMIN"]} portalName="Parent Portal">
      <ParentPortalContent />
    </RouteGuard>
  );
}
