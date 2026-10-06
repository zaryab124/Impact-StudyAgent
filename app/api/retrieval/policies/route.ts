import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api-response";
import { RetrievalPolicyEngine } from "@/server/retrieval/retrieval-policy-engine";

export async function GET(req: NextRequest) {
  const policies = RetrievalPolicyEngine.getPolicies();
  return apiSuccess(policies);
}
