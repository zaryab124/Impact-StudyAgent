import { NextRequest, NextResponse } from "next/server";
import { PctbService } from "@/server/punjab/pctb-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const bookIdOrCode = body.bookId || body.bookCode || "PCTB-PHY-09";

    const result = await PctbService.persistBookToVault(bookIdOrCode);

    return NextResponse.json({
      success: true,
      message: `Book ${result.book.title} permanently saved to storage vault for continued exam generation.`,
      result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to persist book to storage vault" },
      { status: 500 }
    );
  }
}
