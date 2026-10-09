"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  Wifi,
  WifiOff,
  RotateCcw,
  HelpCircle,
  Award,
  Upload,
  FileText,
  Camera,
} from "lucide-react";

export default function StudentExamPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const paperId = params.paperId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Exam Data
  const [attempt, setAttempt] = useState<any>(null);
  const [paper, setPaper] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState<string>("");

  // Connection & Save Status
  const [isOnline, setIsOnline] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"SAVED" | "SAVING" | "ERROR">("SAVED");
  const [lastSavedAt, setLastSavedAt] = useState<string>("");

  // Server-Authoritative Timer
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Initialize or fetch attempt
  useEffect(() => {
    async function initExam() {
      try {
        setLoading(true);
        setError(null);

        // Start or retrieve active attempt
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
          throw new Error(data.error?.message || "Failed to start examination.");
        }

        const att = data.data.attempt;
        const p = data.data.paper;

        setAttempt(att);
        setPaper(p);
        if (p.sections?.length > 0) {
          setActiveSectionId(p.sections[0].id);
        }

        // Fetch current answer states if resuming
        const stateRes = await fetch(`/api/exams/${att.id}`);
        if (stateRes.ok) {
          const stateData = await stateRes.json();
          if (stateData.data?.answers) {
            const ansMap: Record<string, any> = {};
            for (const ans of stateData.data.answers) {
              ansMap[ans.paperQuestionId] = ans;
            }
            setAnswers(ansMap);
          }
        }

        // Calculate initial remaining seconds from server expiresAt
        const expiresMs = new Date(att.expiresAt).getTime();
        const diffSecs = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
        setTimeRemainingSeconds(diffSecs);

        if (diffSecs <= 0) {
          setIsExpired(true);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (paperId) {
      initExam();
    }
  }, [paperId]);

  // Submit attempt
  const handleSubmitExam = useCallback(async () => {
    if (!attempt) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/exams/${attempt.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmSubmission: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to submit exam.");
      }

      router.push(`/student/results/${attempt.id}`);
    } catch (err: any) {
      alert(`Submission Error: ${err.message}`);
      setSubmitting(false);
    }
  }, [attempt, router]);

  const handleAutoSubmit = useCallback(() => {
    handleSubmitExam();
  }, [handleSubmitExam]);

  // Countdown Timer
  useEffect(() => {
    if (timeRemainingSeconds === null || isExpired || submitting) return;

    const interval = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemainingSeconds, isExpired, submitting, handleAutoSubmit]);

  // Autosave single answer with debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAutosave = (questionId: string, updatedAnswer: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], ...updatedAnswer },
    }));

    if (!attempt || isExpired) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus("SAVING");

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const payload = {
          paperQuestionId: questionId,
          selectedOption: updatedAnswer.selectedOption ?? null,
          numericAnswer: updatedAnswer.numericAnswer !== undefined ? updatedAnswer.numericAnswer : null,
          answerText: updatedAnswer.answerText ?? null,
          isMarkedForReview: updatedAnswer.isMarkedForReview ?? false,
        };

        const res = await fetch(`/api/exams/${attempt.id}/answers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          if (err.error?.code === "ATTEMPT_EXPIRED") {
            setIsExpired(true);
          }
          setSaveStatus("ERROR");
          return;
        }

        const data = await res.json();
        setSaveStatus("SAVED");
        setLastSavedAt(new Date(data.data.savedAt).toLocaleTimeString());
      } catch {
        setSaveStatus("ERROR");
      }
    }, 400);
  };

  // Format seconds to HH:MM:SS
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-300">Setting up secure examination environment...</p>
        </div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 p-6 text-slate-100">
        <div className="max-w-md rounded-xl border border-rose-900/60 bg-rose-950/40 p-6 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-rose-400" />
          <h2 className="mt-3 text-lg font-bold text-white">Examination Unavailable</h2>
          <p className="mt-2 text-xs text-rose-200">{error || "Paper could not be loaded."}</p>
          <button
            onClick={() => router.push("/admin/exams")}
            className="mt-5 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = paper.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion?.id] || {};

  // Palette metrics
  const answeredCount = Object.values(answers).filter((a: any) => a.isAnswered).length;
  const reviewCount = Object.values(answers).filter((a: any) => a.isMarkedForReview).length;
  const unattemptedCount = paper.questions.length - answeredCount;

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100 select-none">
      {/* Network Alert Banner */}
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 bg-rose-600 px-4 py-2 text-xs font-bold text-white">
          <WifiOff className="h-4 w-4" />
          <span>You are currently offline. Answers will be queued and synced when connection recovers.</span>
        </div>
      )}

      {/* Top Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-indigo-600/20 p-2 text-indigo-400 border border-indigo-500/30">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">{paper.title}</h1>
            <p className="text-[11px] text-slate-400">
              Code: <span className="font-mono text-indigo-300">{paper.paperCode}</span> | Total Marks: {paper.totalMarks} | Questions: {paper.questions.length}
            </p>
          </div>
        </div>

        {/* Status Indicators & Server Timer */}
        <div className="flex items-center gap-6">
          {/* Autosave status */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            {saveStatus === "SAVING" ? (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <span className="h-2 w-2 animate-ping rounded-full bg-amber-400" />
                Saving...
              </span>
            ) : saveStatus === "ERROR" ? (
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                Sync Failed
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="text-[11px] text-slate-400">All changes saved {lastSavedAt && `(${lastSavedAt})`}</span>
              </span>
            )}
          </div>

          {/* Server-Authoritative Timer Box */}
          <div
            className={`flex items-center gap-2.5 rounded-lg border px-4 py-2 font-mono text-sm font-bold tracking-wider ${
              timeRemainingSeconds !== null && timeRemainingSeconds < 300
                ? "border-rose-500/60 bg-rose-950/60 text-rose-300 animate-pulse"
                : "border-slate-700 bg-slate-800/90 text-amber-300"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>{timeRemainingSeconds !== null ? formatTime(timeRemainingSeconds) : "--:--"}</span>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 active:scale-95 transition-all"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Finish & Submit</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Sections & Question Player */}
        <div className="flex flex-1 flex-col overflow-hidden border-r border-slate-800">
          {/* Section Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 py-2 gap-2 overflow-x-auto">
            {paper.sections?.map((sec: any) => {
              const isCurrentSec = sec.id === activeSectionId || sec.name === currentQuestion?.sectionName;
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setActiveSectionId(sec.id);
                    // Find first question in this section
                    const idx = paper.questions.findIndex((q: any) => q.sectionId === sec.id || q.sectionName === sec.sectionName);
                    if (idx !== -1) setCurrentQuestionIndex(idx);
                  }}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                    isCurrentSec
                      ? "bg-indigo-600 text-white shadow"
                      : "bg-slate-800/70 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <span>{sec.sectionName}</span>
                  <span className="rounded-full bg-slate-950/60 px-1.5 py-0.2 text-[10px] text-slate-300">
                    Max: {sec.maximumObtainableMarks}m
                  </span>
                </button>
              );
            })}
          </div>

          {/* Question Viewer */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto max-w-3xl">
              {/* Question Header Meta */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-indigo-500/20 px-2.5 py-1 font-mono text-xs font-bold text-indigo-300 border border-indigo-500/30">
                    Question {currentQuestion.sequence} of {paper.questions.length}
                  </span>
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                    Section: {currentQuestion.sectionName}
                  </span>
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-500/20">
                    {currentQuestion.marks} Mark{currentQuestion.marks > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      triggerAutosave(currentQuestion.id, {
                        ...currentAnswer,
                        isMarkedForReview: !currentAnswer.isMarkedForReview,
                      })
                    }
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                      currentAnswer.isMarkedForReview
                        ? "border-amber-500/60 bg-amber-500/20 text-amber-300"
                        : "border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                    <span>{currentAnswer.isMarkedForReview ? "Marked for Review" : "Mark for Review"}</span>
                  </button>

                  <button
                    onClick={() =>
                      triggerAutosave(currentQuestion.id, {
                        selectedOption: null,
                        numericAnswer: null,
                        answerText: "",
                        isMarkedForReview: false,
                        isAnswered: false,
                      })
                    }
                    className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                    title="Clear response for this question"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="mt-6">
                <p className="text-base font-normal leading-relaxed text-slate-100 whitespace-pre-wrap">
                  {currentQuestion.questionText}
                </p>
              </div>

              {/* Interactive Student Answer Controls */}
              <div className="mt-8">
                {/* 1. MCQ Radio Options */}
                {currentQuestion.questionType === "MCQ" && currentQuestion.options && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Select one correct option:
                    </p>
                    <div className="grid gap-2.5">
                      {currentQuestion.options.map((opt: any) => {
                        const isSelected = currentAnswer.selectedOption === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() =>
                              triggerAutosave(currentQuestion.id, {
                                ...currentAnswer,
                                selectedOption: opt.key,
                                isAnswered: true,
                              })
                            }
                            className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                              isSelected
                                ? "border-indigo-500 bg-indigo-950/40 text-white shadow-md shadow-indigo-950/50"
                                : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-850"
                            }`}
                          >
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold text-xs ${
                                isSelected
                                  ? "bg-indigo-600 text-white"
                                  : "border border-slate-700 bg-slate-800 text-slate-400"
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span className="text-sm font-medium leading-snug">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Numerical Input */}
                {currentQuestion.questionType === "NUMERICAL" && (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Enter Calculated Numerical Value:
                    </label>
                    <div className="mt-3 flex items-center gap-3">
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 9.81"
                        value={currentAnswer.numericAnswer !== undefined && currentAnswer.numericAnswer !== null ? currentAnswer.numericAnswer : ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : parseFloat(e.target.value);
                          triggerAutosave(currentQuestion.id, {
                            ...currentAnswer,
                            numericAnswer: val,
                            isAnswered: val !== null,
                          });
                        }}
                        className="w-64 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 font-mono text-base font-semibold text-white focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-400">Enter final numerical value with correct precision.</span>
                    </div>
                  </div>
                )}

                {/* 3. Subjective / Short Answer / Long Answer with Dual Mode (Type OR Upload Handwritten Paper) */}
                {currentQuestion.questionType !== "MCQ" && currentQuestion.questionType !== "NUMERICAL" && (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                          Short / Long Answer Submission Mode:
                        </label>
                        <p className="text-[11px] text-slate-400">
                          Choose whether to type your solution directly in app or upload a handwritten sheet / PDF.
                        </p>
                      </div>

                      {/* Mode Switcher Tabs */}
                      <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            triggerAutosave(currentQuestion.id, {
                              ...currentAnswer,
                              answerType: "TYPED",
                            });
                          }}
                          className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                            currentAnswer.answerType !== "UPLOADED_SCAN"
                              ? "bg-indigo-600 text-white shadow"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <FileText className="h-3 w-3" />
                          <span>Type in App</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            triggerAutosave(currentQuestion.id, {
                              ...currentAnswer,
                              answerType: "UPLOADED_SCAN",
                            });
                          }}
                          className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                            currentAnswer.answerType === "UPLOADED_SCAN"
                              ? "bg-indigo-600 text-white shadow"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <Upload className="h-3 w-3" />
                          <span>Upload Handwritten Sheet</span>
                        </button>
                      </div>
                    </div>

                    {currentAnswer.answerType === "UPLOADED_SCAN" ? (
                      /* Mode B: Scanned Paper / Screenshot / PDF Upload */
                      <div className="space-y-3">
                        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/70 p-6 text-center hover:border-indigo-500 transition-colors">
                          <Camera className="h-8 w-8 text-indigo-400 mb-2" />
                          <p className="text-xs font-semibold text-slate-200">
                            Upload Photo of Handwritten Paper, Notebook, or PDF
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                            Write your answer clearly on paper, take a photo or scan as PDF, and attach here for AI rubric evaluation.
                          </p>

                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const base64Data = ev.target?.result as string;
                                  triggerAutosave(currentQuestion.id, {
                                    ...currentAnswer,
                                    answerType: "UPLOADED_SCAN",
                                    attachmentUrl: base64Data,
                                    answerText: `[Handwritten Paper Attached: ${file.name}]`,
                                    isAnswered: true,
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="mt-3 text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-500"
                          />
                        </div>

                        {currentAnswer.attachmentUrl && (
                          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-emerald-300">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              <span className="font-semibold">
                                {currentAnswer.answerText || "Handwritten response attached"}
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-mono">Ready for Evaluation</span>
                          </div>
                        )}

                        <div className="pt-1">
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Additional Text / Working Notes (Optional):
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Optional notes or transcription to assist examiner..."
                            value={currentAnswer.answerText?.startsWith("[Handwritten") ? "" : currentAnswer.answerText || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              triggerAutosave(currentQuestion.id, {
                                ...currentAnswer,
                                answerText: val || currentAnswer.answerText,
                                isAnswered: true,
                              });
                            }}
                            className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Mode A: In-App Typed Solution */
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-medium text-slate-400">
                            Type your full explanation, mathematical derivation, or headings:
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {currentAnswer.answerText?.length || 0} characters
                          </span>
                        </div>
                        <textarea
                          rows={8}
                          placeholder="Type your structured explanation, derivation, or answer points here..."
                          value={currentAnswer.answerText || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            triggerAutosave(currentQuestion.id, {
                              ...currentAnswer,
                              answerType: "TYPED",
                              answerText: val,
                              isAnswered: val.trim().length > 0,
                            });
                          }}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm leading-relaxed text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Question Bottom Action Bar */}
          <div className="flex h-16 shrink-0 items-center justify-between border-t border-slate-800 bg-slate-900/60 px-8">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-slate-500 font-mono">
              {currentQuestionIndex + 1} / {paper.questions.length}
            </span>

            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.min(paper.questions.length - 1, prev + 1))}
              disabled={currentQuestionIndex === paper.questions.length - 1}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Question Palette & Overview */}
        <div className="hidden lg:flex w-80 flex-col bg-slate-900/40 p-6 overflow-y-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Question Palette</h3>

          {/* Status summary badges */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-2.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-slate-300 font-medium">Answered: <strong>{answeredCount}</strong></span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-amber-900/40 bg-amber-950/20 p-2.5">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-slate-300 font-medium">Review: <strong>{reviewCount}</strong></span>
            </div>
            <div className="col-span-2 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 p-2.5">
              <span className="h-3 w-3 rounded-full bg-slate-700" />
              <span className="text-slate-400 font-medium">Unattempted: <strong>{unattemptedCount}</strong></span>
            </div>
          </div>

          {/* Palette Grid */}
          <div className="mt-6 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Jump to question</p>
            <div className="grid grid-cols-5 gap-2">
              {paper.questions.map((q: any, idx: number) => {
                const ans = answers[q.id];
                const isCurrent = idx === currentQuestionIndex;
                const isAns = ans?.isAnswered;
                const isRev = ans?.isMarkedForReview;

                let colorClasses = "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700";
                if (isRev) {
                  colorClasses = "border-amber-500/80 bg-amber-500/20 text-amber-300 font-bold";
                } else if (isAns) {
                  colorClasses = "border-emerald-600 bg-emerald-600 text-white font-bold";
                }

                if (isCurrent) {
                  colorClasses += " ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-10 w-full rounded-lg border text-xs transition-all flex items-center justify-center font-mono ${colorClasses}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Submit Block */}
          <div className="mt-6 border-t border-slate-800 pt-4">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 transition-all"
            >
              Submit Paper
            </button>
          </div>
        </div>
      </div>

      {/* Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Confirm Paper Submission</h3>
            <p className="mt-1 text-xs text-slate-400">
              Are you sure you want to end your exam attempt? Once submitted, your answers cannot be modified.
            </p>

            {/* Quick summary stats */}
            <div className="mt-5 space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-medium">
              <div className="flex justify-between text-emerald-400">
                <span>Attempted Questions:</span>
                <span className="font-bold">{answeredCount} of {paper.questions.length}</span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span>Marked for Review:</span>
                <span className="font-bold">{reviewCount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Unattempted Questions:</span>
                <span className="font-bold">{unattemptedCount}</span>
              </div>
              <div className="flex justify-between text-indigo-300 pt-2 border-t border-slate-800">
                <span>Time Remaining:</span>
                <span className="font-mono font-bold">{timeRemainingSeconds !== null ? formatTime(timeRemainingSeconds) : "00:00"}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Resume Exam
              </button>
              <button
                onClick={handleSubmitExam}
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-950"
              >
                {submitting ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Confirm & Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
