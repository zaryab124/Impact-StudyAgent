import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isStudentPortal = pathname.startsWith("/student");
  const isParentPortal = pathname.startsWith("/parent");
  const isOrgPortal = pathname.startsWith("/org");
  const isAdminPortal = pathname.startsWith("/admin");

  // Only apply to protected portal paths
  if (!isStudentPortal && !isParentPortal && !isOrgPortal && !isAdminPortal) {
    return NextResponse.next();
  }

  // Check session token from cookie or Authorization header
  const sessionToken = request.cookies.get("session_token")?.value;
  const userRole = request.cookies.get("user_role")?.value;
  const authHeader = request.headers.get("authorization");

  const isAuthenticated = Boolean(sessionToken || authHeader);

  // 1. Unauthenticated redirect to login
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    loginUrl.searchParams.set("error", "authentication_required");
    return NextResponse.redirect(loginUrl);
  }

  // 2. Strict Role Isolation Gate
  if (userRole) {
    if (isAdminPortal && userRole !== "ADMIN" && userRole !== "CURRICULUM_OFFICER") {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("error", "forbidden_admin_access");
      return NextResponse.redirect(redirectUrl);
    }

    if (isParentPortal && userRole !== "PARENT" && userRole !== "ADMIN") {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("error", "forbidden_parent_access");
      return NextResponse.redirect(redirectUrl);
    }

    if (isOrgPortal && userRole !== "ORGANIZATION" && userRole !== "ADMIN") {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("error", "forbidden_org_access");
      return NextResponse.redirect(redirectUrl);
    }

    if (isStudentPortal && userRole !== "STUDENT" && userRole !== "ADMIN") {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("error", "forbidden_student_access");
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/parent/:path*",
    "/org/:path*",
    "/admin/:path*",
  ],
};
