"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ShieldCheck,
  Activity,
  LayoutDashboard,
  FileCheck2,
  Layers,
  Zap,
  Award,
  TrendingDown,
  Menu,
  X,
  Users,
  Building,
  LogIn,
  UserPlus,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const portalLinks = [
    { href: "/student", label: "Student Room", icon: LayoutDashboard },
    { href: "/parent", label: "Parent Portal", icon: Users },
    { href: "/org", label: "Organization Hub", icon: Building },
  ];

  const studentSubLinks = [
    { href: "/student/create-paper", label: "Create Paper", icon: FileCheck2 },
    { href: "/student/practice", label: "Practice Drills", icon: Zap },
    { href: "/student/weak-areas", label: "Weak Areas", icon: TrendingDown },
  ];

  const adminLinks = [
    { href: "/admin/approvals", label: "Approvals Gate", icon: ShieldCheck },
    { href: "/admin", label: "Admin Console", icon: Activity },
  ];

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
        <nav className="hidden lg:flex items-center gap-1">
          {/* Main Role Portals */}
          {portalLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/student" && pathname.startsWith(link.href));
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

          <div className="mx-1 h-4 w-px bg-slate-800" />

          {/* Student Tools */}
          {studentSubLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-slate-800 text-indigo-400 border border-slate-700"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="mx-1 h-4 w-px bg-slate-800" />

          {/* Admin Links */}
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-rose-950/40 text-rose-300 border border-rose-800/40"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="mx-1.5 h-4 w-px bg-slate-800" />

          {/* Auth Links */}
          <Link
            href="/login"
            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Register</span>
          </Link>
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
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 pb-1">
              Portals
            </div>
            {portalLinks.map((link) => {
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
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 pb-1">
              Admin & Governance
            </div>
            {adminLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  <Icon className="h-4 w-4 text-rose-400" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

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
    </header>
  );
}
