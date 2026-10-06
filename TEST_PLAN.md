# Comprehensive Test Plan

This document defines the testing strategy, suites, automated verification workflows, and acceptance criteria for the **AI Live Paper Generator** platform across all phases, with specific focus on Phase 1 foundation requirements.

---

## 1. Test Architecture & Tooling

- **Test Runner**: Vitest (ESM native, blazingly fast in-memory execution)
- **Assertion Library**: Vitest / Chai expectations
- **Type Checker**: TypeScript Compiler (`tsc --noEmit`)
- **Schema Validation**: Prisma Schema CLI (`prisma validate`) & Zod runtime checks
- **Linting**: ESLint (`next lint`)

---

## 2. Test Suites (Phase 1)

### 2.1 Deterministic Blueprint Engine Tests (`tests/unit/blueprint-calculator.test.ts`)
- **Objective**: Verify that the 33% Easy, 33% Medium, 33% Difficult distribution is mathematically exact and integer-deterministic across all total question counts.
- **Test Scenarios**:
  1. **Evenly Divisible Counts**: $N = 3, 9, 30, 99$ $\to$ Exactly $N/3$ for each category.
  2. **Remainder 1 Counts**: $N = 10 \to$ Easy: 3, Medium: 4, Difficult: 3 (sum = 10).
  3. **Remainder 2 Counts**: $N = 11 \to$ Easy: 4, Medium: 4, Difficult: 3 (sum = 11).
  4. **Boundary Scenarios**: $N = 1, N = 2$ handled safely without division by zero.
  5. **Total Marks Summation**: Ensure marks per question multiply and sum up to target paper total marks precisely.

### 2.2 AI Provider Abstraction Tests (`tests/unit/ai-provider-factory.test.ts`)
- **Objective**: Ensure the `AIProviderFactory` instantiates providers correctly and throws helpful errors on unrecognized provider names or missing configurations.
- **Test Scenarios**:
  1. Instantiate default Gemini provider.
  2. Instantiate with explicit provider parameter.
  3. Fail gracefully when unrecognized provider is requested.

### 2.3 Schema & Validation Tests (`tests/unit/validations.test.ts`)
- **Objective**: Test Zod schemas for blueprint creation, educational entity queries, and question registration.
- **Test Scenarios**:
  1. Reject negative question counts or zero marks.
  2. Validate curriculum hierarchy parameters.
  3. Reject unauthorized question types.

### 2.4 Integration & Health Check Tests (`tests/integration/health-api.test.ts`)
- **Objective**: Test `/api/health` response envelope, subsystem status reporting, and database connectivity detection.

---

## 3. Automated Verification Matrix

| Verification Step | Command | Success Criteria |
| :--- | :--- | :--- |
| **Prisma Validation** | `npm run prisma:validate` | Schema parses cleanly with zero syntax or relational errors |
| **Prisma Client Gen** | `npm run prisma:generate` | Client types generated without issue |
| **TypeScript Check** | `npm run type-check` | Zero compiler errors under strict mode |
| **Linter Check** | `npm run lint` | Zero ESLint errors |
| **Unit & Integration**| `npm run test` | All test suites passing (100% pass rate) |
| **Health API Ping** | `GET /api/health` | HTTP 200 with `{ "status": "healthy" }` |
