# REST API Specification (Phase 12 Unified Architecture)

This document defines the comprehensive REST API contracts, standard request/response envelopes, authentication headers, error formats, and endpoint route specifications for the **AI Live Paper Generator** platform.

---

## 1. Global Conventions & Standards

### 1.1 Base URL
All API routes are prefixed under:
`/api`

### 1.2 Unified Response Envelope
All endpoints return standard JSON envelopes conforming to `apiSuccess` / `apiError`:

#### Success Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-10-05T15:00:00.000Z",
    "requestId": "req_abc123"
  }
}
```

#### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Input validation error",
    "details": [
      {
        "field": "totalQuestions",
        "issue": "Expected integer greater than 0"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-10-05T15:00:00.000Z",
    "requestId": "req_abc123"
  }
}
```

---

## 2. API Route Surface Inventory

| Target Route | Method(s) | Auth Required | RBAC Permission | Input Summary | Output Summary | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/auth` | `GET`, `POST` | Optional / Bearer | Public / User | `LoginSchema`, `RegisterSchema` | Session token (`sat_...`), user info | IMPLEMENTED |
| `/api/boards` | `GET`, `POST` | GET: Public, POST: Admin | `MANAGE_CURRICULUM` | `CreateBoardSchema` | List of boards or created board | IMPLEMENTED |
| `/api/classes` | `GET`, `POST` | GET: Public, POST: Admin | `MANAGE_CURRICULUM` | `academicYearId`, `CreateClassSchema` | Grade levels / created class | IMPLEMENTED |
| `/api/subjects` | `GET`, `POST` | GET: Public, POST: Admin | `MANAGE_CURRICULUM` | `classId`, `CreateSubjectSchema` | Subjects offered / created subject | IMPLEMENTED |
| `/api/books` | `GET`, `POST` | GET: Public, POST: Admin | `MANAGE_CURRICULUM` | `subjectId`, `CreateBookSchema` | Prescribed books / created book | IMPLEMENTED |
| `/api/books/upload` | `POST` | Authenticated | `MANAGE_CURRICULUM` | Multipart: `file`, `bookId`, `autoProcess` | Registered document metadata, checksum | IMPLEMENTED |
| `/api/books/process` | `POST` | Authenticated | `MANAGE_CURRICULUM` | `{ documentId }` or `{ bookId }` | Processing status, quality report | IMPLEMENTED |
| `/api/books/status` | `GET` | Authenticated | `READ_CURRICULUM` | Query: `documentId` or `bookId` | Extraction status, pageCount, logs | IMPLEMENTED |
| `/api/syllabus` | `GET`, `POST` | GET: Public, POST: Officer | `MANAGE_CURRICULUM` | `CreateSyllabusSchema`, filters | Verified syllabus tree / created syllabus | IMPLEMENTED |
| `/api/sample-papers` | `GET`, `POST` | Authenticated | `READ_CURRICULUM` | Filters / `SamplePaper` payload | Sample examination papers list | IMPLEMENTED |
| `/api/sample-papers/analyze` | `POST` | Authenticated | `MANAGE_CURRICULUM` | `AnalyzePatternSchema` | Learned paper pattern specification | IMPLEMENTED |
| `/api/patterns` | `GET`, `POST` | Authenticated | `READ_CURRICULUM` | Query filters / Pattern payload | Active paper patterns list | IMPLEMENTED |
| `/api/patterns/:id` | `GET`, `PUT`, `DELETE` | Authenticated | `READ_CURRICULUM` | Pattern ID parameter | Pattern detail specification | IMPLEMENTED |
| `/api/questions` | `GET`, `POST` | GET: Public/Student, POST: Staff | `VALIDATE_QUESTION` | Filters / `CreateQuestionSchema` | Questions list (sanitized for student) | IMPLEMENTED |
| `/api/questions/generate` | `POST` | Authenticated | `GENERATE_PAPER` | `GenerateQuestionRequestSchema` | AI synthesized candidate with provenance | IMPLEMENTED |
| `/api/questions/validate` | `POST` | Authenticated | `VALIDATE_QUESTION` | Candidate object or `{ questionId }` | Quality, grounding & syllabus report | IMPLEMENTED |
| `/api/papers` | `GET`, `POST` | Authenticated | `TAKE_EXAM` / `GENERATE_PAPER` | Query filters / Blueprint assembly | Generated examination papers list | IMPLEMENTED |
| `/api/papers/generate` | `POST` | Authenticated | `GENERATE_PAPER` | Hierarchy configs or blueprintId | Assembled & activated live paper | IMPLEMENTED |
| `/api/papers/:id` | `GET` | Authenticated | `TAKE_EXAM` | Paper ID parameter | Paper view (sanitized for student) | IMPLEMENTED |
| `/api/exams` | `GET`, `POST` | Authenticated | `TAKE_EXAM` | Query filters / action parameter | Active papers and student attempts | IMPLEMENTED |
| `/api/exams/:id/start` | `POST` | Authenticated | `TAKE_EXAM` | `{ studentId, studentName }` | Active attempt & sanitized paper view | IMPLEMENTED |
| `/api/exams/:id/answer` | `POST` | Authenticated | `TAKE_EXAM` | `SaveAnswerRequestSchema` | Autosaved answer & server timestamp | IMPLEMENTED |
| `/api/exams/:id/submit` | `POST` | Authenticated | `TAKE_EXAM` | `SubmitAttemptRequestSchema` | Final evaluated attempt & scorecard | IMPLEMENTED |
| `/api/results` | `GET` | Authenticated | `VIEW_OWN_RESULT` | Query: `studentId`, `paperId` | Candidate examination scorecards | IMPLEMENTED |
| `/api/results/:id` | `GET` | Authenticated | `VIEW_OWN_RESULT` | Attempt ID parameter | Comprehensive evaluation scorecard | IMPLEMENTED |
| `/api/admin/*` | `GET`, `POST` | Authenticated | `SYSTEM_SETTINGS` / `ADMIN` | Admin operation payloads | System readiness, health, audit logs | IMPLEMENTED |

---

## 3. Security & Safety Gates

1. **Authentication & RBAC**:
   - Session tokens use `sat_<sha256>` generated by `ServerAuthService`.
   - Admin routes explicitly deny `STUDENT` roles with `403 Forbidden`.
   - Students cannot view correct answers or scoring rubrics before paper submission.

2. **Deterministic Syllabus Safety Gate**:
   - Chunks marked `EXCLUDED`, `UNKNOWN`, or `REQUIRES_REVIEW` are strictly quarantined from question generation context.
   - Granular scopes remain solely: `SUBTOPIC`, `HEADING`, `EXERCISE_QUESTION`.
   - `PAGE_RANGE` is strictly prohibited.

3. **Server-Authoritative Timing**:
   - Exam expiry is calculated on the server at attempt start (`expiresAt`).
   - Answers submitted after server expiry plus grace period are rejected with `403 ATTEMPT_EXPIRED`.
