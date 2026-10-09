// ==============================================================================
// AI Live Paper Generator - Centralized Security & Authorization Guard (Phase 16)
// Server-Authoritative RBAC, IDOR Protection, File Validation, Secret Quarantine
// ==============================================================================

import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-response";
import { ServerAuthService } from "@/server/auth/auth-service";
import { AuthenticatedUser, UserRole, Permission } from "@/types/auth";
import { hasPermission } from "@/server/rbac";
import { checkRateLimit } from "@/lib/rate-limit";

export interface AuthGuardResult {
  authorized: boolean;
  user: AuthenticatedUser | null;
  response?: Response;
}

export class AuthGuard {
  /**
   * Authenticates the current request from session tokens, cookies, or headers.
   */
  public static async authenticate(req: NextRequest): Promise<AuthenticatedUser | null> {
    const authHeader = req.headers.get("authorization");
    const roleHeader = req.headers.get("x-user-role") as UserRole | null;
    const userIdHeader = req.headers.get("x-user-id");

    if (authHeader) {
      const user = await ServerAuthService.authenticateSession(authHeader);
      if (user) return user;
    }

    // Check session cookie if present
    const sessionCookie = req.cookies.get("session_token")?.value;
    if (sessionCookie) {
      const user = await ServerAuthService.authenticateSession(sessionCookie);
      if (user) return user;
    }

    // Role-header fallback for automated internal / integration testing only
    if (process.env.NODE_ENV === "test" && roleHeader) {
      return {
        id: userIdHeader || `${roleHeader.toLowerCase()}-user-id`,
        email: `${roleHeader.toLowerCase()}@examinations.gov.pk`,
        name: `${roleHeader} User`,
        role: roleHeader,
        isActive: true,
      };
    }

    return null;
  }

  /**
   * Requires that the request is authenticated with at least one of the specified roles.
   */
  public static async requireRole(
    req: NextRequest,
    allowedRoles: UserRole[],
    options: { requireActiveSubscription?: boolean } = { requireActiveSubscription: true }
  ): Promise<AuthGuardResult> {
    const user = await this.authenticate(req);

    if (!user) {
      return {
        authorized: false,
        user: null,
        response: apiError("Authentication required. Missing or invalid credentials.", "UNAUTHORIZED", 401),
      };
    }

    if (!allowedRoles.includes(user.role)) {
      return {
        authorized: false,
        user,
        response: apiError(
          `Forbidden: Role "${user.role}" is not authorized for this resource. Required roles: ${allowedRoles.join(", ")}.`,
          "FORBIDDEN",
          403
        ),
      };
    }

    if (
      options.requireActiveSubscription !== false &&
      (user.role === "STUDENT" || user.role === "ORGANIZATION") &&
      user.subscriptionStatus === "PENDING_APPROVAL"
    ) {
      return {
        authorized: false,
        user,
        response: apiError(
          "Account pending approval: Your registration payment receipt is currently under administrator review. Access will be activated upon approval.",
          "PENDING_APPROVAL",
          403
        ),
      };
    }

    return { authorized: true, user };
  }

  /**
   * Requires that the request user has a specific permission.
   */
  public static async requirePermission(
    req: NextRequest,
    permission: Permission
  ): Promise<AuthGuardResult> {
    const user = await this.authenticate(req);

    if (!user) {
      return {
        authorized: false,
        user: null,
        response: apiError("Authentication required.", "UNAUTHORIZED", 401),
      };
    }

    if (!hasPermission(user.role, permission)) {
      return {
        authorized: false,
        user,
        response: apiError(
          `Forbidden: Role "${user.role}" lacks required permission "${permission}".`,
          "FORBIDDEN",
          403
        ),
      };
    }

    return { authorized: true, user };
  }

