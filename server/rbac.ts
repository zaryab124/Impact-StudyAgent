import { Permission, UserRole } from "@/types/auth";

const ROLE_PERMISSIONS_MAP: Record<UserRole, Set<Permission>> = {
  STUDENT: new Set([
    Permission.READ_CURRICULUM,
    Permission.TAKE_EXAM,
    Permission.VIEW_OWN_RESULT,
  ]),
  TEACHER: new Set([
    Permission.READ_CURRICULUM,
    Permission.CREATE_BLUEPRINT,
    Permission.GENERATE_PAPER,
    Permission.VIEW_OWN_RESULT,
    Permission.VIEW_ALL_RESULTS,
  ]),
  EXAMINER: new Set([
    Permission.READ_CURRICULUM,
    Permission.MANAGE_CURRICULUM,
    Permission.CREATE_BLUEPRINT,
    Permission.GENERATE_PAPER,
    Permission.VALIDATE_QUESTION,
    Permission.PUBLISH_EXAM,
    Permission.VIEW_ALL_RESULTS,
  ]),
  CURRICULUM_OFFICER: new Set([
    Permission.READ_CURRICULUM,
    Permission.MANAGE_CURRICULUM,
    Permission.IMPORT_DATA,
    Permission.CREATE_BLUEPRINT,
    Permission.GENERATE_PAPER,
    Permission.VALIDATE_QUESTION,
    Permission.VIEW_ALL_RESULTS,
  ]),
  ADMIN: new Set(Object.values(Permission)),
};

/**
 * Evaluates whether a given user role possesses a specific permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS_MAP[role];
  return permissions ? permissions.has(permission) : false;
}

/**
 * Asserts that a role possesses the required permission or throws a Forbidden error.
 */
export function assertPermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(
      `Access Denied: Role "${role}" lacks required permission "${permission}".`
    );
  }
}

/**
 * Validates request authorization header or context against a required permission.
 */
export function authorizeServerRequest(
  role: UserRole | undefined,
  requiredPermission: Permission
): { authorized: boolean; reason?: string } {
  if (!role) {
    return { authorized: false, reason: "Authentication required. Missing user role." };
  }

  if (!hasPermission(role, requiredPermission)) {
    return {
      authorized: false,
      reason: `Access Denied: Role "${role}" lacks required permission "${requiredPermission}".`,
    };
  }

  return { authorized: true };
}

