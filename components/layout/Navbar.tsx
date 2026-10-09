"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  ShieldCheck,
  Activity,
  LayoutDashboard,
  FileCheck2,
  Zap,
  TrendingDown,
  Menu,
  X,
  Users,
  Building,
  LogIn,
  UserPlus,
  LogOut,
  UserCheck,
  CreditCard,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [auth, setAuth] = useState<{
    token: string | null;
    role: string | null;
    name: string | null;
  }>({
    token: null,
    role: null,
    name: null,
  });

  const updateAuth = () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("session_token");
    const role = localStorage.getItem("user_role");
    const name = localStorage.getItem("user_name");
    setAuth({ token, role, name });
  };

  useEffect(() => {
    updateAuth();

    window.addEventListener("auth-changed", updateAuth);
    window.addEventListener("storage", updateAuth);

    return () => {
      window.removeEventListener("auth-changed", updateAuth);
      window.removeEventListener("storage", updateAuth);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("session_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");

    document.cookie = "session_token=; path=/; max-age=0";
    document.cookie = "user_role=; path=/; max-age=0";

    setAuth({ token: null, role: null, name: null });
    window.dispatchEvent(new Event("auth-changed"));
    setMobileMenuOpen(false);
    router.push("/login");
  };

  const isAuthenticated = Boolean(auth.token && auth.role);

  // Role-specific links
  const getAuthorizedLinks = () => {
    if (!isAuthenticated) return [];

    switch (auth.role) {
      case "STUDENT":
        return [
          { href: "/student", label: "Dashboard", icon: LayoutDashboard },
          { href: "/student/create-paper", label: "Create Paper", icon: FileCheck2 },
          { href: "/student/practice", label: "Practice Drills", icon: Zap },
          { href: "/student/weak-areas", label: "Weak Areas", icon: TrendingDown },
        ];
      case "PARENT":
        return [
          { href: "/parent", label: "Child Analytics", icon: Users },
        ];
      case "ORGANIZATION":
        return [
          { href: "/org", label: "Exam Workspace", icon: Building },
          { href: "/org/create-exam", label: "Official Exam Generator", icon: FileCheck2 },
        ];
      case "ADMIN":
      case "CURRICULUM_OFFICER":
        return [
          { href: "/admin/approvals", label: "Approvals Gate", icon: ShieldCheck },
          { href: "/admin", label: "Admin Console", icon: Activity },
          { href: "/admin/validation/launch", label: "Launch Gate", icon: ShieldCheck },
        ];
      default:
        return [];
    }
  };

  const navLinks = getAuthorizedLinks();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-md shadow-indigo-500/20">
            AG
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white">Study Agent</span>
            <span className="ml-2 rounded bg-indigo-950 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-800">
              ALL PUNJAB & FEDERAL
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {/* Public links for guests */}
          {!isAuthenticated && (
            <>
              <Link
                href="/pricing"
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  pathname === "/pricing"
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
                <span>Subscription Plans</span>
              </Link>
              <Link
                href="/#boards"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                <span>Punjab & Federal Boards</span>
              </Link>
            </>
          )}

          {/* Role Authorized Navigation for logged-in users */}
          {isAuthenticated && (
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== "/student" && link.href !== "/org" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                        : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mx-1.5 h-4 w-px bg-slate-800" />

          {/* User Auth State / Buttons */}
          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Register</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-950/80 px-2.5 py-1 text-xs">
                <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-semibold text-slate-200 truncate max-w-[120px]">
                  {auth.name || "User"}
                </span>
                <span className="rounded bg-indigo-950/80 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300 uppercase border border-indigo-800/50">
                  {auth.role}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1 rounded-md border border-rose-900/50 bg-rose-950/30 px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </nav>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-800 bg-slate-900 px-4 pt-2 pb-4 lg:hidden space-y-3">
          {isAuthenticated ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="text-xs text-slate-300 font-semibold">
                  Signed in as: <span className="text-white">{auth.name || "User"}</span>
                </div>
                <span className="rounded bg-indigo-950 px-2 py-0.5 text-[10px] font-bold text-indigo-300 uppercase border border-indigo-800">
                  {auth.role}
                </span>
              </div>

              <div className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                    >
                      <Icon className="h-4 w-4 text-indigo-400" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="border-t border-slate-800 pt-2">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-rose-900/50 bg-rose-950/40 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/60"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
              >
                <CreditCard className="h-4 w-4 text-indigo-400" />
                <span>Subscription Plans</span>
              </Link>
              <Link
                href="/#boards"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
              >
                <BookOpen className="h-4 w-4 text-slate-400" />
                <span>Punjab & Federal Boards</span>
              </Link>

              <div className="border-t border-slate-800 pt-2 flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center rounded-lg border border-slate-700 bg-slate-800 py-2 text-xs font-semibold text-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white"
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
