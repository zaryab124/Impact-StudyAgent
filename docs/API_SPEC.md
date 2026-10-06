# REST API Specification

This document defines the REST API contracts, standard request/response envelopes, authentication headers, error formats, and endpoint route specifications for the **AI Live Paper Generator** platform.

---

## 1. Global Conventions & Standards

### 1.1 Base URL
All API routes are prefixed under:
`/api`

### 1.2 Unified Response Envelope
All endpoints return standard JSON envelopes:

#### Success Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-09-25T15:00:00.000Z",
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
    "timestamp": "2026-09-25T15:00:00.000Z",
    "requestId": "req_abc123"
  }
}
```

---

## 2. API Endpoints Overview

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System and database health diagnostic probe |
| `POST` | `/api/auth/login` | Public | Authenticate user and issue JWT session |
| `POST` | `/api/auth/register` | Public | Register new student or teacher |
| `GET` | `/api/boards` | Authenticated | List all recognized educational boards |
| `POST` | `/api/boards` | Admin | Create a new educational board |
| `GET` | `/api/academic-years` | Authenticated | Query academic sessions by board |
| `GET` | `/api/classes` | Authenticated | Query grade levels/classes |
| `GET` | `/api/subjects` | Authenticated | Query subjects offered in a class |
| `GET` | `/api/books` | Authenticated | Query textbooks prescribed for a subject |
| `GET` | `/api/syllabus` | Authenticated | Query chapters and topic learning outcomes |
| `GET` | `/api/sample-papers` | Authenticated | Retrieve official sample benchmark papers |
| `GET` | `/api/patterns` | Authenticated | Retrieve board paper pattern structures |
| `POST` | `/api/questions` | Examiner / Admin | Query or manually register questions |
| `POST` | `/api/papers/blueprint` | Teacher / Examiner | Calculate deterministic blueprint (~33% difficulty) |
| `GET` | `/api/papers` | Authenticated | List generated papers |
| `POST` | `/api/papers` | Teacher / Examiner | Trigger paper generation (Phase 3) |
| `POST` | `/api/exams/start` | Student | Initiate a live examination session (Phase 4) |
| `POST` | `/api/exams/submit` | Student | Submit completed answers for scoring (Phase 4) |
| `GET` | `/api/results/:id` | Student / Teacher | Retrieve evaluation result scorecard (Phase 5) |
| `GET` | `/api/admin/audit-logs` | Admin | Query system audit and security logs |
| `GET` | `/api/admin/stats` | Admin | Platform metrics and AI token consumption |

---

## 3. Detailed Endpoint Contracts

### 3.1 Health Diagnostic Check
- **`GET /api/health`**
- **Access**: Public
- **Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptimeSeconds": 1420.5,
    "timestamp": "2026-09-25T15:24:00.000Z",
    "version": "0.1.0",
    "subsystems": {
      "application": "UP",
      "database": "UP"
    }
  }
}
```

### 3.2 Deterministic Blueprint Calculation
- **`POST /api/papers/blueprint`**
- **Access**: `TEACHER`, `EXAMINER`, `ADMIN`
- **Request Body**:
```json
{
  "patternId": "clx_pattern_123",
  "totalQuestions": 10,
  "totalMarks": 50,
  "chapterIds": ["ch_01", "ch_02", "ch_03"]
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "blueprintId": "bp_456",
    "totalQuestions": 10,
    "totalMarks": 50,
    "difficultyDistribution": {
      "easy": 3,
      "medium": 4,
      "difficult": 3,
      "roundingMethod": "largest_remainder_hare_niemeyer"
    },
    "sections": [
      {
        "name": "Section A - Objective",
        "questionCount": 5,
        "marksPerQuestion": 1,
        "totalMarks": 5
      },
      {
        "name": "Section B - Short Questions",
        "questionCount": 5,
        "marksPerQuestion": 9,
        "totalMarks": 45
      }
    ]
  }
}
```

---

## 4. HTTP Status Code Conventions
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Payload validation failed against Zod schema.
- `401 Unauthorized`: Authentication missing or invalid.
- `403 Forbidden`: Authenticated user lacks required RBAC permission.
- `404 Not Found`: Resource does not exist.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Server failure, tracked with error trace ID.
