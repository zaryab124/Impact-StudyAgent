import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { AuthGuard } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { CurriculumQuestionBank } from "@/server/exam-engine/curriculum-question-bank";

export async function GET(req: NextRequest) {
  const auth = await AuthGuard.requireRole(req, ["ORGANIZATION", "ADMIN", "TEACHER"], {
    requireActiveSubscription: false,
  });
  if (!auth.authorized) return auth.response!;

  try {
    const orgId = auth.user?.organizationId;

    const list = await (prisma as any).organizationTestSeries.findMany({
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

    // Generate class-specific & subject-grounded questions & solution keys based on Class, Group, Subject & Board
    const generatedQuestions = CurriculumQuestionBank.generateStructuredPaper({
      className,
      subjectCode,
      subjectName,
      groupName,
      totalMarks: Number(totalMarks),
      boardCode,
      title,
      instructions,
    });


    const testSeries = await (prisma as any).organizationTestSeries.create({
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
