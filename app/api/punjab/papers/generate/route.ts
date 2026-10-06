import { NextRequest, NextResponse } from "next/server";
import { PunjabPaperGenerator } from "@/server/punjab/punjab-paper-generator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.boardCode || !body.subjectCode) {
      return NextResponse.json(
        { success: false, error: "boardCode and subjectCode are required" },
        { status: 400 }
      );
    }

    const generatedPaper = await PunjabPaperGenerator.generatePunjabPaper({
      boardCode: body.boardCode,
      subjectCode: body.subjectCode,
      classLevel: body.classLevel || 9,
      academicYear: body.academicYear || "2024-2025",
      studentId: body.studentId,
      eligibleChapterNumbers: body.eligibleChapterNumbers,
    });

    return NextResponse.json({
      success: true,
      message: `Generated and frozen Punjab board examination for ${generatedPaper.boardCode} - ${generatedPaper.subjectName}`,
      paper: generatedPaper,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate Punjab examination paper" },
      { status: 500 }
    );
  }
}
