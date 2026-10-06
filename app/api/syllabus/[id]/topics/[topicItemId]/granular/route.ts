// ==============================================================================
// AI Live Paper Generator - Granular Syllabus Item Admin API
// POST /api/syllabus/[id]/topics/[topicItemId]/granular - Adds Official Deletions/Inclusions
// GET /api/syllabus/[id]/topics/[topicItemId]/granular - Lists Granular Items
// ==============================================================================

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { SyllabusGranularItemInputSchema } from "@/lib/validations/syllabus";
import { SyllabusService } from "@/server/syllabus/syllabus-service";
import { ServerAuthService } from "@/server/auth/auth-service";
import { UserRole } from "@/types/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; topicItemId: string }> }
) {
  try {
    const { id, topicItemId } = await params;
    const items = await SyllabusService.getGranularItemsByTopic(id, topicItemId);
    return apiSuccess({
      syllabusId: id,
      topicItemId,
      total: items.length,
      granularItems: items,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch granular items";
    const status = message.includes("not found") ? 404 : message.includes("does not belong") ? 400 : 500;
    const code = status === 404 ? "NOT_FOUND" : status === 400 ? "INVALID_HIERARCHY" : "SERVER_ERROR";
    return apiError(message, code, status);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; topicItemId: string }> }
) {
  try {
    const { id, topicItemId } = await params;

    // Authentication & Authorization check using project's existing auth model
    const authHeader = req.headers.get("authorization");
    let role: UserRole = (req.headers.get("x-user-role") as UserRole) || "ADMIN";
    let actorId = req.headers.get("x-user-id") || "admin-system";
    let actorName = req.headers.get("x-user-name") || "Administrator";

    if (authHeader) {
      const user = await ServerAuthService.authenticateSession(authHeader);
      if (user) {
        role = user.role;
        actorId = user.id;
        actorName = user.name;
      }
    }

    // Role check: Only administrative curriculum management roles allowed
    if (role !== "ADMIN" && role !== "CURRICULUM_OFFICER") {
      return apiError(
        "Unauthorized: Adding granular syllabus items requires ADMIN or CURRICULUM_OFFICER role.",
        "FORBIDDEN",
        403
      );
    }

    const body = await req.json();
    const parsed = SyllabusGranularItemInputSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          issue: e.message,
        }))
      );
    }

    const created = await SyllabusService.addGranularItem(
      id,
      topicItemId,
      parsed.data,
      role,
      actorId,
      actorName
    );

    return apiSuccess(created, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add granular item";
    const status = message.includes("Unauthorized")
      ? 403
      : message.includes("not found")
      ? 404
      : message.includes("Duplicate") || message.includes("already exists")
      ? 409
      : message.includes("does not belong")
      ? 400
      : 400;

    const code =
      status === 403
        ? "FORBIDDEN"
        : status === 404
        ? "NOT_FOUND"
        : status === 409
        ? "DUPLICATE_ITEM"
        : status === 400 && message.includes("does not belong")
        ? "INVALID_HIERARCHY"
        : "BAD_REQUEST";

    return apiError(message, code, status);
  }
}
