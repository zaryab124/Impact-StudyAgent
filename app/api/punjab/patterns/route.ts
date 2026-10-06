import { NextRequest, NextResponse } from "next/server";
import { PatternLearningService } from "@/server/punjab/pattern-learning-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const boardCode = searchParams.get("boardCode") || "BISE_LHR";
    const subjectCode = searchParams.get("subjectCode") || "PHY-09";

    const pattern = await PatternLearningService.getLearnedPattern(boardCode, subjectCode);

    return NextResponse.json({
      success: true,
      boardCode,
      subjectCode,
      pattern,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve pattern" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.paperTitle || !body.boardCode || !body.subjectCode || !body.sections) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: paperTitle, boardCode, subjectCode, sections" },
        { status: 400 }
      );
    }

    const learned = await PatternLearningService.learnFromPastPaper(body);

    return NextResponse.json({
      success: true,
      message: "Successfully learned and verified past paper pattern against PBCC guidelines.",
      learned,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to learn from past paper" },
      { status: 500 }
    );
  }
}
