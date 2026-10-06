// ==============================================================================
// AI Live Paper Generator - Real-World Validation & Pilot Types (Phase 11)
// Production Launch Readiness, Domain Verification & Evidence Contracts
// ==============================================================================

export type VerificationTier =
  | "IMPLEMENTED"
  | "TESTED_LOCALLY"
  | "EXTERNALLY_VERIFIED"
  | "PRODUCTION_VERIFIED"
  | "UNVERIFIED";

export type ValidationStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PASSED"
  | "PASSED_WITH_WARNINGS"
  | "FAILED"
  | "UNVERIFIED";

export type ValidationDomain =
  | "EDUCATIONAL_DATA"
  | "TEXTBOOK_INTELLIGENCE"
  | "SYLLABUS_ELIGIBILITY"
  | "SAMPLE_PAPER_INTELLIGENCE"
  | "RETRIEVAL"
  | "BLUEPRINT"
  | "QUESTION_BANK"
  | "PAPER_ASSEMBLY"
  | "ONLINE_EXAMINATION"
  | "EVALUATION"
  | "RESULTS"
  | "AI_PROVIDERS"
  | "KNOWLEDGE_CONNECTOR"
  | "DATABASE"
  | "STORAGE"
  | "BACKGROUND_JOBS"
  | "AUTHENTICATION"
  | "SECURITY"
  | "DEPLOYMENT"
  | "BACKUP_RECOVERY";

export interface ValidationEvidence {
  sourceReference?: string;
  documentId?: string;
  apiEndpoint?: string;
  testIdentifier?: string;
  provenanceHash?: string;
  verificationActor?: string;
  verificationTimestamp: string;
  details?: Record<string, unknown>; // STRICTLY NO SECRETS
}

export interface ValidationCheck {
  id: string;
  domain: ValidationDomain;
  checkName: string;
  status: ValidationStatus;
  tier: VerificationTier;
  measuredValue?: unknown;
  expectedValue?: unknown;
  evidence?: ValidationEvidence;
  errorCode?: string;
  message: string;
  timestamp: string;
}

export interface DomainSummary {
  domain: ValidationDomain;
  displayName: string;
  status: ValidationStatus;
  tier: VerificationTier;
  totalChecks: number;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  unverifiedCount: number;
  lastRunTimestamp?: string;
  notes?: string;
}

export interface ValidationRun {
  id: string;
  releaseCandidate: string; // e.g. "STUDY_AGENT_RC_1"
  startedAt: string;
  completedAt?: string;
  environment: string;
  version: string;
  gitCommit?: string;
  overallStatus: ValidationStatus;
  overallTier: VerificationTier;
  initiatedBy: string;
  domains: Record<ValidationDomain, DomainSummary>;
  checks: ValidationCheck[];
}

export interface LaunchReadinessReport {
  status: "READY" | "READY_WITH_WARNINGS" | "NOT_READY";
  releaseCandidate: string;
  evaluatedAt: string;
  environment: string;
  version: string;
  criticalChecks: Record<string, { status: "PASS" | "WARN" | "FAIL"; reason: string }>;
  domainSummaries: Record<ValidationDomain, { status: ValidationStatus; tier: VerificationTier }>;
  blockingIssues: string[];
  warnings: string[];
  unverifiedItems: string[];
  canLaunch: boolean;
}

export interface PerformanceMeasurement {
  operationName: string;
  latencyMs: number;
  timestamp: string;
  environment: string;
  datasetSize?: string;
  status: "NORMAL" | "SLOW" | "CRITICAL";
}
