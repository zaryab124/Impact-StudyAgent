import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { LoginSchema, RegisterSchema } from "@/lib/validations/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { ServerAuthService } from "@/server/auth/auth-service";
import { AuthenticatedUser, UserRole } from "@/types/auth";
import { SubscriptionService } from "@/server/subscription/subscription-service";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return apiError("Missing authorization header.", "UNAUTHORIZED", 401);
    }

    const user = await ServerAuthService.authenticateSession(authHeader);
    if (!user) {
      return apiError("Invalid or expired session token.", "UNAUTHORIZED", 401);
    }

    return apiSuccess({
      authenticated: true,
      user,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal auth error";
    return apiError(message, "AUTH_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimit = checkRateLimit(`auth_${ip}`, { limit: 25, windowMs: 60000 });

  if (!rateLimit.allowed) {
    return apiError("Too many authentication attempts. Please retry later.", "RATE_LIMIT_EXCEEDED", 429);
  }

  try {
    const body = await req.json();
    const action = req.nextUrl.searchParams.get("action") || "login";

    if (action === "register") {
      const parsed = RegisterSchema.safeParse(body);
      if (!parsed.success) {
        return apiError(
          "Registration validation failed",
          "VALIDATION_ERROR",
          400,
          parsed.error.errors.map((e) => ({ field: e.path.join("."), issue: e.message }))
        );
      }

      const role = parsed.data.role;

      // 1. Student paid registration flow (Rs. 500/year + Parent account generation)
      if (role === "STUDENT") {
        const studentResult = await SubscriptionService.registerStudent({
          name: parsed.data.name,
          email: parsed.data.email,
          password: parsed.data.password,
          receiptData: parsed.data.receiptData,
          receiptUrl: parsed.data.receiptUrl,
          studentRollNumber: parsed.data.studentRollNumber,
          parentName: parsed.data.parentName,
          parentEmail: parsed.data.parentEmail,
        });

        const authUser: AuthenticatedUser = {
          id: studentResult.student.id,
          email: studentResult.student.email,
          name: studentResult.student.name,
          role: "STUDENT",
          isActive: true,
          subscriptionStatus: "PENDING_APPROVAL",
        };

        const token = ServerAuthService.createSession(authUser);

        return apiSuccess(
          {
            message: "Student registered successfully. Subscription is pending admin payment approval.",
            requiresApproval: true,
            user: authUser,
            token,
            subscription: studentResult.subscription,
            parentCredentials: studentResult.parentCredentials,
            pricingNotice: "Annual Student Plan: Rs. 500 / year.",
          },
          201
        );
      }

      // 2. Organization paid registration flow (Rs. 500/mo or Rs. 5000/yr with Rs. 1000 discount)
      if (role === "ORGANIZATION") {
        const orgResult = await SubscriptionService.registerOrganization({
          name: parsed.data.name,
          email: parsed.data.email,
          password: parsed.data.password,
          orgName: parsed.data.orgName || parsed.data.name,
          orgCode: parsed.data.orgCode,
          plan: parsed.data.plan || "YEARLY",
          receiptData: parsed.data.receiptData,
          receiptUrl: parsed.data.receiptUrl,
          contactPhone: parsed.data.contactPhone,
          address: parsed.data.address,
        });

        const authUser: AuthenticatedUser = {
          id: orgResult.user.id,
          email: orgResult.user.email,
          name: orgResult.user.name,
          role: "ORGANIZATION",
          isActive: true,
          subscriptionStatus: "PENDING_APPROVAL",
          organizationId: orgResult.organization.id,
          organizationName: orgResult.organization.name,
        };

        const token = ServerAuthService.createSession(authUser);

        return apiSuccess(
          {
            message: "Organization registered successfully. Subscription is pending admin payment approval.",
            requiresApproval: true,
            user: authUser,
            token,
            organization: orgResult.organization,
            subscription: orgResult.subscription,
            pricingNotice:
              orgResult.subscription.plan === "YEARLY"
                ? "Annual Plan: Rs. 5,000 / year (Discount of Rs. 1,000 applied!)."
                : "Monthly Plan: Rs. 500 / month.",
          },
          201
        );
      }

      // 3. Fallback for administrative/staff roles
      const newUser: AuthenticatedUser = {
        id: `user_${Date.now()}`,
        email: parsed.data.email,
        name: parsed.data.name,
        role: parsed.data.role as UserRole,
        isActive: true,
        subscriptionStatus: "ACTIVE",
      };

      const token = ServerAuthService.createSession(newUser);

      return apiSuccess(
        {
          message: "User registered successfully.",
          token,
          user: newUser,
        },
        201
      );
    }

    // Default: Login
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        "Login validation failed",
        "VALIDATION_ERROR",
        400,
        parsed.error.errors.map((e) => ({ field: e.path.join("."), issue: e.message }))
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const password = parsed.data.password;

    // 1. Authenticate with real database credentials (Students, Parents, Organizations, Administrators)
    try {
      const dbAuth = await SubscriptionService.authenticateWithDb(email, password);
      if (dbAuth) {
        return apiSuccess({
          message: "Authentication successful.",
          token: dbAuth.token,
          user: dbAuth.user,
        });
      }
    } catch (dbErr) {
      console.warn("DB authentication lookup failed:", dbErr);
    }

    // 2. In isolated unit test environments only: fallback to test memory users
    if (process.env.NODE_ENV === "test") {
      const memoryUsers = Array.from((ServerAuthService as any).memoryUsers?.values() || []);
      const testUser = memoryUsers.find((u: any) => u.email.toLowerCase() === email);
      if (testUser) {
        const token = ServerAuthService.createSession(testUser as any);
        return apiSuccess({
          message: "Authentication successful (Test Environment).",
          token,
          user: testUser,
        });
      }
    }

    // 3. Strict authentic rejection - no demo bypasses allowed
    return apiError(
      "Invalid email/username or password. Please check your credentials or register an account.",
      "INVALID_CREDENTIALS",
      401
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return apiError(message, "AUTH_ERROR", 500);
  }
}
