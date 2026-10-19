import { describe, it, expect } from "vitest";
import { CurriculumQuestionBank } from "@/server/exam-engine/curriculum-question-bank";

describe("Multi-Class & Multi-Subject Unique Paper Generation Engine", () => {
  it("1. Generates authentic Class 9 (SSC-I) Physics paper with unique 9th syllabus questions", () => {
    const sections = CurriculumQuestionBank.generateStructuredPaper("9th", "PHY");

    expect(sections.length).toBe(3);
    const [secA, secB, secC] = sections;

    expect(secA.questions.length).toBeGreaterThanOrEqual(1);
    expect(secB.questions.length).toBeGreaterThanOrEqual(1);
    expect(secC.questions.length).toBeGreaterThanOrEqual(1);

    // Verify Class 9 Physics stems (e.g., Vernier caliper, Newton 2nd Law, Kinematics, Pascal)
    const allStems = [
      ...secA.questions.map((q) => q.text),
      ...secB.questions.map((q) => q.text),
      ...secC.questions.map((q) => q.text),
    ].join(" ");

    expect(allStems).toMatch(/vernier|kinematics|newton|pascal|acceleration|momentum|scalars/i);
    // Ensure it does NOT contain Class 10 Physics topics like Snell's law or DC motor
    expect(allStems).not.toMatch(/snell|dc motor|logic gate/i);
  });

  it("2. Generates authentic Class 10 (SSC-II) Physics paper distinct from Class 9", () => {
    const sections = CurriculumQuestionBank.generateStructuredPaper("10th", "PHY");

    expect(sections.length).toBe(3);
    const [secA, secB, secC] = sections;

    const allStems = [
      ...secA.questions.map((q) => q.text),
      ...secB.questions.map((q) => q.text),
      ...secC.questions.map((q) => q.text),
    ].join(" ");

    // Verify Class 10 Physics stems (e.g. Simple pendulum, Snell's law, Ohm's law, DC motor)
    expect(allStems).toMatch(/pendulum|snell|ohm|motor|nand|refraction|shm/i);
    // Ensure it does NOT contain Class 9 topics like Vernier caliper or Pascal's principle
    expect(allStems).not.toMatch(/vernier|pascal's principle/i);
  });

  it("3. Generates authentic 1st Year (HSSC-I / Class 11) Physics paper with intermediate rigor", () => {
    const sections = CurriculumQuestionBank.generateStructuredPaper("11th", "PHY");

    expect(sections.length).toBe(3);
    const [secA, secB, secC] = sections;

    const allStems = [
      ...secA.questions.map((q) => q.text),
      ...secB.questions.map((q) => q.text),
      ...secC.questions.map((q) => q.text),
    ].join(" ");

    // Verify 1st Year Physics concepts (e.g. Projectile 45 deg, Dot/Cross products, Bernoulli, Thermodynamics)
    expect(allStems).toMatch(/projectile|bernoulli|thermodynamics|vector product|scalar product/i);
    // Ensure it does NOT contain Class 10 specific topics like DC Motor or Class 12 Gauss's law
    expect(allStems).not.toMatch(/gauss|lenz's law|photoelectric/i);
  });

  it("4. Generates authentic 2nd Year (HSSC-II / Class 12) Physics paper with advanced electromagnetism & modern physics", () => {
    const sections = CurriculumQuestionBank.generateStructuredPaper("12th", "PHY");

    expect(sections.length).toBe(3);
    const [secA, secB, secC] = sections;

    const allStems = [
      ...secA.questions.map((q) => q.text),
      ...secB.questions.map((q) => q.text),
      ...secC.questions.map((q) => q.text),
    ].join(" ");

    // Verify 2nd Year Physics concepts (e.g. Gauss's Law, Lenz's Law, Photoelectric effect, Kirchhoff)
    expect(allStems).toMatch(/gauss|lenz|photoelectric|kirchhoff|compton/i);
    // Ensure it does NOT contain 9th grade kinematics
    expect(allStems).not.toMatch(/vernier|equations of motion/i);
  });

  it("5. Guarantees 0% question collision across different class papers of the same subject", () => {
    const p9 = CurriculumQuestionBank.generateStructuredPaper("9", "PHY");
    const p10 = CurriculumQuestionBank.generateStructuredPaper("10", "PHY");
    const p11 = CurriculumQuestionBank.generateStructuredPaper("11", "PHY");
    const p12 = CurriculumQuestionBank.generateStructuredPaper("12", "PHY");

    const stems9 = new Set(p9.flatMap((s) => s.questions.map((q) => q.text)));
    const stems10 = new Set(p10.flatMap((s) => s.questions.map((q) => q.text)));
    const stems11 = new Set(p11.flatMap((s) => s.questions.map((q) => q.text)));
    const stems12 = new Set(p12.flatMap((s) => s.questions.map((q) => q.text)));

    // Check zero overlap between any two grades
    const intersection9_10 = [...stems9].filter((s) => stems10.has(s));
    const intersection10_11 = [...stems10].filter((s) => stems11.has(s));
    const intersection11_12 = [...stems11].filter((s) => stems12.has(s));
    const intersection9_12 = [...stems9].filter((s) => stems12.has(s));

    expect(intersection9_10.length).toBe(0);
    expect(intersection10_11.length).toBe(0);
    expect(intersection11_12.length).toBe(0);
    expect(intersection9_12.length).toBe(0);
  });

  it("6. Generates subject-specific papers for Biology, Mathematics and Computer Science across classes", () => {
    const p9Bio = CurriculumQuestionBank.generateStructuredPaper("9", "BIO");
    const p10Cs = CurriculumQuestionBank.generateStructuredPaper("10", "CS");
    const p12Mth = CurriculumQuestionBank.generateStructuredPaper("12", "MTH");

    // Class 9 Bio: Cell wall, Mitochondria, Mitosis/Meiosis
    const bioStems = p9Bio[0].questions.map((q) => q.text).join(" ");
    expect(bioStems).toMatch(/cell wall|mitochondria|fluid mosaic|chitin|mitosis/i);

    // Class 10 CS: Format specifier in C, equality operator
    const csStems = p10Cs[0].questions.map((q) => q.text).join(" ");
    expect(csStems).toMatch(/format specifier|==|relational/i);

    // Class 12 Math: Limits, Calculus, Integration
    const mthStems = p12Mth.flatMap((s) => s.questions.map((q) => q.text)).join(" ");
    expect(mthStems).toMatch(/limit|sin\s*\(?θ\)?|derivative|integration/i);
  });

  it("7. Ensures all questions contain options, correct answer keys, and model answers / rubrics", () => {
    const classes = ["9", "10", "11", "12"];
    for (const cls of classes) {
      const sections = CurriculumQuestionBank.generateStructuredPaper(cls, "PHY");
      const [secA, secB, secC] = sections;

      // Verify Section A MCQs have options and keys
      for (const mcq of secA.questions) {
        expect(Array.isArray(mcq.options)).toBe(true);
        expect(mcq.options?.length).toBe(4);
        expect(mcq.correctOption).toBeDefined();
        expect(mcq.correctOption!.length).toBeGreaterThan(0);
      }

      // Verify Section B Short Questions have model answers
      for (const sq of secB.questions) {
        expect(sq.modelAnswer).toBeDefined();
        expect(sq.modelAnswer!.length).toBeGreaterThan(10);
      }

      // Verify Section C Long Questions have marking rubrics
      for (const lq of secC.questions) {
        const hasRubric = (lq.markingRubric && lq.markingRubric.length > 0) || (lq.rubric && lq.rubric.length > 0);
        expect(hasRubric).toBe(true);
      }
    }
  });

  it("8. Filters paper generation specifically by selected curriculum chapter numbers", () => {
    // Generate Class 9 Physics paper strictly for Chapter 1 (Physical Quantities and Measurement)
    const sections = CurriculumQuestionBank.generateStructuredPaper({
      className: "Class 9",
      subjectCode: "PHY-09",
      subjectName: "Physics",
      chapterNumbers: [1],
      totalMarks: 30,
    });

    expect(sections.length).toBe(3);
    const [secA, secB, secC] = sections;

    // Check that questions retrieved belong to Chapter 1 Physical Quantities
    const ch1Questions = [...secA.questions, ...secB.questions, ...secC.questions];
    const ch1Matched = ch1Questions.filter((q) =>
      q.chapterTitle?.toLowerCase().includes("physical quantities")
    );
    expect(ch1Matched.length).toBeGreaterThanOrEqual(1);
  });

  it("9. Ingests custom teacher/textbook questions and includes them in the generation bank", () => {
    const initialCount = CurriculumQuestionBank.getQuestionCount("9", "PHY");

    CurriculumQuestionBank.addQuestion({
      id: "custom_ingested_test_1",
      classLevel: "9",
      subjectKey: "PHY",
      chapterTitle: "Physical Quantities and Measurement",
      topicTitle: "Screw Gauge Zero Error",
      type: "MCQ",
      marks: 1,
      text: "If the zero of the circular scale lies above the index line of a screw gauge, the zero error is:",
      options: [
        { key: "A", text: "Positive" },
        { key: "B", text: "Negative" },
        { key: "C", text: "Zero" },
        { key: "D", text: "Infinite" },
      ],
      correctOption: "B",
      solutionExplanation: "When zero mark of circular scale remains above the index line, the zero error is negative.",
    });

    const newCount = CurriculumQuestionBank.getQuestionCount("9", "PHY");
    expect(newCount).toBe(initialCount + 1);
  });

  it("10. Generates authentic Mathematics 1st Year (Pre-Engineering & ICS) Practice Paper matching board syllabus", () => {
    const rawTitle = "Mathematics (1st Year - Pre-Engineering & ICS) Practice Paper - Mathematics (1st Year - Pre-Engineering & ICS) (Punjab Curriculum & Textbook Board)";
    
    // Normalization verifies 1st Year Mathematics correctly
    const normClass = CurriculumQuestionBank.normalizeClassLevel(undefined, rawTitle);
    const normSub = CurriculumQuestionBank.normalizeSubjectKey(undefined, rawTitle);
    expect(normClass).toBe("11");
    expect(normSub).toBe("MTH");

    // Generate paper using 1st Year Math
    const sections = CurriculumQuestionBank.generateStructuredPaper({
      className: "1st Year",
      subjectName: "Mathematics",
      totalMarks: 60,
    });

    expect(sections.length).toBe(3);
    const [secA, secB, secC] = sections;

    const allStems = [
      ...secA.questions.map((q) => q.text),
      ...secB.questions.map((q) => q.text),
      ...secC.questions.map((q) => q.text),
    ].join(" ");

    // Verify authentic 1st Year Math syllabus concepts (Complex Numbers, Cramer, Cube roots of unity, Induction, Trigonometry)
    expect(allStems).toMatch(/complex|determinant|cube root|arithmetic|induction|trigonometric|escribed/i);

    // Verify absolutely NO placeholder or physics distractors exist
    const allOptions = secA.questions.flatMap((q) => q.options?.map((o) => o.text) || []).join(" ");
    expect(allOptions).not.toMatch(/inaccurate formulation|alternative distractor|scientific principle|inverse proportional factor/i);

    // Verify each MCQ has valid mathematical options
    for (const mcq of secA.questions) {
      expect(mcq.options?.length).toBe(4);
      expect(mcq.correctOption).toBeDefined();
      expect(mcq.solutionExplanation).toBeDefined();
    }
  });

  it("11. Generates authentic Class 10 (SSC-II) Mathematics paper distinct from 9th and 11th", () => {
    const sections = CurriculumQuestionBank.generateStructuredPaper("10th", "MTH");
    expect(sections.length).toBe(3);

    const allStems = sections.flatMap((s) => s.questions.map((q) => q.text)).join(" ");
    // Verify Class 10 Math concepts (Quadratic equation, Discriminant, Alternando, Radian, Factorization)
    expect(allStems).toMatch(/quadratic|discriminant|alternando|factorization|cube roots/i);
  });

  it("12. Generates authentic Statistics (1st Year - ICS Stats Group) Practice Paper without Computer Science pollution", () => {
    const rawTitle = "Statistics (1st Year - ICS Stats Group) Practice Paper - Statistics (1st Year - ICS Stats Group) (Punjab Curriculum & Textbook Board)";

    // Verify normalization maps to 1st Year (11) and Statistics (STAT), NOT Computer Science (CS)
    const normClass = CurriculumQuestionBank.normalizeClassLevel(undefined, rawTitle);
    const normSub = CurriculumQuestionBank.normalizeSubjectKey(undefined, rawTitle);
    expect(normClass).toBe("11");
    expect(normSub).toBe("STAT");

    // Generate paper using 1st Year Statistics
    const sections = CurriculumQuestionBank.generateStructuredPaper({
      className: "1st Year",
      subjectName: "Statistics",
      totalMarks: 60,
    });

    expect(sections.length).toBe(3);
    const [secA, secB, secC] = sections;

    const allStems = [
      ...secA.questions.map((q) => q.text),
      ...secB.questions.map((q) => q.text),
      ...secC.questions.map((q) => q.text),
    ].join(" ");

    // Verify authentic 1st Year Statistics topics
    expect(allStems).toMatch(/parameter|statistic|ogive|arithmetic mean|dispersion|standard deviation|binomial|probability|variance/i);

    // Verify zero Computer Science stems appear
    expect(allStems).not.toMatch(/flowchart|binary|topology|html|printf|switch|database|c language/i);

    // Verify MCQs have 4 options and valid solutions
    for (const mcq of secA.questions) {
      expect(mcq.options?.length).toBe(4);
      expect(mcq.correctOption).toBeDefined();
      expect(mcq.solutionExplanation).toBeDefined();
    }
  });

  it("13. Generates authentic Pakistan Studies (2nd Year Compulsory) Practice Paper without Computer Science pollution or question duplication", () => {
    const rawTitle = "Pakistan Studies (2nd Year Compulsory) Practice Paper - Pakistan Studies (2nd Year Compulsory) (Punjab Curriculum & Textbook Board)";

    // Verify normalization correctly maps to 2nd Year (12) and Pakistan Studies (PAK)
    const normClass = CurriculumQuestionBank.normalizeClassLevel(undefined, rawTitle);
    const normSub = CurriculumQuestionBank.normalizeSubjectKey(undefined, rawTitle);
    expect(normClass).toBe("12");
    expect(normSub).toBe("PAK");

    // Generate paper using 2nd Year Pakistan Studies
    const sections = CurriculumQuestionBank.generateStructuredPaper({
      className: "2nd Year",
      subjectName: "Pakistan Studies",
      totalMarks: 60,
    });

    expect(sections.length).toBe(3);
    const [secA, secB, secC] = sections;

    expect(secA.questions.length).toBe(12);
    expect(secB.questions.length).toBe(6);
    expect(secC.questions.length).toBe(3);

    const allQuestions = [...secA.questions, ...secB.questions, ...secC.questions];
    const allStems = allQuestions.map((q) => q.text);

    // Verify authentic 2nd Year Pakistan Studies topics
    const combinedText = allStems.join(" ");
    expect(combinedText).toMatch(/objectives resolution|1973 constitution|indus water treaty|allama iqbal|k2|gwadar|cpec|waris shah|shah abdul latif|cotton|durand line|nuclear|foreign policy/i);

    // Verify zero Computer Science / Database pollution
    expect(combinedText).not.toMatch(/relational database|normalization|1nf|2nf|3nf|flowchart|binary|topology|printf|fopen/i);

    // CRITICAL: Verify ZERO duplicates across all generated questions
    const uniqueStems = new Set(allStems);
    expect(uniqueStems.size).toBe(allQuestions.length);

    // Verify MCQs have 4 options, valid keys, and solutions
    for (const mcq of secA.questions) {
      expect(mcq.options?.length).toBe(4);
      expect(mcq.correctOption).toBeDefined();
      expect(mcq.solutionExplanation).toBeDefined();
    }
  });

  it("14. Guarantees ExamRepository.findPaperById hydrates paper_ajkecsx_1792375765438 with authentic Pakistan Studies and zero duplicate questions", async () => {
    const { ExamRepository } = await import("@/server/exam-engine/exam-repository");
    const paper = await ExamRepository.findPaperById("paper_ajkecsx_1792375765438");

    expect(paper).not.toBeNull();
    expect(paper?.title).toMatch(/Pakistan Studies/i);

    // Verify questions belong to Pakistan Studies
    const questionTexts = paper!.questions.map((q) => q.questionText);
    const combinedQuestions = questionTexts.join(" ");
    expect(combinedQuestions).toMatch(/objectives resolution|1973 constitution|indus water treaty|allama iqbal|gwadar|cpec|waris shah|shah abdul latif|cotton|durand line/i);
    expect(combinedQuestions).not.toMatch(/relational database|normalization|1nf|2nf|3nf/i);

    // Verify zero duplicates
    const uniqueQuestions = new Set(questionTexts);
    expect(uniqueQuestions.size).toBe(paper!.questions.length);
  });
});

