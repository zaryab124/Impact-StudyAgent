import { describe, it, expect, beforeAll } from "vitest";
import {
  PUNJAB_BOARDS_REGISTRY,
  PBCC_APEX_BODY,
  getPunjabBoardByCode,
  getAllPunjabBoardCodes,
} from "@/server/punjab/punjab-boards-config";
import { BoardPolicyService } from "@/server/punjab/policy-service";
import { PctbService, PCTB_OFFICIAL_CATALOG } from "@/server/punjab/pctb-service";
import { PatternLearningService } from "@/server/punjab/pattern-learning-service";
import { PunjabPaperGenerator } from "@/server/punjab/punjab-paper-generator";
import { EducationService } from "@/server/education-service";
import fs from "fs";

describe("Punjab BISE Boards & PBCC Examination Ecosystem", () => {
  describe("1. Punjab Boards Configuration & PBCC Apex Body", () => {
    it("should register all 9 Punjab BISE boards", () => {
      expect(PUNJAB_BOARDS_REGISTRY).toHaveLength(9);
      const codes = getAllPunjabBoardCodes();
      expect(codes).toContain("BISE_LHR");
      expect(codes).toContain("BISE_RWP");
      expect(codes).toContain("BISE_FSD");
      expect(codes).toContain("BISE_GRW");
      expect(codes).toContain("BISE_MUL");
      expect(codes).toContain("BISE_SWL");
      expect(codes).toContain("BISE_SGD");
      expect(codes).toContain("BISE_BWP");
      expect(codes).toContain("BISE_DGK");
    });

    it("should provide valid portal URLs and districts for each board", () => {
      for (const board of PUNJAB_BOARDS_REGISTRY) {
        expect(board.portalUrl).toMatch(/^https:\/\/(www\.)?bise[a-z]+\.(com|edu\.pk)/);
        expect(board.districts.length).toBeGreaterThan(0);
        expect(board.status).toBe("ACTIVE");
        expect(board.governingBody).toBe("PBCC");
      }
    });

    it("should find board by code or division name case-insensitively", () => {
      const lahore = getPunjabBoardByCode("bise_lhr");
      expect(lahore).toBeDefined();
      expect(lahore?.name).toContain("Lahore");

      const rawalpindi = getPunjabBoardByCode("Rawalpindi");
      expect(rawalpindi).toBeDefined();
      expect(rawalpindi?.code).toBe("BISE_RWP");

      const gujranwala = getPunjabBoardByCode("BISE_GRW");
      expect(gujranwala?.division).toBe("Gujranwala");
    });

    it("should configure PBCC apex body with official portals", () => {
      expect(PBCC_APEX_BODY.name).toContain("Punjab Boards Committee of Chairmen");
      expect(PBCC_APEX_BODY.portalUrl).toBe("https://pbcc.punjab.gov.pk");
      expect(PBCC_APEX_BODY.pctbPortalUrl).toBe("https://pctb.punjab.gov.pk");
      expect(PBCC_APEX_BODY.elearnPortalUrl).toBe("https://elearn.punjab.gov.pk");
    });

    it("should include Punjab boards in EducationService default boards", async () => {
      const boards = await EducationService.getBoards();
      const boardCodes = boards.map((b: any) => b.code);
      expect(boardCodes).toContain("BISE_LHR");
      expect(boardCodes).toContain("BISE_RWP");
      expect(boardCodes).toContain("BISE_GRW");
    });
  });

  describe("2. Board Policy Engine & Portal Synchronization", () => {
    it("should retrieve active PBCC SLO assessment policy (50/35/15 split)", async () => {
      const policies = await BoardPolicyService.getPolicies({ category: "SLO_DISTRIBUTION" });
      expect(policies.length).toBeGreaterThan(0);
      const sloPolicy = policies.find((p) => p.policyCode === "PBCC-SLO-2025");
      expect(sloPolicy).toBeDefined();
      expect(sloPolicy?.parameters.sloDistribution).toEqual({
        knowledge: 50,
        understanding: 35,
        application: 15,
      });
    });

    it("should enforce updated 40% passing threshold in PBCC policy", async () => {
      const policies = await BoardPolicyService.getPolicies({ category: "PASSING_CRITERIA" });
      const passPolicy = policies.find((p) => p.policyCode === "PBCC-PASSING-CRITERIA-2025");
      expect(passPolicy).toBeDefined();
      expect(passPolicy?.parameters.passingPercentage).toBe(40);
    });

    it("should retrieve active assessment parameters for science and mathematics", async () => {
      const sciParams = await BoardPolicyService.getActiveAssessmentParameters("BISE_LHR", "PHY-09");
      expect(sciParams.totalMarks).toBe(60);
      expect(sciParams.durationMinutes).toBe(120);
      expect(sciParams.passingPercentage).toBe(40);

      const mathParams = await BoardPolicyService.getActiveAssessmentParameters("BISE_LHR", "MTH-09");
      expect(mathParams.totalMarks).toBe(75);
    });

    it("should allow creating and updating dynamic board policies", async () => {
      const newPolicy = await BoardPolicyService.upsertPolicy({
        policyCode: "PBCC-TRIAL-POLICY-2025",
        title: "Experimental Practical Assessment Weighting",
        category: "ASSESSMENT",
        effectiveSession: "2024-2025",
        parameters: {
          passingPercentage: 40,
          totalMarks: 60,
          sloDistribution: { knowledge: 45, understanding: 40, application: 15 },
        },
      });

      expect(newPolicy.policyCode).toBe("PBCC-TRIAL-POLICY-2025");
      const fetched = await BoardPolicyService.getPolicies();
      expect(fetched.some((p) => p.policyCode === "PBCC-TRIAL-POLICY-2025")).toBe(true);
    });

    it("should simulate periodic portal synchronization across all Punjab boards", async () => {
      const syncReport = await BoardPolicyService.syncPoliciesFromPortals();
      expect(syncReport.checkedBoards).toBe(9);
      expect(syncReport.portalEndpoints.length).toBe(10); // PBCC + 9 boards
      expect(syncReport.syncedPolicies).toBeGreaterThanOrEqual(4);
      expect(syncReport.apexStatus).toContain("PBCC");
    });
  });

  describe("3. Punjab Curriculum and Textbook Board (PCTB) Service & Persistent Vault", () => {
    it("should provide official PCTB textbooks for Class 9", () => {
      const catalog = PctbService.getCatalog();
      expect(catalog.length).toBeGreaterThanOrEqual(4);
      const subjects = catalog.map((b) => b.subjectName);
      expect(subjects).toContain("Physics");
      expect(subjects).toContain("Chemistry");
      expect(subjects).toContain("Biology");
      expect(subjects).toContain("Mathematics");
    });

    it("should find catalog items by ID, code, or subject name", () => {
      const phy = PctbService.findCatalogItem("PCTB-PHY-09");
      expect(phy).toBeDefined();
      expect(phy?.chaptersCount).toBe(9);
      expect(phy?.chapters[0].title).toBe("Physical Quantities and Measurement");
      expect(phy?.chapters[1].title).toBe("Kinematics");

      const chm = PctbService.findCatalogItem("Chemistry");
      expect(chm).toBeDefined();
      expect(chm?.chaptersCount).toBe(8);
    });

    it("should permanently save textbooks to local storage vault for repeated use", async () => {
      const result = await PctbService.persistBookToVault("PCTB-PHY-09");
      expect(result.success).toBe(true);
      expect(result.vaultPath).toContain("pctb-phy-09-vault.json");
      expect(fs.existsSync(result.vaultPath)).toBe(true);
      expect(result.checksum).toMatch(/^[a-f0-9]{64}$/);
      expect(result.fileSizeBytes).toBeGreaterThan(0);

      // Second call should reuse cached persistent file without error
      const cachedResult = await PctbService.persistBookToVault("PCTB-PHY-09");
      expect(cachedResult.cached).toBe(true);
      expect(cachedResult.checksum).toBe(result.checksum);
    });

    it("should report storage vault status accurately", async () => {
      await PctbService.persistBookToVault("PCTB-CHM-09");
      const status = PctbService.getStorageVaultStatus();
      expect(status.persistedBooksCount).toBeGreaterThanOrEqual(2);
      expect(status.vaultDirectory).toContain("storage-vault");
      expect(status.persistedBooks.some((b) => b.bookCode === "PCTB-PHY-09")).toBe(true);
    });
  });

  describe("4. Past Paper Pattern Learning Engine", () => {
    it("should retrieve canonical PBCC science examination pattern", async () => {
      const pattern = await PatternLearningService.getLearnedPattern("BISE_LHR", "PHY-09");
      expect(pattern.totalMarks).toBe(60);
      expect(pattern.passingMarks).toBe(24); // 40%
      expect(pattern.durationMinutes).toBe(120);
      expect(pattern.sectionCount).toBe(3);

      // Section A: 12 MCQs (12 marks)
      expect(pattern.sections[0].marksPerQuestion).toBe(1);
      expect(pattern.sections[0].totalMarks).toBe(12);

      // Section B: 3 SQ questions (10 marks each = 30 marks)
      expect(pattern.sections[1].totalMarks).toBe(30);
      expect(pattern.sections[1].marksPerQuestion).toBe(2);

      // Section C: 2 of 3 LQ questions (9 marks each = 18 marks)
      expect(pattern.sections[2].totalMarks).toBe(18);
      expect(pattern.sections[2].marksPerQuestion).toBe(9);
      expect(pattern.sections[2].subParts).toHaveLength(2); // Part (a) 5 marks, Part (b) 4 marks

      // Deterministic arithmetic sum: 12 + 30 + 18 = 60
      expect(pattern.arithmeticValidation.isConsistent).toBe(true);
      expect(pattern.arithmeticValidation.calculatedTotal).toBe(60);
    });

    it("should verify PBCC pairing schemes across chapters", async () => {
      const pattern = await PatternLearningService.getLearnedPattern("BISE_RWP", "PHY-09");
      const pairing = pattern.pairingSchemeObserved;
      expect(pairing.shortQuestionsGroups).toHaveLength(3);
      expect(pairing.shortQuestionsGroups[0].chaptersTested).toEqual([1, 2, 3]);
      expect(pairing.shortQuestionsGroups[1].chaptersTested).toEqual([4, 5, 6]);
      expect(pairing.shortQuestionsGroups[2].chaptersTested).toEqual([7, 8, 9]);

      expect(pairing.longQuestionsPairs).toHaveLength(3);
      expect(pairing.longQuestionsPairs[0].questionNumber).toBe(5);
    });

    it("should learn from past paper submission and calculate cognitive SLO ratios", async () => {
      const pastPaperSubmission = {
        paperTitle: "BISE Gujranwala Physics Annual Examination 2024 (Group 1)",
        boardCode: "BISE_GRW",
        examYear: 2024,
        examSession: "ANNUAL_PART_1" as const,
        subjectCode: "PHY-09",
        classLevel: 9,
        sections: [
          {
            name: "Section A (Objective)",
            questions: [
              { number: "1", text: "Unit of force?", type: "MCQ" as const, marks: 1, cognitiveLevel: "KNOWLEDGE" as const },
              { number: "2", text: "Identify vector?", type: "MCQ" as const, marks: 1, cognitiveLevel: "KNOWLEDGE" as const },
              { number: "3", text: "Slope of v-t graph?", type: "MCQ" as const, marks: 1, cognitiveLevel: "UNDERSTANDING" as const },
              { number: "4", text: "Calculate acceleration?", type: "MCQ" as const, marks: 1, cognitiveLevel: "APPLICATION" as const },
            ],
          },
        ],
      };

      const result = await PatternLearningService.learnFromPastPaper(pastPaperSubmission);
      expect(result.marksVerified).toBe(true);
      expect(result.extractedSloSplit.knowledge).toBe(50);
      expect(result.pattern.boardCode).toBe("BISE_GRW");
    });
  });

  describe("5. Punjab BISE Live Exam Paper Generator", () => {
    it("should generate a complete, authentic 60-mark PBCC live paper for BISE Lahore", async () => {
      const paper = await PunjabPaperGenerator.generatePunjabPaper({
        boardCode: "BISE_LHR",
        subjectCode: "PHY-09",
        classLevel: 9,
        academicYear: "2024-2025",
      });

      expect(paper.boardCode).toBe("BISE_LHR");
      expect(paper.boardName).toContain("Lahore");
      expect(paper.totalMarks).toBe(60);
      expect(paper.durationMinutes).toBe(120);
      expect(paper.passingMarks).toBe(24);
      expect(paper.passingPercentage).toBe(40);
      expect(paper.isFrozen).toBe(true);
      expect(paper.checksum).toMatch(/^[a-f0-9]{64}$/);

      // Validate Section A: 12 MCQs
      expect(paper.sections[0].name).toContain("Section A");
      expect(paper.sections[0].totalMarks).toBe(12);
      expect(paper.sections[0].questions).toHaveLength(12);
      for (const mcq of paper.sections[0].questions) {
        expect(mcq.marks).toBe(1);
        expect(mcq.options).toHaveLength(4);
        expect(mcq.correctOption).toBe("A");
      }

      // Validate Section B: 24 Short Questions across Q2, Q3, Q4 (each 8 parts with attempt 5 choice)
      expect(paper.sections[1].name).toContain("Section B");
      expect(paper.sections[1].totalMarks).toBe(30);
      expect(paper.sections[1].questions).toHaveLength(24);
      const q2Parts = paper.sections[1].questions.filter((q) => q.questionNumber.startsWith("Q2"));
      expect(q2Parts).toHaveLength(8);
      expect(q2Parts[0].choiceRule?.available).toBe(8);
      expect(q2Parts[0].choiceRule?.required).toBe(5);

      // Validate Section C: 3 Long Questions (Q5, Q6, Q7) with part (a) 5m & part (b) 4m
      expect(paper.sections[2].name).toContain("Section C");
      expect(paper.sections[2].totalMarks).toBe(18);
      expect(paper.sections[2].questions).toHaveLength(3);
      for (const lq of paper.sections[2].questions) {
        expect(lq.marks).toBe(9);
        expect(lq.subParts).toHaveLength(2);
        expect(lq.subParts![0].marks).toBe(5);
        expect(lq.subParts![1].marks).toBe(4);
      }
    });

    it("should generate exam for other Punjab boards (e.g. BISE Rawalpindi and Gujranwala)", async () => {
      const rwpPaper = await PunjabPaperGenerator.generatePunjabPaper({
        boardCode: "BISE_RWP",
        subjectCode: "CHM-09",
      });
      expect(rwpPaper.boardCode).toBe("BISE_RWP");
      expect(rwpPaper.subjectName).toBe("Chemistry");
      expect(rwpPaper.totalMarks).toBe(60);

      const grwPaper = await PunjabPaperGenerator.generatePunjabPaper({
        boardCode: "BISE_GRW",
        subjectCode: "BIO-09",
      });
      expect(grwPaper.boardCode).toBe("BISE_GRW");
      expect(grwPaper.subjectName).toBe("Biology");
      expect(grwPaper.totalMarks).toBe(60);
    });

    it("should respect granular eligible chapter restrictions", async () => {
      const paper = await PunjabPaperGenerator.generatePunjabPaper({
        boardCode: "BISE_FSD",
        subjectCode: "PHY-09",
        eligibleChapterNumbers: [1, 2, 3],
      });

      for (const section of paper.sections) {
        for (const q of section.questions) {
          expect([1, 2, 3]).toContain(q.chapterNumber);
        }
      }
    });

    it("should reject unknown board codes gracefully", async () => {
      await expect(
        PunjabPaperGenerator.generatePunjabPaper({
          boardCode: "INVALID_BOARD",
          subjectCode: "PHY-09",
        })
      ).rejects.toThrow("Unsupported or unknown Punjab board code");
    });
  });
});
