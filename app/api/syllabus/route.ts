import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { CreateSyllabusSchema } from "@/lib/validations/syllabus";
import { SyllabusService } from "@/server/syllabus/syllabus-service";
import { EducationService } from "@/server/education-service";
import { prisma } from "@/lib/db";
import { SyllabusStatus } from "@/types/syllabus";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const boardId = searchParams.get("boardId") || undefined;
    const academicYearId = searchParams.get("academicYearId") || undefined;
    const classId = searchParams.get("classId") || undefined;
    const subjectId = searchParams.get("subjectId") || undefined;
    const status = (searchParams.get("status") as SyllabusStatus) || undefined;

    const syllabi = await EducationService.getSyllabi(
      subjectId,
      academicYearId,
      status,
      boardId,
      classId
    );

    const serialized = syllabi.map((s) => {
      const anyS = s as any;
      return {
        id: s.id,
        title: s.title,
        version: s.version,
        description: s.description,
        boardId: s.boardId,
        boardName: anyS.board?.name || null,
        academicYearId: s.academicYearId,
        academicYearName: s.academicYear?.name || null,
        classId: s.classId,
        className: s.class?.name || null,
        subjectId: s.subjectId,
        subjectName: s.subject?.name || null,
        status: s.status,
        effectiveDate: s.effectiveDate?.toISOString() || null,
        provenance: {
          sourceTitle: s.sourceTitle,
          sourceReference: s.sourceReference,
          sourcePage: s.sourcePage,
          sourceUrl: s.sourceUrl,
          sourceType: s.sourceType,
          verificationStatus: s.verificationStatus,
          verifiedAt: s.verifiedAt?.toISOString() || null,
          verifiedBy: s.verifiedBy,
        },
        chapterCount: anyS._count?.chapterItems || s.chapterItems?.length || 0,
        topicCount: anyS._count?.topicItems || s.topicItems?.length || 0,
        createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString(),
      };
    });

    return apiSuccess({
      total: serialized.length,
      syllabi: serialized,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve syllabi";
    return apiError(message, "SYLLABUS_FETCH_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const roleHeader = req.headers.get("x-user-role");
    if (roleHeader === "STUDENT") {
      return apiError("Forbidden: Ordinary students are not permitted to manage syllabus records.", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parsed = CreateSyllabusSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          issue: e.message,
        }))
      );
    }

    const created = await SyllabusService.createSyllabus(parsed.data);
    return apiSuccess(created, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error creating syllabus";
    const status = message.includes("already exists")
      ? 409
      : message.includes("not found")
      ? 404
      : message.includes("Referential mismatch")
      ? 422
      : 500;
    return apiError(message, "SYLLABUS_ERROR", status);
  }
}
