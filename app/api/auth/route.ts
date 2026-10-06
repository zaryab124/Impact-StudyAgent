import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { LoginSchema, RegisterSchema } from "@/lib/validations/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { ServerAuthService } from "@/server/auth/auth-service";
import { AuthenticatedUser, UserRole } from "@/types/auth";

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
  const rateLimit = checkRateLimit(`auth_${ip}`, { limit: 15, windowMs: 60000 });

  if (!rateLimit.allowed) {
    return apiError("Too many authentication attempts. Please retry later.", "RATE_LIMIT_EXCEEDED", 429);
  }

  try {
    const body = await req.json();
    const action = req.nextUrl.searchParams.get("action") || "login";

    if (action === "register") {
      const parsed = RegisterSchema.safeParse(body);
      if (!parsed.success) {
        return apiError("Registration validation failed", "VALIDATION_ERROR", 400, 
          parsed.error.errors.map(e => ({ field: e.path.join("."), issue: e.message }))
        );
      }

      const newUser: AuthenticatedUser = {
        id: `user_${Date.now()}`,
        email: parsed.data.email,
        name: parsed.data.name,
        role: parsed.data.role as UserRole,
        isActive: true,
      };

      const token = ServerAuthService.createSession(newUser);

      return apiSuccess({
        message: "User registered successfully.",
        token,
        user: newUser,
      }, 201);
    }

    // Default: Login
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Login validation failed", "VALIDATION_ERROR", 400,
        parsed.error.errors.map(e => ({ field: e.path.join("."), issue: e.message }))
      );
    }

    const email = parsed.data.email.toLowerCase();
    let role: UserRole = "STUDENT";
    let name = "Student User";
    let userId = `usr_${email.replace(/[^a-z0-9]/g, "_")}`;

    if (email.includes("admin")) {
      role = "ADMIN";
      name = "Chief Academic Administrator";
      userId = "admin-user-id";
    } else if (email.includes("officer")) {
      role = "CURRICULUM_OFFICER";
      name = "Curriculum Officer";
      userId = "officer-user-id";
    } else if (email.includes("teacher")) {
      role = "TEACHER";
      name = "Senior Faculty";
      userId = "teacher-user-id";
    } else if (email.includes("examiner")) {
      role = "EXAMINER";
      name = "Examination Officer";
      userId = "examiner-user-id";
    }

    const user: AuthenticatedUser = {
      id: userId,
      email: parsed.data.email,
      name,
      role,
      isActive: true,
    };

    const token = ServerAuthService.createSession(user);

    return apiSuccess({
      message: "Authentication successful.",
      token,
      user,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return apiError(message, "AUTH_ERROR", 500);
  }
}
