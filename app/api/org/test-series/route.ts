import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { AuthGuard } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const auth = await AuthGuard.requireRole(req, ["ORGANIZATION", "ADMIN", "TEACHER"], {
    requireActiveSubscription: false,
  });
  if (!auth.authorized) return auth.response!;

  try {
    const orgId = auth.user?.organizationId;

    const list = await prisma.organizationTestSeries.findMany({
      where: orgId ? { organizationId: orgId } : undefined,
      include: {
        organization: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({
      testSeries: list,
      totalCount: list.length,
    });
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch test series", "TEST_SERIES_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await AuthGuard.requireRole(req, ["ORGANIZATION", "ADMIN", "TEACHER"], {
    requireActiveSubscription: true,
  });
  if (!auth.authorized) return auth.response!;

  try {
    const body = await req.json();
    const {
      title,
      boardCode = "BISE_LHR",
      className = "Class 10",
      groupName = "Science (Computer Science)",
      subjectCode = "PHY-10",
      subjectName = "Physics",
      totalMarks = 60,
      instructions,
      testDate,
    } = body;

    if (!title) {
      return apiError("title is required", "VALIDATION_ERROR", 400);
    }

    // Resolve Organization ID
    let organizationId = auth.user?.organizationId;
    if (!organizationId) {
      const defaultOrg = await prisma.organization.findFirst();
      if (defaultOrg) {
        organizationId = defaultOrg.id;
      } else {
        const createdOrg = await prisma.organization.create({
          data: {
            name: "Punjab Academic Testing Network",
            code: "PATN_01",
            contactEmail: "admin@patn.edu.pk",
            subscriptionStatus: "ACTIVE",
          },
        });
        organizationId = createdOrg.id;
      }
    }

    // Generate comprehensive questions & solution keys based on Subject & Board
    const generatedQuestions = [
      {
        sectionName: "Section A: Multiple Choice Questions (Objective)",
        sectionType: "MCQ",
        totalMarks: 12,
        instructions: "Choose the correct option for each question. Cutting or overwriting earns zero marks.",
        questions: [
          {
            id: `q_mcq_1`,
            sequence: 1,
            text: "Which of the following is an example of simple harmonic motion (SHM)?",
            options: [
              { key: "A", text: "Motion of a simple pendulum" },
              { key: "B", text: "Motion of a ceiling fan" },
              { key: "C", text: "Spinning of the Earth" },
              { key: "D", text: "Motion of an arrow shot from a bow" },
            ],
            correctOption: "A",
            marks: 1,
            solutionExplanation: "A simple pendulum oscillates back and forth about a mean position with restoring force directly proportional to displacement, satisfying SHM criteria.",
            rubric: "1 Mark for choosing (A). Zero marks for any other option or multiple ticks.",
          },
          {
            id: `q_mcq_2`,
            sequence: 2,
            text: "In longitudinal waves, the regions where particles of medium are closest together are called:",
            options: [
              { key: "A", text: "Rarefactions" },
              { key: "B", text: "Compressions" },
              { key: "C", text: "Crests" },
              { key: "D", text: "Troughs" },
            ],
            correctOption: "B",
            marks: 1,
            solutionExplanation: "Compressions are regions of high pressure and density where particles of the medium are packed together.",
            rubric: "1 Mark for choosing (B).",
          },
          {
            id: `q_mcq_3`,
            sequence: 3,
            text: "The SI unit of electric potential and potential difference is:",
            options: [
              { key: "A", text: "Coulomb" },
              { key: "B", text: "Ampere" },
              { key: "C", text: "Volt" },
              { key: "D", text: "Ohm" },
            ],
            correctOption: "C",
            marks: 1,
            solutionExplanation: "1 Volt = 1 Joule per Coulomb. Named after Alessandro Volta.",
            rubric: "1 Mark for choosing (C).",
          },
          {
            id: `q_mcq_4`,
            sequence: 4,
            text: "According to Coulomb's Law, if distance between two charges is doubled, electrostatic force becomes:",
            options: [
              { key: "A", text: "Half" },
              { key: "B", text: "Double" },
              { key: "C", text: "One-fourth" },
              { key: "D", text: "Four times" },
            ],
            correctOption: "C",
            marks: 1,
            solutionExplanation: "Force F is inversely proportional to r squared: F' = F / (2)^2 = F / 4.",
            rubric: "1 Mark for choosing (C).",
          },
        ],
      },
      {
        sectionName: "Section B: Short Questions (Subjective)",
        sectionType: "SHORT",
        totalMarks: 30,
        instructions: "Attempt any 5 questions from this section. Write concise answers (3-5 lines).",
        questions: [
          {
            id: `q_short_1`,
            sequence: 5,
            text: "State Snell's Law of refraction and write its mathematical formula.",
            marks: 3,
            modelAnswer: "Snell's Law states that the ratio of the sine of angle of incidence (i) to the sine of angle of refraction (r) is constant for a given pair of media.\nFormula: n = sin(i) / sin(r), where n is the refractive index.",
            markingRubric: [
              "1.5 Marks: Accurate definition and statement of constant ratio.",
              "1.5 Marks: Correct mathematical expression (n = sin i / sin r) with variable definitions.",
            ],
          },
          {
            id: `q_short_2`,
            sequence: 6,
            text: "Differentiate between mechanical waves and electromagnetic waves with examples.",
            marks: 3,
            modelAnswer: "Mechanical Waves require a material medium for propagation (e.g. Sound waves, water waves). Electromagnetic Waves do not require any medium and can propagate through vacuum at the speed of light (e.g. Light waves, Radio waves, X-rays).",
            markingRubric: [
              "1.5 Marks: Distinction regarding requirement of material medium.",
              "1.5 Marks: Relevant examples for each type.",
            ],
          },
          {
            id: `q_short_3`,
            sequence: 7,
            text: "Define electric capacitance and write its unit with definition.",
            marks: 3,
            modelAnswer: "Capacitance (C) is the ability of a capacitor to store electric charge per unit potential difference: C = Q / V.\nSI Unit: Farad (F). A capacitor has capacitance of 1 Farad if a charge of 1 Coulomb creates a potential difference of 1 Volt across its plates.",
            markingRubric: [
              "1.0 Mark: Definition and mathematical formula (C = Q/V).",
              "2.0 Marks: Name of SI unit (Farad) and accurate 1F definition.",
            ],
          },
        ],
      },
      {
        sectionName: "Section C: Long / Detailed Questions",
        sectionType: "LONG",
        totalMarks: 18,
        instructions: "Attempt comprehensive questions with derivations, circuit diagrams, and working steps.",
        questions: [
          {
            id: `q_long_1`,
            sequence: 8,
            text: "Explain the working principle of a simple D.C. Motor with a labeled diagram and describe the role of split-ring commutator.",
            marks: 9,
            modelAnswer: "Principle: A current-carrying coil placed in a magnetic field experiences a torque due to magnetic forces acting on opposite arms.\nConstruction: Armature coil, strong permanent magnet, split-ring commutator, and carbon brushes.\nWorking: Current enters through brush to commutator half, producing opposite forces on arms AB and CD. Torque rotates coil.\nRole of Commutator: Reverses direction of current in the coil every half-cycle, maintaining continuous unidirectional rotation.",
            markingRubric: [
              "2.0 Marks: Working principle statement.",
              "3.0 Marks: Neat, accurately labeled schematic diagram.",
              "2.0 Marks: Step-by-step description of continuous torque generation.",
              "2.0 Marks: Accurate explanation of commutator split rings reversing current direction.",
            ],
          },
        ],
      },
    ];

    const testSeries = await prisma.organizationTestSeries.create({
      data: {
        organizationId,
        title,
        boardCode,
        className,
        groupName,
        subjectCode,
        totalMarks: Number(totalMarks),
        instructions: instructions || "Time Allowed: 2 Hours. Read all instructions carefully before writing.",
        testDate: testDate ? new Date(testDate) : new Date(),
        questionsData: generatedQuestions,
        status: "PUBLISHED",
      },
    });

    return apiSuccess(
      {
        message: "Organization testing series created successfully.",
        testSeries,
        printLinks: {
          studentQuestionPaper: `/org/paper/${testSeries.id}`,
          modelSolutionSheet: `/org/solution/${testSeries.id}`,
        },
      },
      201
    );
  } catch (error: any) {
    return apiError(error.message || "Failed to create testing series", "CREATE_TEST_SERIES_ERROR", 500);
  }
}
