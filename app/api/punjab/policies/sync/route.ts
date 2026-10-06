import { NextResponse } from "next/server";
import { BoardPolicyService } from "@/server/punjab/policy-service";

export async function POST() {
  try {
    const syncReport = await BoardPolicyService.syncPoliciesFromPortals();

    return NextResponse.json({
      success: true,
      report: syncReport,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Portal synchronization failed" },
      { status: 500 }
    );
  }
}
