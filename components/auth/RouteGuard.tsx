"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, ArrowRight, LogOut } from "lucide-react";
import Link from "next/link";

interface RouteGuardProps {
  allowedRoles: string[];
  portalName: string;
  children: React.ReactNode;
}

export function RouteGuard({ allowedRoles, portalName, children }: RouteGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("session_token");
    const role = localStorage.getItem("user_role");
    const name = localStorage.getItem("user_name");

    if (!token || !role) {
      router.replace(`/login?error=authentication_required`);
      return;
    }

    setCurrentRole(role);
    setCurrentName(name);

    if (allowedRoles.includes(role) || role === "ADMIN") {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }

    setChecking(false);
  }, [allowedRoles, router]);

  const handleSignOut = () => {
    localStorage.removeItem("session_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    document.cookie = "session_token=; path=/; max-age=0";
    document.cookie = "user_role=; path=/; max-age=0";
    router.push("/login");
  };

  if (checking) {
    return (
      <div className="flex min-h-[70vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-300">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Verifying Authentication & Portal Access...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-rose-900/60 bg-rose-950/20 p-8 backdrop-blur">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-4">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">Access Restricted</h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-300">
            You are signed in as <span className="font-bold text-rose-300 uppercase">{currentRole}</span> ({currentName || "User"}), but this portal requires <span className="font-bold text-indigo-300 uppercase">{allowedRoles.join(" or ")}</span> credentials.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={
                currentRole === "STUDENT"
                  ? "/student"
                  : currentRole === "PARENT"
                  ? "/parent"
                  : currentRole === "ORGANIZATION"
                  ? "/org"
                  : "/admin"
              }
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20"
            >
              <span>Go to My Authorized Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
