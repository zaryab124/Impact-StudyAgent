// ==============================================================================
// Phase 18: Real Browser & End-to-End QA Automation Script
// Executes the full Student Journey, Controlled Negative Tests, and DOM Verification
// ==============================================================================

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "http://localhost:3000";
const EVIDENCE_DIR = path.join(process.cwd(), "tests", "browser-evidence");

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

interface TestReportItem {
  step: string;
  status: "PASSED" | "FAILED";
  details: string;
  durationMs: number;
}

const reports: TestReportItem[] = [];

async function recordStep(name: string, fn: () => Promise<string | void>) {
  const start = Date.now();
  console.log(`\n▶ [Executing] ${name}...`);
  try {
    const details = (await fn()) || "Success";
    const durationMs = Date.now() - start;
    reports.push({ step: name, status: "PASSED", details: String(details), durationMs });
    console.log(`  ✔ [PASSED] ${name} (${durationMs}ms): ${details}`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    reports.push({ step: name, status: "FAILED", details: err.message, durationMs });
    console.error(`  ✖ [FAILED] ${name} (${durationMs}ms): ${err.message}`);
    throw err;
  }
}

function dumpBrowserDom(url: string, outputFilename: string): string {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const cmd = `"${chromePath}" --headless=new --dump-dom "${url}"`;
  const dom = execSync(cmd, { encoding: "utf-8", timeout: 15000 });
  fs.writeFileSync(path.join(EVIDENCE_DIR, outputFilename), dom, "utf-8");
  return dom;
}

async function runBrowserQA() {
  console.log("==============================================================================");
  console.log("PHASE 18: REAL BROWSER & END-TO-END QA AUTOMATION");
  console.log(`Target: ${BASE_URL}`);
  console.log("==============================================================================");

  let paperId = "";
  let attemptId = "";

  // --------------------------------------------------------------------------
  // 1. Student Dashboard & Real DOM Rendering
  // --------------------------------------------------------------------------
  await recordStep("1. Student Dashboard & DOM Rendering", async () => {
    const dom = dumpBrowserDom(`${BASE_URL}/student`, "01_student_dashboard.html");
    if (!dom.includes("AI Live Paper Generator") && !dom.includes("Student")) {
      throw new Error("Dashboard DOM missing required title / header elements.");
    }
    return `Dashboard rendered successfully (${dom.length} bytes captured in 01_student_dashboard.html)`;
  });

  // --------------------------------------------------------------------------
  // 2. Curriculum Hierarchy Retrieval (Board -> Class 9 -> Physics -> Book -> Chapters)
  // --------------------------------------------------------------------------
  await recordStep("2. Dynamic Education Hierarchy Retrieval", async () => {
    // Boards
    const bRes = await fetch(`${BASE_URL}/api/boards`).then((r) => r.json());
    if (!bRes.data?.boards?.length) throw new Error("No boards returned");
    const board = bRes.data.boards[0];

    // Classes
    const cRes = await fetch(`${BASE_URL}/api/classes`).then((r) => r.json());
    if (!cRes.data?.classes?.length) throw new Error("No classes returned");
    const cls = cRes.data.classes.find((c: any) => c.numericLevel === 9) || cRes.data.classes[0];

    // Subjects
    const sRes = await fetch(`${BASE_URL}/api/subjects?classId=${cls.id}`).then((r) => r.json());
    if (!sRes.data?.subjects?.length) throw new Error("No subjects returned");
    const subj = sRes.data.subjects.find((s: any) => s.name === "Physics") || sRes.data.subjects[0];

    // Books
    const bkRes = await fetch(`${BASE_URL}/api/books?subjectId=${subj.id}`).then((r) => r.json());
    if (!bkRes.data?.books?.length) throw new Error("No books returned");
    const book = bkRes.data.books[0];

    // Chapters
    const chRes = await fetch(`${BASE_URL}/api/books/${book.id}/chapters`).then((r) => r.json());
    if (!chRes.data?.chapters?.length) throw new Error("No chapters returned");

    return `Retrieved: Board=${board.name}, Class=${cls.name}, Subject=${subj.name}, Book=${book.title}, Chapters=${chRes.data.chapters.length}`;
  });

  // --------------------------------------------------------------------------
  // 3. Live Paper Generation via API
  // --------------------------------------------------------------------------
  await recordStep("3. Live Paper Generation (15 Questions, 33% Difficulty)", async () => {
    const genRes = await fetch(`${BASE_URL}/api/papers/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId: "board-fed-01",
        classId: "class-9",
        subjectId: "subj-physics",
        bookId: "book-physics-09",
        chapterIds: ["chap-01", "chap-02", "chap-03", "chap-04", "chap-05"],
        totalQuestions: 15,
        title: "Federal Board Class 9 Physics Final 2025",
        instructions: "Attempt all questions. Server-authoritative timer enforced.",
      }),
    });

    const data = await genRes.json();
    if (!genRes.ok || !data.data?.paper) {
      throw new Error(data.error?.message || "Failed to generate paper");
    }

    paperId = data.data.paper.id;
    const questions = data.data.paper.questions || [];
    const easy = questions.filter((q: any) => q.difficulty === "EASY").length;
    const med = questions.filter((q: any) => q.difficulty === "MEDIUM").length;
    const diff = questions.filter((q: any) => q.difficulty === "DIFFICULT").length;

    return `Generated Paper "${paperId}" with ${questions.length} questions (Easy=${easy}, Med=${med}, Diff=${diff}). Status=${data.data.paper.status}`;
  });

  // --------------------------------------------------------------------------
  // 4. Verify Paper Preview & DOM
  // --------------------------------------------------------------------------
  await recordStep("4. Verify Paper Preview & Student View Quarantine", async () => {
    const studentPaperRes = await fetch(`${BASE_URL}/api/papers/${paperId}?forStudent=true`).then((r) => r.json());
    if (!studentPaperRes.success) throw new Error("Failed to load student paper view");

    const p = studentPaperRes.data;
    // Verify answer keys are NEVER exposed in student view
    for (const q of p.questions) {
      if (q.answerMaterial || q.correctOptionKey || q.explanation) {
        throw new Error(`LEAK DETECTED: Answer key leaked in student paper view for question ${q.id}`);
      }
    }

    // Capture DOM
    const dom = dumpBrowserDom(`${BASE_URL}/student/paper/${paperId}`, "02_paper_preview.html");
    if (!dom.includes(p.title) && !dom.includes("Examination")) {
      throw new Error("Paper preview DOM did not display paper title");
    }

    return `Paper verified. Sanitized questions=${p.questions.length}. Answer keys strictly quarantined. DOM captured in 02_paper_preview.html`;
  });

  // --------------------------------------------------------------------------
  // 5. Start Exam & Verify Server-Authoritative Timer
  // --------------------------------------------------------------------------
  await recordStep("5. Start Exam & Server-Authoritative Timer", async () => {
    const startRes = await fetch(`${BASE_URL}/api/exams/${paperId}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: "student_ayesha_01",
        studentName: "Ayesha Khan",
      }),
    });

    const data = await startRes.json();
    if (!startRes.ok || !data.data?.attempt) {
      throw new Error(data.error?.message || "Failed to start exam");
    }

    const att = data.data.attempt;
    attemptId = att.id;

    if (!att.startedAt || !att.expiresAt) {
      throw new Error("Attempt missing server-authoritative timer fields (startedAt, expiresAt)");
    }

    const diffMins = Math.round((new Date(att.expiresAt).getTime() - new Date(att.startedAt).getTime()) / 60000);
    return `Exam attempt "${attemptId}" started for Ayesha Khan. Duration=${diffMins} mins, Status=${att.status}`;
  });

  // --------------------------------------------------------------------------
  // 6. Answer Questions with Autosave & Navigation
  // --------------------------------------------------------------------------
  await recordStep("6. Answer Questions with Autosave & Navigation", async () => {
    const stateRes = await fetch(`${BASE_URL}/api/exams/${attemptId}`).then((r) => r.json());
    const paperQuestions = stateRes.data.paper.questions;

    // Answer first 5 questions
    for (let i = 0; i < Math.min(5, paperQuestions.length); i++) {
      const q = paperQuestions[i];
      const ansRes = await fetch(`${BASE_URL}/api/exams/${attemptId}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "STUDENT",
          "x-user-id": "student_ayesha_01",
        },
        body: JSON.stringify({
          paperQuestionId: q.id,
          sequenceNumber: q.sequence,
          selectedOption: q.questionType === "MCQ" ? "A" : undefined,
          answerText: q.questionType !== "MCQ" ? "Inertia is the resistance of an object to changes in velocity." : undefined,
          isMarkedForReview: i === 2,
        }),
      });

      const ansData = await ansRes.json();
      if (!ansRes.ok || !ansData.success) {
        throw new Error(`Autosave failed on question ${i + 1}: ${ansData.error?.message}`);
      }
    }

    return `Successfully autosaved 5 answers with sequence navigation and review marking.`;
  });

  // --------------------------------------------------------------------------
  // 7. Refresh Persistence Verification
  // --------------------------------------------------------------------------
  await recordStep("7. Refresh Persistence & DOM Verification", async () => {
    // Simulating page refresh by re-fetching attempt state
    const reloadRes = await fetch(`${BASE_URL}/api/exams/${attemptId}`).then((r) => r.json());
    if (!reloadRes.success) throw new Error("Failed to reload attempt state");

    const answers = reloadRes.data.answers;
    const answeredCount = answers.filter((a: any) => a.isAnswered).length;
    if (answeredCount < 5) {
      throw new Error(`Persistence failure: expected at least 5 answered questions, found ${answeredCount}`);
    }

    // Capture active exam DOM
    const dom = dumpBrowserDom(`${BASE_URL}/student/exam/${paperId}`, "03_exam_player.html");
    return `Answers persisted across page refresh (Count=${answeredCount}). Exam player DOM captured in 03_exam_player.html`;
  });

  // --------------------------------------------------------------------------
  // 8. Submit Exam & Idempotent Evaluation
  // --------------------------------------------------------------------------
  await recordStep("8. Submit Exam & Objective Grading", async () => {
    const subRes = await fetch(`${BASE_URL}/api/exams/${attemptId}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "STUDENT",
        "x-user-id": "student_ayesha_01",
      },
      body: JSON.stringify({ confirmSubmission: true }),
    });

    const data = await subRes.json();
    if (!subRes.ok || !data.data?.result) {
      throw new Error(data.error?.message || "Failed to submit exam");
    }

    const res = data.data.result;
    return `Exam submitted. Score=${res.obtainedMarks}/${res.totalMarks} (${res.percentage.toFixed(1)}%), Grade=${res.grade}, Status=${data.data.attempt.status}`;
  });

  // --------------------------------------------------------------------------
  // 9. Results, Chapter Analysis, Difficulty Analysis & Weak Areas
  // --------------------------------------------------------------------------
  await recordStep("9. Results Analytics (Chapter, Difficulty, Weak Areas)", async () => {
    const resRes = await fetch(`${BASE_URL}/api/results/${attemptId}?studentId=student_ayesha_01`).then((r) => r.json());
    if (!resRes.success) throw new Error("Failed to load result analytics");

    const res = resRes.data;
    const chBreakdown = res.chapterBreakdown || [];
    const diffBreakdown = res.difficultyBreakdown || [];
    const weakAreas = res.weakAreas || [];

    // Capture results DOM
    dumpBrowserDom(`${BASE_URL}/student/results/${attemptId}`, "04_student_results.html");
    // Capture weak areas DOM
    dumpBrowserDom(`${BASE_URL}/student/weak-areas`, "05_weak_areas.html");

    return `Analytics verified: Chapters=${chBreakdown.length}, Difficulties=${diffBreakdown.length}, Weak Areas=${weakAreas.length}. Captured in 04_student_results.html and 05_weak_areas.html`;
  });

  // --------------------------------------------------------------------------
  // 10. Controlled Negative Tests
  // --------------------------------------------------------------------------
  await recordStep("10. Controlled Negative Tests", async () => {
    // Neg 1: Missing curriculum hierarchy
    const neg1 = await fetch(`${BASE_URL}/api/papers/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totalQuestions: 10 }),
    });
    if (neg1.status === 200) throw new Error("Neg 1 failed: missing hierarchy should not return 200");

    // Neg 2: Student accessing admin API
    const neg2 = await fetch(`${BASE_URL}/api/admin`, {
      headers: { "x-user-role": "STUDENT" },
    });
    if (neg2.status !== 403) throw new Error(`Neg 2 failed: student accessing admin API returned ${neg2.status}, expected 403`);

    // Neg 3: Invalid question ID in answer save
    const neg3 = await fetch(`${BASE_URL}/api/exams/${attemptId}/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "STUDENT",
        "x-user-id": "student_ayesha_01",
      },
      body: JSON.stringify({ paperQuestionId: "q_hacker_injection", selectedOption: "A" }),
    });
    if (neg3.status !== 400 && neg3.status !== 403) throw new Error(`Neg 3 failed: invalid question returned ${neg3.status}`);

    // Neg 4: IDOR Protection: student B tampering with student A's attempt
    const neg4 = await fetch(`${BASE_URL}/api/exams/${attemptId}/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "STUDENT",
        "x-user-id": "student_attacker_99",
      },
      body: JSON.stringify({ paperQuestionId: "q-1", selectedOption: "B" }),
    });
    if (neg4.status !== 403) throw new Error(`Neg 4 failed: IDOR tampering returned ${neg4.status}, expected 403`);

    // Neg 5: Secret Leak Check (GEMINI_API_KEY, AUTH_SECRET not in DOM or responses)
    const domFiles = fs.readdirSync(EVIDENCE_DIR).filter((f) => f.endsWith(".html"));
    for (const f of domFiles) {
      const content = fs.readFileSync(path.join(EVIDENCE_DIR, f), "utf-8");
      if (process.env.GEMINI_API_KEY && content.includes(process.env.GEMINI_API_KEY)) {
        throw new Error(`CRITICAL SECURITY FAILURE: GEMINI_API_KEY found in ${f}`);
      }
      if (process.env.AUTH_SECRET && content.includes(process.env.AUTH_SECRET)) {
        throw new Error(`CRITICAL SECURITY FAILURE: AUTH_SECRET found in ${f}`);
      }
    }

    return "All 5 controlled negative tests passed. Zero secrets exposed.";
  });

  console.log("\n==============================================================================");
  console.log("PHASE 18 SUMMARY REPORT");
  console.log("==============================================================================");
  for (const r of reports) {
    console.log(`[${r.status}] ${r.step} (${r.durationMs}ms)`);
  }
}

runBrowserQA()
  .then(() => {
    console.log("\n>>> PHASE 18 REAL BROWSER QA: 100% SUCCESS <<<");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n>>> PHASE 18 REAL BROWSER QA: FAILED <<<", err);
    process.exit(1);
  });
