# Security Architecture & Threat Model

This document outlines the security controls, authentication standards, Role-Based Access Control (RBAC) matrix, API key protections, rate limiting, and audit logging for the **AI Live Paper Generator** platform.

---

## 1. Threat Model & Mitigations

| Threat | Target Area | Impact | Architectural Mitigation |
| :--- | :--- | :--- | :--- |
| **API Key Leakage** | AI Provider (Gemini / OpenAI) | Financial & reputational loss | Keys stored exclusively in server environment; forbidden in client bundles (`NEXT_PUBLIC_*`). Protected by server boundary. |
| **Question Tampering** | Question Repository | Exam integrity breach | Questions linked with SHA-256 source document checksums and immutable `QuestionSource` audit records. |
| **Prompt Injection** | AI Question Generator | Generation of ungrounded or biased content | Strict delimiter sandboxing; LLM inputs restricted to authorized textbook chunks; output parsed strictly via Zod JSON schemas. |
| **DDoS / Resource Exhaustion** | API Endpoints | Denial of service, excessive AI billing | Token bucket rate limiting per IP / User; strict file upload size caps (50MB). |
| **Privilege Escalation** | Admin / Examiner APIs | Unauthorized paper release or grading alterations | Granular RBAC middleware evaluated server-side on every protected route. |

---

## 2. Role-Based Access Control (RBAC) Matrix

The system defines four discrete roles:
1. `STUDENT`: Takes assigned exams and reviews personal results.
2. `TEACHER`: Designs blueprints, generates draft papers, and manages curriculum mappings.
3. `EXAMINER`: Validates question banks, audits blueprints, and finalizes official examinations.
4. `ADMIN`: Manages platform configuration, boards, user permissions, and audits security logs.

| Action / Permission | STUDENT | TEACHER | EXAMINER | ADMIN |
| :--- | :---: | :---: | :---: | :---: |
| `READ_CURRICULUM` | ✅ | ✅ | ✅ | ✅ |
| `TAKE_EXAM` | ✅ | ❌ | ❌ | ❌ |
| `VIEW_OWN_RESULT` | ✅ | ❌ | ❌ | ❌ |
| `CREATE_BLUEPRINT` | ❌ | ✅ | ✅ | ✅ |
| `GENERATE_PAPER` | ❌ | ✅ | ✅ | ✅ |
| `VALIDATE_QUESTION`| ❌ | ❌ | ✅ | ✅ |
| `PUBLISH_EXAM` | ❌ | ❌ | ✅ | ✅ |
| `MANAGE_USERS` | ❌ | ❌ | ❌ | ✅ |
| `VIEW_AUDIT_LOGS` | ❌ | ❌ | ❌ | ✅ |
| `SYSTEM_SETTINGS` | ❌ | ❌ | ❌ | ✅ |

---

## 3. Server-Side Secret Management

- AI provider keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) and database credentials (`DATABASE_URL`, `DIRECT_URL`) must never be exposed to the browser.
- Next.js server components and Route Handlers (`app/api/*`) are the only execution environments permitted to read these variables.
- Any attempt to import server-side modules into client components is prevented by TypeScript and bundler checks.

---

## 4. Audit Logging & Non-Repudiation

The `AuditLog` service records security-critical actions with:
- Timestamp (UTC)
- Actor ID & Session
- Action Name (e.g., `PAPER_PUBLISHED`, `BLUEPRINT_MODIFIED`)
- Resource Type & ID
- Client IP Address
- User Agent
- Contextual metadata diff

All audit records are append-only.
