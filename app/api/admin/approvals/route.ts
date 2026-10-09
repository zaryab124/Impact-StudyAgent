import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { AuthGuard } from "@/lib/auth-guard";
import { SubscriptionService } from "@/server/subscription/subscription-service";

export async function GET(req: NextRequest) {
  const auth = await AuthGuard.requireRole(req, ["ADMIN"]);
  if (!auth.authorized) return auth.response!;

  try {
    const list = await SubscriptionService.listPendingApprovals();
    return apiSuccess({
      pendingApprovals: list,
      count: list.length,
    });
  } catch (error: any) {
    return apiError(error.message || "Failed to load pending subscriptions", "APPROVALS_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await AuthGuard.requireRole(req, ["ADMIN"]);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await req.json();
    const { subscriptionId, action, rejectionReason } = body;

    if (!subscriptionId) {
      return apiError("subscriptionId is required", "VALIDATION_ERROR", 400);
    }

    if (action === "APPROVE") {
      const result = await SubscriptionService.approveSubscription(
        subscriptionId,
        auth.user?.id || "admin"
      );
      return apiSuccess({
        message: "Subscription and user account successfully approved and activated.",
        result,
      });
    } else if (action === "REJECT") {
      const result = await SubscriptionService.rejectSubscription(
        subscriptionId,
        auth.user?.id || "admin",
        rejectionReason || "Payment receipt invalid or verification failed"
      );
      return apiSuccess({
        message: "Subscription registration rejected.",
        result,
      });
    } else {
      return apiError("action must be APPROVE or REJECT", "VALIDATION_ERROR", 400);
    }
  } catch (error: any) {
    return apiError(error.message || "Approval action failed", "APPROVAL_ACTION_ERROR", 500);
  }
}
