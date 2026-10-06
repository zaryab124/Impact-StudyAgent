# Database Schema & Entity Specification

This document details the complete relational and vector database schema for the **AI Live Paper Generator** platform, powered by PostgreSQL, Prisma ORM, and the `pgvector` extension.

---

## 1. Entity-Relationship Overview

```mermaid
erDiagram
    User ||--o{ AuditLog : generates
    User ||--o{ ExamAttempt : takes
    User ||--o{ GeneratedPaper : authors

    Board ||--o{ AcademicYear : regulates
    AcademicYear ||--o{ Class : includes
    Class ||--o{ Subject : offers
    Subject ||--o{ Book : prescribes
    Book ||--o{ Chapter : contains
    Chapter ||--o{ Topic : contains

    Book ||--o{ Document : backed_by
    Document ||--o{ DocumentPage : split_into
    DocumentPage ||--o{ DocumentChunk : indexed_as

    Subject ||--o{ SamplePaper : has
    SamplePaper ||--o{ PaperPattern : exemplifies
    PaperPattern ||--o{ PaperSection : structured_into
    PaperPattern ||--o{ PaperBlueprint : defines_spec_for

    PaperBlueprint ||--o{ GeneratedPaper : instantiated_into
    GeneratedPaper ||--o{ GeneratedQuestion : contains
    Question ||--o{ GeneratedQuestion : referenced_in

    Question ||--|| QuestionSource : verified_by
    DocumentChunk ||--o{ QuestionSource : anchors

    ExamAttempt ||--o{ StudentAnswer : submits
    ExamAttempt ||--|| Result : evaluated_into
    GeneratedQuestion ||--o{ StudentAnswer : responses_to
```

---

## 2. Entity Dictionary & Data Definitions

### 2.1 User & Access Control
- **`User`**:
  - `id`: UUID (Primary Key)
  - `email`: VarChar(255), unique, indexed
  - `name`: VarChar(255)
  - `passwordHash`: VarChar(255)
  - `role`: Enum (`STUDENT`, `TEACHER`, `EXAMINER`, `ADMIN`)
  - `isActive`: Boolean, default true
  - `createdAt`, `updatedAt`: Timestamps
- **`AuditLog`**:
  - `id`: UUID (Primary Key)
  - `userId`: UUID, Foreign Key to `User` (nullable for unauthenticated/system actions)
  - `action`: VarChar(100) (e.g., `PAPER_GENERATE`, `BLUEPRINT_CREATE`, `AUTH_LOGIN`)
  - `resource`: VarChar(100)
  - `resourceId`: VarChar(100), nullable
  - `ipAddress`: VarChar(45)
  - `userAgent`: VarChar(500)
  - `metadata`: JSONB
  - `createdAt`: Timestamp, indexed

---

### 2.2 Education Hierarchy
- **`Board`**:
  - `id`: UUID (Primary Key)
  - `code`: VarChar(50), unique (e.g., `BISE_LHR`, `FEDERAL_BOARD`)
  - `name`: VarChar(255)
  - `country`: VarChar(100)
  - `region`: VarChar(100)
- **`AcademicYear`**:
  - `id`: UUID (Primary Key)
  - `boardId`: UUID, Foreign Key to `Board`
  - `yearCode`: VarChar(50) (e.g., `2024-2025`)
  - `startDate`, `endDate`: Dates
  - `isActive`: Boolean
- **`Class`**:
  - `id`: UUID (Primary Key)
  - `academicYearId`: UUID, Foreign Key to `AcademicYear`
  - `gradeLevel`: Integer (e.g., 9, 10, 11, 12)
  - `name`: VarChar(100) (e.g., `Matric Part 1`)
- **`Subject`**:
  - `id`: UUID (Primary Key)
  - `classId`: UUID, Foreign Key to `Class`
  - `code`: VarChar(50) (e.g., `PHY-09`)
  - `name`: VarChar(255) (e.g., `Physics`)
  - `creditHours`: Integer, nullable
