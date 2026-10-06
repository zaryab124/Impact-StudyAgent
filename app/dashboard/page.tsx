"use client";

import React, { useState } from "react";
import { Calculator, CheckCircle2, FileText, Sparkles, BookOpen } from "lucide-react";
import { calculateDifficultyDistribution } from "@/lib/blueprint/calculator";

export default function DashboardPage() {
  const [totalQuestions, setTotalQuestions] = useState<number>(30);
  const distribution = calculateDifficultyDistribution(totalQuestions > 0 ? totalQuestions : 1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Teacher & Examiner Blueprint Workspace
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Design deterministic exam blueprints. Marks and difficulty distributions are calculated programmatically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Deterministic Engine Ready
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Interactive 33% Difficulty Simulator */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl lg:col-span-1">
          <div className="flex items-center gap-2 mb-4 text-indigo-400">
            <Calculator className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-white">Difficulty Simulator</h2>
          </div>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Test the application&apos;s deterministic Largest Remainder (Hare-Niemeyer) rounding logic.
            Enforces ~33% Easy, ~33% Medium, and ~33% Difficult distribution with zero sum errors.
          </p>

          <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-2">
            Total Target Questions
          </label>
          <div className="flex items-center gap-3 mb-6">
            <input
              type="number"
              min="1"
              max="200"
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Distribution Breakdown */}
          <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-emerald-400">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Easy Questions (~33%)
              </span>
              <span className="font-mono font-bold text-white">
                {distribution.easy} ({distribution.percentageSummary.easyPct}%)
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-amber-400">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Medium Questions (~33%)
              </span>
              <span className="font-mono font-bold text-white">
                {distribution.medium} ({distribution.percentageSummary.mediumPct}%)
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-rose-400">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                Difficult Questions (~33%)
              </span>
              <span className="font-mono font-bold text-white">
                {distribution.difficult} ({distribution.percentageSummary.difficultPct}%)
              </span>
            </div>

            <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-sm font-semibold">
              <span className="text-slate-300">Sum Total Verified</span>
              <span className="font-mono text-indigo-400">
                {distribution.easy + distribution.medium + distribution.difficult} / {totalQuestions}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Blueprint Templates & Curriculum Overview */}
        <div className="space-y-6 lg:col-span-2">
          {/* Active Pattern Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <FileText className="h-5 w-5" />
                <h3 className="text-base font-semibold text-white">
                  Curriculum Pattern: Physics Class 9 (SSC-I)
                </h3>
              </div>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                BISE Lahore Pattern
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                <div className="text-xs text-slate-400">Section A: MCQs</div>
                <div className="text-lg font-bold text-white mt-1">12 Questions</div>
                <div className="text-xs text-slate-400">12 Marks • Compulsory</div>
              </div>

              <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                <div className="text-xs text-slate-400">Section B: Short Qs</div>
                <div className="text-lg font-bold text-white mt-1">15 Questions</div>
                <div className="text-xs text-slate-400">30 Marks • Choice Rules</div>
              </div>

              <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                <div className="text-xs text-slate-400">Section C: Long Qs</div>
                <div className="text-lg font-bold text-white mt-1">2 Questions</div>
                <div className="text-xs text-slate-400">18 Marks • Detailed Theory</div>
              </div>
            </div>
          </div>

          {/* Phase 3 Placeholder Notification */}
          <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-6 border-dashed">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-white">
                  AI Question Generation & Assembly (Scheduled for Phase 3)
                </h4>
                <p className="mt-1 text-sm text-slate-300 leading-relaxed">
                  In Phase 3, connecting this blueprint will automatically query retrieved textbook chunks
                  from the pgvector database and assemble candidate questions using the AI Provider layer.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-indigo-400 font-mono">
                  <BookOpen className="h-4 w-4" />
                  <span>Authorized Text: &quot;Physics for Class IX&quot; (Punjab Curriculum Board)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
