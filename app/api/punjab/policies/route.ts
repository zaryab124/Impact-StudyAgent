import { NextRequest, NextResponse } from "next/server";
import { BoardPolicyService } from "@/server/punjab/policy-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const boardCode = searchParams.get("boardCode") || undefined;
    const category = searchParams.get("category") || undefined;
    const session = searchParams.get("session") || undefined;

    const policies = await BoardPolicyService.getPolicies({
      boardCode,
      category,
      session,
    });

    return NextResponse.json({
      success: true,
      count: policies.length,
      policies,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve policies" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.policyCode || !body.title || !body.parameters) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: policyCode, title, parameters" },
        { status: 400 }
      );
    }

    const policy = await BoardPolicyService.upsertPolicy({
      policyCode: body.policyCode,
      title: body.title,
      category: body.category || "ASSESSMENT",
      description: body.description,
      effectiveSession: body.effectiveSession,
      boardId: body.boardId,
      portalUrl: body.portalUrl,
      parameters: body.parameters,
      status: body.status || "ACTIVE",
    });

    return NextResponse.json({
      success: true,
      policy,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to upsert board policy" },
      { status: 500 }
    );
  }
}
