"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlError = searchParams?.get("error");
  const callbackUrl = searchParams?.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Friendly error explanations for redirect gates
  const getUrlErrorMessage = (code: string | null) => {
    if (!code) return null;
    switch (code) {
      case "authentication_required":
        return "Authentication required. Please sign in with your credentials to access this portal.";
      case "forbidden_student_access":
        return "Access denied. Only registered Students can access that portal.";
      case "forbidden_parent_access":
        return "Access denied. Only verified Parents can access the Parent Portal.";
      case "forbidden_org_access":
        return "Access denied. Only authorized Organizations can access the Organization Portal.";
      case "forbidden_admin_access":
        return "Access denied. Administrator privileges are required to access that area.";
      default:
        return "Access restricted. Please sign in with an authorized account.";
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Invalid email or password.");
      }

      const user = data.data.user;
      const token = data.data.token;

      // Store token and user in localStorage & cookies for middleware verification
      if (token) {
        localStorage.setItem("session_token", token);
        localStorage.setItem("user_role", user.role);
        localStorage.setItem("user_id", user.id);
        localStorage.setItem("user_name", user.name);

        document.cookie = `session_token=${token}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `user_role=${user.role}; path=/; max-age=86400; SameSite=Lax`;

        // Trigger reactive navbar refresh
        window.dispatchEvent(new Event("auth-changed"));
      }

      setSuccess(`Signed in successfully as ${user.name} (${user.role}). Redirecting...`);

      // Role-based destination routing
      setTimeout(() => {
        if (callbackUrl && callbackUrl.startsWith("/")) {
          router.push(callbackUrl);
          return;
        }

        if (user.role === "PARENT") {
          router.push("/parent");
        } else if (user.role === "ORGANIZATION") {
          router.push("/org");
        } else if (user.role === "ADMIN" || user.role === "CURRICULUM_OFFICER") {
          router.push("/admin/approvals");
        } else {
          router.push("/student");
        }
      }, 600);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const bannerError = error || getUrlErrorMessage(urlError);

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-4">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Sign In to Live Paper Platform
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          Enter your authentic account credentials to access your authorized portal.
        </p>
      </div>

      {bannerError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-300">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
          <p className="leading-relaxed">{bannerError}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <p>{success}</p>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur shadow-xl">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Email or Parent Username
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@example.pk or parent username"
              autoComplete="username"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Password
            </label>
            <span className="text-[11px] text-slate-500">Encrypted & Salted</span>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <span>Sign In to Portal</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="pt-2 text-center text-xs text-slate-400">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="font-semibold text-indigo-400 hover:underline">
            Register Student or Organization
          </Link>
        </div>
      </form>

      <div className="text-center">
        <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Strict Role-Based Access Control Active & Verified
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