- **`Book`**:
  - `id`: UUID (Primary Key)
  - `subjectId`: UUID, Foreign Key to `Subject`
  - `title`: VarChar(255)
  - `edition`: VarChar(50)
  - `publisher`: VarChar(255)
  - `isbn`: VarChar(50), nullable
- **`Chapter`**:
  - `id`: UUID (Primary Key)
  - `bookId`: UUID, Foreign Key to `Book`
  - `chapterNumber`: Integer
  - `title`: VarChar(255)
- **`Topic`**:
  - `id`: UUID (Primary Key)
  - `chapterId`: UUID, Foreign Key to `Chapter`
  - `topicCode`: VarChar(50)
  - `title`: VarChar(255)
  - `learningOutcomes`: Text (SLOs)

---

### 2.3 Book Knowledge & Vector Store
- **`Document`**:
  - `id`: UUID (Primary Key)
  - `bookId`: UUID, Foreign Key to `Book`
  - `fileName`: VarChar(255)
  - `fileSize`: BigInt
  - `mimeType`: VarChar(100)
  - `storagePath`: Text
  - `checksum`: VarChar(64) (SHA-256 for tampering detection)
  - `status`: Enum (`PENDING`, `PARSED`, `INDEXED`, `FAILED`)
- **`DocumentPage`**:
  - `id`: UUID (Primary Key)
  - `documentId`: UUID, Foreign Key to `Document`
  - `pageNumber`: Integer
  - `rawText`: Text
- **`DocumentChunk`**:
  - `id`: UUID (Primary Key)
  - `pageId`: UUID, Foreign Key to `DocumentPage`
  - `chunkIndex`: Integer
  - `content`: Text
  - `tokenCount`: Integer
  - `embedding`: `Unsupported("vector(768)")` (PostgreSQL pgvector extension)

---

### 2.4 Examination Hierarchy & Blueprinting
- **`SamplePaper`**:
  - `id`: UUID (Primary Key)
  - `subjectId`: UUID, Foreign Key to `Subject`
  - `year`: Integer
  - `totalMarks`: Integer
  - `durationMinutes`: Integer
  - `sourceUrl`: Text, nullable
- **`PaperPattern`**:
  - `id`: UUID (Primary Key)
  - `subjectId`: UUID, Foreign Key to `Subject`
  - `title`: VarChar(255)
  - `totalMarks`: Integer
  - `choiceRules`: JSONB (e.g. "Attempt any 5 out of 8")
- **`PaperSection`**:
  - `id`: UUID (Primary Key)
  - `patternId`: UUID, Foreign Key to `PaperPattern`
  - `name`: VarChar(100) (e.g. `Section A (Objective)`)
  - `sectionOrder`: Integer
  - `totalMarks`: Integer
  - `allowedTimeMinutes`: Integer, nullable
  - `instructions`: Text
- **`QuestionType`**:
  - Enum: `MCQ`, `SHORT_QUESTION`, `LONG_QUESTION`, `NUMERICAL`, `CONCEPTUAL`, `DEFINITION`, `EXPLANATION`, `COMPARISON`, `APPLICATION_BASED`, `DIAGRAM_BASED`
- **`Question`**:
  - `id`: UUID (Primary Key)
  - `type`: Enum `QuestionType`
  - `difficulty`: Enum `Difficulty` (`EASY`, `MEDIUM`, `DIFFICULT`)
  - `text`: Text
  - `options`: JSONB (for MCQs: `["A", "B", "C", "D"]`)
  - `defaultMarks`: Integer
  - `expectedAnswer`: Text
  - `rubricCriteria`: JSONB
- **`QuestionSource`**:
  - `id`: UUID (Primary Key)
  - `questionId`: UUID, Foreign Key to `Question`, unique
  - `documentId`: UUID, Foreign Key to `Document`
  - `bookId`: UUID, Foreign Key to `Book`
  - `chapterId`: UUID, Foreign Key to `Chapter`
  - `topicId`: UUID, Foreign Key to `Topic`
  - `pageNumber`: Integer
  - `sourceChunkIds`: JSONB (UUID array)
  - `generationModel`: VarChar(100)
  - `generationTimestamp`: Timestamp
  - `validationStatus`: Enum (`PENDING`, `VERIFIED`, `REJECTED`)
