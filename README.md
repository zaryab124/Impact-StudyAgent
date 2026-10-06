# AI Live Paper Generator (Phase 1: Foundation & Architecture)

An enterprise-grade educational examination platform designed to ingest authorized textbooks, model exam patterns, syllabus blueprints, and generate mathematically balanced, book-grounded examination papers with verifiable provenance.

---

## 🌟 Executive Summary

The **AI Live Paper Generator** transforms curriculum textbooks, official syllabi, and sample question patterns into high-stakes, balanced exam papers. Built with a deterministic core, the platform ensures that question counts, mark allocations, and a **33% Easy / 33% Medium / 33% Difficult** distribution are computed programmatically by the application runtime—guaranteeing zero hallmarked or miscalculated totals from LLMs.

> **Current Milestone: Phase 1 (Foundation & Architecture)**  
> In accordance with architectural boundaries, Phase 1 establishes the structural, database, security, and interface foundations. Ingestion pipelines (OCR/chunking/embeddings), RAG retrieval, AI question generation, and real-time exam scoring will be implemented in subsequent phases.

---

## 🏛️ Core Architectural Pillars

1. **Provider-Agnostic AI Abstraction**: Clean adapter interfaces decoupling core business logic from specific LLM providers (Google Gemini, OpenAI, Anthropic).
2. **Strict Deterministic Blueprinting**: LLMs generate individual question items grounded in textbook chunks; the application calculates, aggregates, and enforces all marks, sections, and difficulty totals.
3. **Traceable Question Provenance**: Every question is bound to source documents, books, chapters, topics, specific page numbers, chunk IDs, generation model, timestamp, and verification status.
4. **Hierarchical Curriculum & Exam Modeling**: Dynamic data modeling for Educational Hierarchies (`Board` -> `AcademicYear` -> `Class` -> `Subject` -> `Book` -> `Chapter` -> `Topic`) and Examination Hierarchies (`SamplePaper` -> `PaperPattern` -> `Section` -> `QuestionType` -> `Question` -> `Marks` -> `Difficulty`).
5. **pgvector Ready**: Native schema readiness for vector embeddings in PostgreSQL.

---

## 📂 Project Directory Structure

```
.
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Authentication pages placeholder
│   ├── admin/                  # Administrative management console
│   ├── dashboard/              # Examination & blueprint workspace
│   ├── health/                 # Interactive subsystem health monitor
│   ├── student/                # Student exam portal placeholder
│   ├── api/                    # REST API Route Handlers
│   │   ├── academic-years/     # Academic calendar management
│   │   ├── admin/              # Administrative diagnostic endpoints
│   │   ├── auth/               # Session & token handlers
│   │   ├── boards/             # Educational board entities
│   │   ├── books/              # Textbook catalog
│   │   ├── classes/            # Grade/Class tiers
│   │   ├── exams/              # Exam attempt session lifecycle
│   │   ├── health/             # Live health status probe
│   │   ├── papers/             # Paper generation & blueprint requests
│   │   ├── patterns/           # Examination section/pattern templates
│   │   ├── questions/          # Question bank with provenance metadata
│   │   ├── results/            # Performance analytics & scoring
│   │   ├── sample-papers/      # Reference examination papers
│   │   ├── subjects/           # Subject catalog
│   │   └── syllabus/           # Syllabus & learning outcomes
│   ├── layout.tsx              # Application shell & navigation
│   ├── page.tsx                # Landing & feature presentation page
│   └── globals.css             # Tailwind base styles
├── components/                 # Reusable UI components
│   ├── layout/                 # Navbar, Footer, Shell
│   └── ui/                     # Badges, Status indicators, Metric cards
├── docs/                       # Comprehensive System Documentation
│   ├── ARCHITECTURE.md         # Full system architecture
│   ├── DATABASE_SCHEMA.md      # Schema ERD & entity dictionary
│   ├── API_SPEC.md             # REST API specifications
│   ├── AI_PIPELINE.md          # Multi-provider RAG & LLM pipeline
│   ├── SECURITY.md             # RBAC, audit logging & threat model
│   ├── TEST_PLAN.md            # Verification & testing strategy
│   └── DEVELOPMENT_PHASES.md   # Roadmap across Phases 1-5
├── lib/                        # Core utilities & abstractions
│   ├── ai/                     # AI provider abstraction layer (Gemini, etc.)
│   ├── blueprint/              # Deterministic blueprint calculation engine
│   ├── validations/            # Zod validation schemas
│   ├── api-response.ts         # Standardized API response formatters
│   ├── db.ts                   # Prisma client singleton
│   ├── errors.ts               # Custom application exceptions
│   ├── rate-limit.ts           # Token bucket rate limiting helper
│   └── security.ts             # Security and sanitization utilities
├── prisma/
│   ├── schema.prisma           # 22-entity production database schema
│   └── seed.ts                 # Reference data seeder
├── prompts/                    # System prompt templates for Phase 2/3
├── public/                     # Static assets
├── scripts/                    # Utility and deployment scripts
├── server/                     # Server-side business logic
│   ├── audit-logger.ts         # Security audit logging engine
│   └── rbac.ts                 # Role-Based Access Control matrix
├── tests/                      # Vitest test suites
│   ├── unit/                   # Deterministic rounding & schema tests
│   └── integration/            # API & health check tests
├── types/                      # TypeScript domain definitions
├── .env.example                # Safe environment configuration template
├── package.json
└── tsconfig.json
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Node.js >= 20.x or 22.x
- npm >= 10.x
- PostgreSQL instance (optional for Phase 1 verification; mock health state supported)

### 2. Installation
```bash
git clone <repository_url>
cd "c:\Impact studyAgent"
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```
Update `.env` with your database credentials and API key placeholders.

### 4. Database Validation & Code Generation
```bash
npm run prisma:validate
npm run prisma:generate
```

### 5. Running Tests & Quality Checks
```bash
npm run type-check   # Strict TypeScript checking
npm run lint         # ESLint check
npm run test         # Unit & integration tests via Vitest
```

### 6. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application shell, or [http://localhost:3000/health](http://localhost:3000/health) to view the live health monitor.

---

## 📚 Complete Project Documentation

Detailed technical documents are available in the repository root and `/docs` folder:
- [Architecture Blueprint](docs/ARCHITECTURE.md)
- [Database Schema & ERD](docs/DATABASE_SCHEMA.md)
- [REST API Specification](docs/API_SPEC.md)
- [AI Pipeline & Ingestion Architecture](docs/AI_PIPELINE.md)
- [Security & Compliance Framework](docs/SECURITY.md)
- [Comprehensive Test Plan](docs/TEST_PLAN.md)
- [Development Phases & Milestones](docs/DEVELOPMENT_PHASES.md)

---

## ⚖️ License
Proprietary & Confidential - Educational Examination System Platform.