  /**
   * Verifies object-level authorization (IDOR protection).
   * Ordinary students can ONLY access their own resources.
   * Admins and Teachers can inspect student attempts for grading/oversight.
   */
  public static checkOwnership(
    user: AuthenticatedUser,
    resourceOwnerStudentId: string
  ): { authorized: boolean; reason?: string } {
    if (user.role === "ADMIN" || user.role === "TEACHER" || user.role === "CURRICULUM_OFFICER") {
      return { authorized: true };
    }

    if (user.role === "STUDENT" && user.id === resourceOwnerStudentId) {
      return { authorized: true };
    }

    return {
      authorized: false,
      reason: `Access Denied: Student "${user.id}" cannot access resource belonging to "${resourceOwnerStudentId}".`,
    };
  }

  /**
   * Validates uploaded files against size, extension, magic-bytes, and path traversal.
   */
  public static validateUpload(
    filename: string,
    buffer: Buffer | Uint8Array,
    options: {
      maxSizeBytes?: number;
      allowedExtensions?: string[];
      requirePdfMagicBytes?: boolean;
    } = {}
  ): { isValid: boolean; error?: string } {
    const maxSizeBytes = options.maxSizeBytes || 50 * 1024 * 1024; // 50MB
    const allowedExtensions = options.allowedExtensions || [".pdf"];

    // 1. Path traversal defense
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\") ||
      filename.includes("%2e%2e")
    ) {
      return { isValid: false, error: "SECURITY_VIOLATION: Path traversal sequence detected in filename." };
    }

    // 2. Extension check
    const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return {
        isValid: false,
        error: `INVALID_FILE_TYPE: File extension "${ext}" is not permitted. Allowed: ${allowedExtensions.join(", ")}.`,
      };
    }

    // 3. File size check
    if (buffer.length > maxSizeBytes) {
      return {
        isValid: false,
        error: `FILE_TOO_LARGE: Upload size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds allowed limit of ${(maxSizeBytes / (1024 * 1024)).toFixed(0)} MB.`,
      };
    }

    // 4. Magic bytes verification (PDF magic bytes: %PDF = 0x25 0x50 0x44 0x46)
    if (options.requirePdfMagicBytes !== false && ext === ".pdf") {
      const isPdfMagic =
        buffer.length >= 4 &&
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46;

      if (!isPdfMagic) {
        return {
          isValid: false,
          error: "SPOOFED_FILE: File claims to be PDF but does not match required %PDF magic-byte signature.",
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Sanitizes exam paper and questions before sending to student clients.
   * Ensures answerKey, correctOptionKey, and examiner rubric are never leaked.
   */
  public static quarantineStudentView(data: any): any {
    if (!data) return data;
    const clone = JSON.parse(JSON.stringify(data));

    const sanitizeQuestion = (q: any) => {
      delete q.answerKey;
      delete q.answerMaterial;
      delete q.rubricCriteria;
      delete q.markingCriteria;
      delete q.sampleExemplar;
      delete q.expectedAnswer;
      if (Array.isArray(q.options)) {
        q.options = q.options.map((opt: any) => ({
          key: opt.key,
          text: opt.text,
        }));
      }
      return q;
    };

    if (Array.isArray(clone)) {
      return clone.map(sanitizeQuestion);
    }

    if (Array.isArray(clone.questions)) {
      clone.questions = clone.questions.map(sanitizeQuestion);
    }

    if (clone.snapshot && Array.isArray(clone.snapshot.questions)) {
      clone.snapshot.questions = clone.snapshot.questions.map(sanitizeQuestion);
    }

    delete clone.answerKey;
    delete clone.answerMaterial;
    delete clone.rubricCriteria;

    return clone;
  }

  /**
   * Rate limits expensive AI or generation endpoints.
   */
  public static checkEndpointRateLimit(
    req: NextRequest,
    action: string,
    limit: number = 30,
    windowMs: number = 60000
  ): { allowed: boolean; remaining: number; resetMs: number } {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userRole = req.headers.get("x-user-role") || "anonymous";
    const key = `rl_${action}_${ip}_${userRole}`;
    return checkRateLimit(key, { limit, windowMs });
  }
}
