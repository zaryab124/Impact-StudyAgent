import { describe, it, expect, vi, beforeEach } from "vitest";
import { CurriculumAligner } from "@/server/syllabus/curriculum-aligner";
import { EligibilityEngine } from "@/server/syllabus/eligibility-engine";
import { SyllabusComparisonService } from "@/server/syllabus/comparison-service";
import { SyllabusService } from "@/server/syllabus/syllabus-service";
import { EligibilityQueryService } from "@/server/syllabus/eligibility-query-service";
import { prisma } from "@/lib/db";

describe("Phase 4: Syllabus Intelligence & Curriculum Alignment Unit Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Versioning & Immutability
  describe("1. Syllabus Versioning & Immutability", () => {
    it("1. Creating a new syllabus version persists successfully", async () => {
      vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue(null);
      vi.spyOn(prisma.syllabus, "create").mockResolvedValue({
        id: "syl-2025-v1",
        title: "Physics Grade 9 Syllabus",
        version: "2025-v1",
        academicYearId: "yr-2025",
        subjectId: "sub-phy",
        status: "DRAFT",
        sourceType: "OFFICIAL_PDF",
        verificationStatus: "UNVERIFIED",
        createdAt: new Date(),
        updatedAt: new Date(),
        board: { name: "Federal Board" },
        academicYear: { name: "2024-2025" },
        class: { name: "Class 9" },
        subject: { name: "Physics" },
        _count: { chapterItems: 2, topicItems: 4 },
      } as any);

      const result = await SyllabusService.createSyllabus({
        title: "Physics Grade 9 Syllabus",
        version: "2025-v1",
        academicYearId: "yr-2025",
        classId: "cls-9",
        subjectId: "sub-phy",
        status: "DRAFT",
        sourceType: "OFFICIAL_PDF",
      });

      expect(result.id).toBe("syl-2025-v1");
      expect(result.version).toBe("2025-v1");
      expect(result.status).toBe("DRAFT");
    });

    it("2. Multiple syllabus versions coexist without overwriting", async () => {
      vi.spyOn(prisma.syllabus, "findUnique")
        .mockResolvedValueOnce({ id: "syl-2024-v1", version: "2024-v1" } as any)
        .mockResolvedValueOnce(null);

      // Attempting to duplicate version 2024-v1 must throw
      await expect(
        SyllabusService.createSyllabus({
          title: "Physics Grade 9 Syllabus",
          version: "2024-v1",
          academicYearId: "yr-2024",
          classId: "cls-9",
          subjectId: "sub-phy",
        })
      ).rejects.toThrow(/already exists/);
    });

    it("3. Historical syllabus versions remain unchanged", async () => {
      const v2024 = {
        id: "syl-2024",
        version: "2024-v1",
        status: "PUBLISHED",
        updatedAt: new Date("2024-01-01"),
      };
      vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue(v2024 as any);

      const fetched = await SyllabusService.getSyllabusById("syl-2024");
      expect(fetched.version).toBe("2024-v1");
      expect(fetched.status).toBe("PUBLISHED");
    });
  });

  // 2. State Transitions & Verification Gate
  describe("2. State Transitions & Verification Gate", () => {
    it("4. Publishing a verified syllabus succeeds for admin", async () => {
      vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({
        id: "syl-1",
        version: "2025-v1",
        status: "UNDER_REVIEW",
        sourceTitle: "Official Grade 9 Physics Syllabus 2025",
        sourceType: "OFFICIAL_PDF",
      } as any);

      vi.spyOn(prisma.syllabus, "update").mockResolvedValue({
        id: "syl-1",
        version: "2025-v1",
        status: "PUBLISHED",
        verificationStatus: "VERIFIED",
        verifiedAt: new Date(),
        verifiedBy: "admin-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.spyOn(prisma.syllabusAlignmentAudit, "create").mockResolvedValue({} as any);

      const result = await SyllabusService.publishSyllabus("syl-1", "ADMIN", "admin-1");
      expect(result.status).toBe("PUBLISHED");
      expect(result.provenance.verificationStatus).toBe("VERIFIED");
    });

    it("5. Draft syllabus cannot be used as production eligibility", () => {
      expect(EligibilityEngine.isSyllabusProductionReady("DRAFT")).toBe(false);
      expect(EligibilityEngine.isSyllabusProductionReady("UNDER_REVIEW")).toBe(false);
      expect(EligibilityEngine.isSyllabusProductionReady("VERIFIED")).toBe(true);
      expect(EligibilityEngine.isSyllabusProductionReady("PUBLISHED")).toBe(true);
    });

    it("6. Unauthorized users cannot modify syllabus verification / publish", async () => {
      await expect(
        SyllabusService.publishSyllabus("syl-1", "STUDENT", "student-123")
      ).rejects.toThrow(/Unauthorized/);
    });

    it("7. Published syllabus can be archived safely", async () => {
      vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({
        id: "syl-1",
        version: "2025-v1",
        status: "PUBLISHED",
      } as any);

      vi.spyOn(prisma.syllabus, "update").mockResolvedValue({
        id: "syl-1",
        version: "2025-v1",
        status: "ARCHIVED",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.spyOn(prisma.syllabusAlignmentAudit, "create").mockResolvedValue({} as any);

      const result = await SyllabusService.archiveSyllabus("syl-1", "ADMIN");
      expect(result.status).toBe("ARCHIVED");
    });
  });

  // 3. Inclusion / Exclusion & Precedence Rules
  describe("3. Deterministic Inclusion / Exclusion & Precedence Rules", () => {
    it("8. Included chapter returns ELIGIBLE", async () => {
      vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({
        id: "syl-pub",
        status: "PUBLISHED",
        chapterItems: [
          {
            chapterId: "ch-1",
            isIncluded: true,
            alignmentStatus: "MATCHED",
            examinationRelevance: "HIGH",
          },
        ],
      } as any);

      const res = await EligibilityEngine.evaluateChapterEligibility("syl-pub", "ch-1");
      expect(res.eligibility).toBe("ELIGIBLE");
      expect(res.isEligibleForProduction).toBe(true);
    });

    it("9. Excluded chapter returns EXCLUDED", async () => {
      vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({
        id: "syl-pub",
        status: "PUBLISHED",
        chapterItems: [
          {
            chapterId: "ch-4",
            isIncluded: false,
            alignmentStatus: "MATCHED",
            examinationRelevance: "OPTIONAL",
          },
        ],
      } as any);

      const res = await EligibilityEngine.evaluateChapterEligibility("syl-pub", "ch-4");
      expect(res.eligibility).toBe("EXCLUDED");
      expect(res.isEligibleForProduction).toBe(false);
    });

    it("10. Excluded chapter blocks child topics (hierarchical inheritance)", async () => {
      vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({
        id: "syl-pub",
        status: "PUBLISHED",
        chapterItems: [{ chapterId: "ch-4", isIncluded: false }],
        topicItems: [], // No explicit override
      } as any);

      const res = await EligibilityEngine.evaluateTopicEligibility("syl-pub", "ch-4", "top-4-1");
      expect(res.eligibility).toBe("EXCLUDED");
      expect(res.reason).toContain("inheritance");
    });

    it("11. Included chapter with excluded topic blocks only that topic", async () => {
      vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({
        id: "syl-pub",
        status: "PUBLISHED",
        chapterItems: [{ chapterId: "ch-2", isIncluded: true }],
        topicItems: [{ topicId: "top-2-3", isIncluded: false }],
      } as any);

      const res = await EligibilityEngine.evaluateTopicEligibility("syl-pub", "ch-2", "top-2-3");
      expect(res.eligibility).toBe("EXCLUDED");
      expect(res.reason).toContain("explicitly excluded");
    });

    it("12. Unknown content does not become eligible (UNKNOWN strictly non-eligible)", async () => {
      vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({
        id: "syl-pub",
        status: "PUBLISHED",
        chapterItems: [],
        topicItems: [],
      } as any);

      const res = await EligibilityEngine.evaluateTopicEligibility("syl-pub", "unknown-ch", "unknown-top");
      expect(res.eligibility).toBe("UNKNOWN");
      expect(res.isEligibleForProduction).toBe(false);
    });

    it("13. Topic-level exclusion works with explicit rule", async () => {
      vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({
        id: "syl-pub",
        status: "PUBLISHED",
        chapterItems: [{ chapterId: "ch-1", isIncluded: true }],
        topicItems: [{ topicId: "top-1-2", isIncluded: false }],
      } as any);

      const res = await EligibilityEngine.evaluateTopicEligibility("syl-pub", "ch-1", "top-1-2");
      expect(res.eligibility).toBe("EXCLUDED");
    });

    it("14. Chapter-level inclusion works for child topic without explicit override", async () => {
      vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({
        id: "syl-pub",
        status: "PUBLISHED",
        chapterItems: [{ chapterId: "ch-1", isIncluded: true }],
        topicItems: [], // Inherits chapter inclusion
      } as any);

      const res = await EligibilityEngine.evaluateTopicEligibility("syl-pub", "ch-1", "top-1-1");
      expect(res.eligibility).toBe("ELIGIBLE");
      expect(res.isEligibleForProduction).toBe(true);
    });

    it("15. Weightage is stored independently from difficulty", () => {
      const chapterItem = {
        chapterId: "ch-1",
        weightage: 25.0, // Represents 25% of exam marks
        isIncluded: true,
      };

      // Difficulty is an exam question distribution property, not syllabus weightage
      expect(chapterItem.weightage).toBe(25.0);
      expect(chapterItem).not.toHaveProperty("difficulty");
    });
  });

  // 4. Alignment Engine & Confidence Calculation
  describe("4. Alignment Engine & Confidence Scoring", () => {
    it("16. Calculates string similarity correctly", () => {
      const simHigh = CurriculumAligner.calculateTextSimilarity(
        "Physical Quantities and Measurement",
        "Physical Quantities & Measurement"
      );
      const simLow = CurriculumAligner.calculateTextSimilarity(
        "Physical Quantities and Measurement",
        "Photosynthesis and Cellular Respiration"
      );

      expect(simHigh).toBeGreaterThanOrEqual(0.75);
      expect(simLow).toBeLessThan(0.2);
    });

    it("17. Alignment confidence is computed accurately from structural & textual match", () => {
      const match = CurriculumAligner.computeMatchConfidence({
        syllabusNumber: 1,
        bookNumber: 1,
        syllabusCode: "1.1",
        bookCode: "1.1",
        syllabusTitle: "Physical Quantities",
        bookTitle: "Physical Quantities",
      });

      expect(match.confidence).toBeGreaterThanOrEqual(0.85);
      expect(match.alignmentStatus).toBe("MATCHED");
    });

    it("18. Low-confidence mapping requires review", () => {
      const lowMatch = CurriculumAligner.computeMatchConfidence({
        syllabusNumber: 99,
        bookNumber: 1,
        syllabusTitle: "Quantum Mechanics Advanced",
        bookTitle: "Introduction to Measurement",
      });

      expect(lowMatch.confidence).toBeLessThan(0.65);
      expect(["REQUIRES_REVIEW", "UNMATCHED"]).toContain(lowMatch.alignmentStatus);
    });
  });

  // 5. Year-to-Year Comparison
  describe("5. Year-to-Year Syllabus Comparison", () => {
    it("19. Year-to-year comparison calculates exact additions, removals, and weightage changes", async () => {
      const sylA = {
        id: "syl-2024",
        version: "2024-v1",
        academicYear: { name: "2024" },
        chapterItems: [
          { chapter: { chapterNumber: 1, title: "Kinematics" }, isIncluded: true, weightage: 15 },
          { chapter: { chapterNumber: 2, title: "Dynamics" }, isIncluded: true, weightage: 15 },
        ],
        topicItems: [
          { topic: { topicCode: "1.1", title: "Rest and Motion" }, isIncluded: true, weightage: 5 },
          { topic: { topicCode: "1.2", title: "Speed and Velocity" }, isIncluded: true, weightage: 5 },
        ],
      };

      const sylB = {
        id: "syl-2025",
        version: "2025-v1",
        academicYear: { name: "2025" },
        chapterItems: [
          { chapter: { chapterNumber: 1, title: "Kinematics" }, isIncluded: true, weightage: 20 }, // weight changed
          { chapter: { chapterNumber: 3, title: "Gravitation" }, isIncluded: true, weightage: 10 }, // added (ch 2 removed)
        ],
        topicItems: [
          { topic: { topicCode: "1.1", title: "Rest and Motion" }, isIncluded: true, weightage: 5 },
          { topic: { topicCode: "3.1", title: "Law of Gravitation" }, isIncluded: true, weightage: 5 }, // added
        ],
      };

      vi.spyOn(prisma.syllabus, "findUnique")
        .mockResolvedValueOnce(sylA as any)
        .mockResolvedValueOnce(sylB as any);

      const diff = await SyllabusComparisonService.compareSyllabusVersions("syl-2024", "syl-2025");

      expect(diff.addedChapters.some((c) => c.chapterNumber === 3)).toBe(true);
      expect(diff.removedChapters.some((c) => c.chapterNumber === 2)).toBe(true);
      expect(diff.changedWeightage.some((w) => w.codeOrNumber === "Chapter 1" && w.newWeight === 20)).toBe(true);
      expect(diff.addedTopics.some((t) => t.topicCode === "3.1")).toBe(true);
      expect(diff.removedTopics.some((t) => t.topicCode === "1.2")).toBe(true);
    });
  });

  // 6. Eligible Knowledge & Provenance Verification
  describe("6. Eligible Knowledge Retrieval & Provenance", () => {
    it("20. Eligible-content service returns only eligible knowledge with full provenance", async () => {
      vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({
        id: "syl-pub",
        title: "Grade 9 Physics",
        version: "2025-v1",
        status: "PUBLISHED",
        chapterItems: [{ chapterId: "ch-1", isIncluded: true, weightage: 20, alignmentStatus: "MATCHED", confidence: 0.95 }],
        topicItems: [{ topicId: "top-1-1", isIncluded: true, weightage: 10, alignmentStatus: "MATCHED", confidence: 0.95 }],
      } as any);

      vi.spyOn(prisma.documentChunk, "findMany").mockResolvedValue([
        {
          id: "chunk-1",
          documentId: "doc-1",
          chapterId: "ch-1",
          topicId: "top-1-1",
          content: "Velocity is the rate of change of displacement.",
          heading: "Definition: Velocity",
          chunkType: "DEFINITION",
          document: {
            fileName: "Physics_Grade9.pdf",
            bookId: "bk-1",
            book: { title: "Physics Textbook Grade 9" },
          },
          page: { pageNumber: 4 },
          chapter: { chapterNumber: 1, title: "Kinematics" },
          topic: { topicCode: "1.1", title: "Rest and Motion" },
        },
      ] as any);

      const results = await EligibilityQueryService.getEligibleKnowledge({
        syllabusId: "syl-pub",
        limit: 10,
      });

      expect(results.length).toBe(1);
      const res = results[0];
      expect(res.eligibilityStatus).toBe("ELIGIBLE");
      expect(res.chunkId).toBe("chunk-1");
      expect(res.documentName).toBe("Physics_Grade9.pdf");
      expect(res.bookTitle).toBe("Physics Textbook Grade 9");
      expect(res.chapterTitle).toBe("Kinematics");
      expect(res.topicCode).toBe("1.1");
      expect(res.pageNumber).toBe(4);
      expect(res.weightage).toBe(10);
    });

    it("21. Review alignment records auditor decision and updates state", async () => {
      vi.spyOn(prisma.syllabusChapterItem, "findUnique").mockResolvedValue({
        id: "ci-1",
        chapterId: "ch-1",
        alignmentStatus: "REQUIRES_REVIEW",
        isIncluded: true,
        weightage: 10,
        eligibility: "REQUIRES_REVIEW",
        confidence: 0.5,
      } as any);

      vi.spyOn(prisma.syllabusChapterItem, "update").mockResolvedValue({} as any);
      vi.spyOn(prisma.syllabusAlignmentAudit, "create").mockResolvedValue({} as any);

      const decision = await SyllabusService.reviewAlignment(
        "syl-1",
        {
          itemId: "ci-1",
          itemType: "CHAPTER",
          decision: "CONFIRMED",
          notes: "Confirmed alignment after manual syllabus check.",
        },
        "ADMIN"
      );

      expect(decision.success).toBe(true);
      expect(decision.decision).toBe("CONFIRMED");
      expect(decision.newState.alignmentStatus).toBe("MATCHED");
      expect(decision.newState.eligibility).toBe("ELIGIBLE");
    });

    it("22. Validation report audits completeness and readiness for paper generation", async () => {
      vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue({
        id: "syl-1",
        title: "Science 2025",
        version: "2025-v1",
        status: "PUBLISHED",
        chapterItems: [
          { alignmentStatus: "MATCHED", isIncluded: true },
          { alignmentStatus: "MATCHED", isIncluded: true },
        ],
        topicItems: [
          { alignmentStatus: "MATCHED", isIncluded: true },
          { alignmentStatus: "MATCHED", isIncluded: true },
        ],
      } as any);

      const report = await SyllabusService.getValidationReport("syl-1");
      expect(report.totalChapters).toBe(2);
      expect(report.matchedChapters).toBe(2);
      expect(report.coveragePct).toBe(100);
      expect(report.isValidForExamGeneration).toBe(true);
      expect(report.issues.length).toBe(0);
    });
  });
});
