"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Award,
} from "lucide-react";

interface WeakAreaItem {
  id: string;
  name: string;
  category: string;
  accuracyPct: number;
  status: "NEEDS_PRACTICE" | "MODERATE" | "STRONG";
  totalQuestions: number;
}

export default function WeakAreasPage() {
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<WeakAreaItem[]>([]);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const res = await fetch("/api/results");
        const data = await res.json();
        const results = data.data?.results || [];

        // Aggregate chapter/topic performance across all attempts
        const topicMap = new Map<string, { totalMarks: number; maxMarks: number; count: number; category: string }>();

        for (const r of results) {
          // If result has chapterBreakdown
          if (r.chapterBreakdown && Array.isArray(r.chapterBreakdown)) {
            for (const ch of r.chapterBreakdown) {
              const name = ch.chapterTitle || "Chapter";
              const curr = topicMap.get(name) || { totalMarks: 0, maxMarks: 0, count: 0, category: r.paperTitle || "General" };
              curr.totalMarks += ch.marksObtained || 0;
              curr.maxMarks += ch.maxMarks || 1;
              curr.count += ch.questionCount || 1;
              topicMap.set(name, curr);
            }
          }

          // If result has topicStrengths
          if (r.topicStrengths && Array.isArray(r.topicStrengths)) {
            for (const ts of r.topicStrengths) {
              const name = ts.topic || "Topic";
              const curr = topicMap.get(name) || { totalMarks: 0, maxMarks: 100, count: 1, category: r.paperTitle || "Subject" };
              curr.totalMarks = (ts.accuracyPct / 100) * 100;
              curr.maxMarks = 100;
              topicMap.set(name, curr);
            }
          }
        }

        const items: WeakAreaItem[] = [];
        for (const [name, stats] of topicMap.entries()) {
          const pct = stats.maxMarks > 0 ? Math.round((stats.totalMarks / stats.maxMarks) * 100) : 0;
          let status: WeakAreaItem["status"] = "NEEDS_PRACTICE";
          if (pct >= 80) status = "STRONG";
          else if (pct >= 60) status = "MODERATE";

          items.push({
            id: name,
            name,
            category: stats.category,
            accuracyPct: pct,
            status,
            totalQuestions: stats.count,
          });
        }

        // Sort items so weakest areas come first
        items.sort((a, b) => a.accuracyPct - b.accuracyPct);
        setTopics(items);
      } catch (err) {
        console.error("Failed to load weak areas:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  const needsPracticeCount = topics.filter((t) => t.status === "NEEDS_PRACTICE").length;
  const moderateCount = topics.filter((t) => t.status === "MODERATE").length;
  const strongCount = topics.filter((t) => t.status === "STRONG").length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Weak Areas &amp; Diagnostic Review</h1>
        <p className="mt-1 text-xs text-slate-400">
          Data-driven topic strengths and growth opportunities calculated deterministically from your evaluated examination attempts.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-3" />
          <span>Aggregating diagnostic performance analytics...</span>
        </div>
      ) : topics.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
          <TrendingDown className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h2 className="text-base font-semibold text-white">No Weak Areas Identified Yet</h2>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Complete at least one practice paper or examination to generate diagnostic insights into your chapter strengths and focus areas.
          </p>
          <Link
            href="/student/practice"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500"
          >
            Start Practice Session
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Diagnostic Metrics Overview */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-rose-900/60 bg-rose-950/20 p-5 shadow">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">
                Needs Practice (&lt;60%)
              </span>
              <div className="text-2xl font-black text-white mt-1">{needsPracticeCount} Topics</div>
              <p className="text-[11px] text-slate-400 mt-1">Primary revision focus recommended</p>
            </div>

            <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-5 shadow">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                Moderate (60%–79%)
              </span>
              <div className="text-2xl font-black text-white mt-1">{moderateCount} Topics</div>
              <p className="text-[11px] text-slate-400 mt-1">Consistent with passing standard</p>
            </div>

            <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-5 shadow">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                Strong Mastery (&ge;80%)
              </span>
              <div className="text-2xl font-black text-white mt-1">{strongCount} Topics</div>
              <p className="text-[11px] text-slate-400 mt-1">Excellent conceptual grounding</p>
            </div>
          </div>

          {/* Detailed Topic Cards */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
              Curriculum Performance Breakdown
            </h2>

            <div className="space-y-3">
              {topics.map((item) => {
                let badgeClass = "bg-rose-500/20 text-rose-300 border-rose-500/30";
                let label = "Needs Practice";
                let barColor = "bg-rose-500";

                if (item.status === "MODERATE") {
                  badgeClass = "bg-amber-500/20 text-amber-300 border-amber-500/30";
                  label = "Moderate";
                  barColor = "bg-amber-500";
                } else if (item.status === "STRONG") {
                  badgeClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                  label = "Strong";
                  barColor = "bg-emerald-500";
                }

                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 transition-all hover:border-slate-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${badgeClass}`}>
                            {label}
                          </span>
                          <h3 className="text-sm font-bold text-white">{item.name}</h3>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.category} • Tested across {item.totalQuestions} questions
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="text-base font-extrabold text-white">{item.accuracyPct}%</div>
                          <span className="text-[10px] text-slate-500">Accuracy</span>
                        </div>

                        <Link
                          href={`/student/practice`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                        >
                          <span>Drill Topic</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>

                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${Math.min(100, Math.max(0, item.accuracyPct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
