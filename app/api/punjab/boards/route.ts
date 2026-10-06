import { NextResponse } from "next/server";
import { PUNJAB_BOARDS_REGISTRY, PBCC_APEX_BODY } from "@/server/punjab/punjab-boards-config";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      governingBody: PBCC_APEX_BODY,
      totalBoards: PUNJAB_BOARDS_REGISTRY.length,
      boards: PUNJAB_BOARDS_REGISTRY,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve Punjab boards" },
      { status: 500 }
    );
  }
}
