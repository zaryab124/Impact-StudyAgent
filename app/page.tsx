import Link from "next/link";
import {
  ShieldCheck,
  Cpu,
  Layers,
  FileCheck2,
  Database,
  ArrowRight,
  Sparkles,
  GitBranch,
  Percent,
} from "lucide-react";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 lg:px-8 lg:pt-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Phase 1 Architecture Active</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
          AI Live Paper Generator
        </h1>

        <p className="mt-4 text-xl font-medium text-indigo-400">
          Book-Grounded • Deterministically Balanced • Cryptographically Provenanced
        </p>

        <p className="mx-auto mt-6 max-w-3xl text-base sm:text-lg text-slate-300">
          An enterprise-grade educational examination platform. Ingests curriculum textbooks,
          official syllabi, and sample paper patterns to generate balanced examination papers
          with programmatic 33% difficulty allocation and strict provenance guarantees.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all"
          >
            <span>Explore Paper Blueprint</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/health"
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-all"
          >
            <span>System Health Probe</span>
          </Link>
        </div>
      </section>

      {/* Architectural Pillars Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Architectural Pillars</h2>
          <p className="mt-2 text-sm text-slate-400">
            Engineered to eliminate LLM arithmetic hallucinations and ensure rigorous curriculum alignment.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20">
              <Percent className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Deterministic 33% Difficulty</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Total marks and question quotas are calculated programmatically by the application runtime using largest-remainder integer rounding (33% Easy, 33% Medium, 33% Hard). The LLM never calculates paper sums.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Verifiable Question Provenance</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Every question is immutably anchored to source textbook documents, chapters, topics, page numbers, and chunk IDs, accompanied by generation timestamps and model signatures.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 mb-4 border border-sky-500/20">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Provider-Agnostic AI Adapter</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Pluggable adapter interface isolating core business logic. Defaults to Google Gemini, with architectural readiness for OpenAI, Anthropic, or on-premise open weights.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/20">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Hierarchical Curriculum Modeling</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Dynamic 7-tier hierarchy: Board → Academic Year → Class → Subject → Book → Chapter → Topic. Boards like BISE Lahore or Federal Board are configured purely as data.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 mb-4 border border-purple-500/20">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">pgvector Knowledge Store</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              PostgreSQL schema optimized with native pgvector extension (768-dimensional embeddings), preparing for dense vector retrieval over parsed textbook pages.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 mb-4 border border-rose-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Role-Based Security & Auditing</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Discrete authorization matrices for Students, Teachers, Examiners, and Administrators, backed by server-side secrets and append-only audit trail logging.
            </p>
          </div>
        </div>
      </section>

      {/* Multi-Phase Roadmap Preview */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-slate-800/80">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <GitBranch className="h-6 w-6 text-indigo-400" />
          <span>Implementation Roadmap</span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-5">
          <div className="rounded-lg border border-indigo-500 bg-indigo-950/40 p-4">
            <span className="text-xs font-bold text-indigo-400">PHASE 1 (ACTIVE)</span>
            <h4 className="font-semibold text-white mt-1">Foundation & Architecture</h4>
            <p className="text-xs text-slate-400 mt-2">
              Prisma 22-entity schema, pgvector, AI adapter, deterministic engine, and shell.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 opacity-70">
            <span className="text-xs font-bold text-slate-400">PHASE 2</span>
            <h4 className="font-semibold text-white mt-1">Textbook Ingestion & RAG</h4>
            <p className="text-xs text-slate-400 mt-2">
              PDF parsing, OCR, chunking pipeline, and embedding generation.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 opacity-70">
            <span className="text-xs font-bold text-slate-400">PHASE 3</span>
            <h4 className="font-semibold text-white mt-1">AI Question & Paper Gen</h4>
            <p className="text-xs text-slate-400 mt-2">
              Book-grounded prompts, provenance linking, and full paper assembly.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 opacity-70">
            <span className="text-xs font-bold text-slate-400">PHASE 4</span>
            <h4 className="font-semibold text-white mt-1">Online Examination</h4>
            <p className="text-xs text-slate-400 mt-2">
              Secure student examination interface, timers, and autosave.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 opacity-70">
            <span className="text-xs font-bold text-slate-400">PHASE 5</span>
            <h4 className="font-semibold text-white mt-1">Evaluation & Analytics</h4>
            <p className="text-xs text-slate-400 mt-2">
              Objective scoring, AI rubric grading, and performance diagnostic scorecards.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
