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
});