- **`PaperBlueprint`**:
  - `id`: UUID (Primary Key)
  - `patternId`: UUID, Foreign Key to `PaperPattern`
  - `name`: VarChar(255)
  - `totalMarks`: Integer
  - `totalQuestions`: Integer
  - `durationMinutes`: Integer
  - `easyCount`: Integer (calculated deterministically ~33%)
  - `mediumCount`: Integer (calculated deterministically ~33%)
  - `difficultCount`: Integer (calculated deterministically ~33%)
  - `chapterDistribution`: JSONB
  - `sectionSpecs`: JSONB
- **`GeneratedPaper`**:
  - `id`: UUID (Primary Key)
  - `blueprintId`: UUID, Foreign Key to `PaperBlueprint`
  - `authorId`: UUID, Foreign Key to `User`
  - `title`: VarChar(255)
  - `status`: Enum (`DRAFT`, `VALIDATED`, `PUBLISHED`, `ARCHIVED`)
  - `seed`: VarChar(100) (reproducibility seed)
  - `validationReport`: JSONB
- **`GeneratedQuestion`**:
  - `id`: UUID (Primary Key)
  - `generatedPaperId`: UUID, Foreign Key to `GeneratedPaper`
  - `questionId`: UUID, Foreign Key to `Question`
  - `sectionId`: UUID, Foreign Key to `PaperSection`
  - `sequenceNumber`: Integer
  - `marks`: Integer

---

### 2.5 Assessment Execution & Results
- **`ExamAttempt`**:
  - `id`: UUID (Primary Key)
  - `userId`: UUID, Foreign Key to `User`
  - `paperId`: UUID, Foreign Key to `GeneratedPaper`
  - `startedAt`: Timestamp
  - `submittedAt`: Timestamp, nullable
  - `status`: Enum (`IN_PROGRESS`, `SUBMITTED`, `EVALUATED`, `ABANDONED`)
- **`StudentAnswer`**:
  - `id`: UUID (Primary Key)
  - `attemptId`: UUID, Foreign Key to `ExamAttempt`
  - `generatedQuestionId`: UUID, Foreign Key to `GeneratedQuestion`
  - `submittedAnswer`: Text
  - `selectedOption`: VarChar(10), nullable
  - `marksAwarded`: Decimal(5, 2), nullable
  - `evaluationFeedback`: Text, nullable
  - `evaluatedBy`: Enum (`SYSTEM_OBJECTIVE`, `AI_RUBRIC`, `HUMAN_EXAMINER`)
- **`Result`**:
  - `id`: UUID (Primary Key)
  - `attemptId`: UUID, Foreign Key to `ExamAttempt`, unique
  - `totalMarksObtained`: Decimal(6, 2)
  - `totalMarksPossible`: Decimal(6, 2)
  - `percentage`: Decimal(5, 2)
  - `grade`: VarChar(10)
  - `feedbackSummary`: Text
  - `generatedAt`: Timestamp

---

## 3. Database Indexing Strategy

To guarantee sub-100ms response times on high-volume search and exam paper lookups:
1. `User.email` (Unique Index)
2. `AuditLog.createdAt` (B-Tree Index for rapid date-range log filtering)
3. `AuditLog.userId` (Foreign Key Index)
4. `QuestionSource.questionId` (Unique Index for 1:1 provenance lookups)
5. `QuestionSource.topicId` & `QuestionSource.chapterId` (Composite Index for topic-balanced question retrieval)
6. `DocumentChunk.pageId` & `DocumentChunk.chunkIndex` (Composite Index)
7. `DocumentChunk.embedding` (HNSW vector index: `CREATE INDEX ON "DocumentChunk" USING hnsw (embedding vector_cosine_ops)`)
8. `GeneratedPaper.status` & `GeneratedPaper.authorId` (Composite Index)
9. `ExamAttempt.userId` & `ExamAttempt.paperId` (Composite Index)
