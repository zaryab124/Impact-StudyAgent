"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Building,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
  Key,
  Users,
  Copy,
  Sparkles,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  // Selected registration role
  const [role, setRole] = useState<"STUDENT" | "ORGANIZATION">("STUDENT");

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Student specific
  const [studentRollNumber, setStudentRollNumber] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");

  // Organization specific
  const [orgName, setOrgName] = useState("");
  const [orgPlan, setOrgPlan] = useState<"MONTHLY" | "YEARLY">("YEARLY");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");

  // Receipt File / Upload
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredResult, setRegisteredResult] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);

      // Create base64 or preview URL
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setReceiptPreview(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        name,
        email,
        password,
        role,
        receiptData: receiptPreview || "uploads/receipts/bank_slip_uploaded.png",
      };

      if (role === "STUDENT") {
        payload.studentRollNumber = studentRollNumber;
        payload.parentName = parentName;
        payload.parentEmail = parentEmail || `parent.${email}`;
      } else {
        payload.orgName = orgName || name;
        payload.plan = orgPlan;
        payload.contactPhone = contactPhone;
        payload.address = address;
      }

      const res = await fetch("/api/auth?action=register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Registration failed.");
      }

      setRegisteredResult(data.data);
    } catch (err: any) {
      setError(err.message || "Failed to submit registration. Please check fields.");
    } finally {
      setLoading(false);
    }
  };

  const copyParentCreds = () => {
    if (registeredResult?.parentCredentials) {
      const text = `Parent Portal Login:
Username: ${registeredResult.parentCredentials.username}
Password: ${registeredResult.parentCredentials.temporaryPassword}
Portal URL: ${window.location.origin}/parent`;
      navigator.clipboard.writeText(text);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="relative min-h-[90vh] py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Transparent Membership & Secure RBAC Portals</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Register Your Account
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Select your registration tier. Upload your payment slip for instant verification by administration.
        </p>
      </div>

      {/* Registration Success Modal / Screen */}
      {registeredResult ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-8 shadow-2xl backdrop-blur">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
            <CheckCircle2 className="h-6 w-6" />
          </div>

          <h2 className="text-xl font-bold text-white">
            Registration Submitted Successfully!
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Your payment receipt has been uploaded and queued for Administrator verification.
            Once verified, your account status will transition from <span className="font-semibold text-amber-400">PENDING APPROVAL</span> to <span className="font-semibold text-emerald-400">ACTIVE</span>.
          </p>

          {/* If Student: Display Parent Credentials Box */}
          {registeredResult.parentCredentials && (
            <div className="mt-6 rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-indigo-200">
                    Auto-Provisioned Parent Portal Credentials
                  </h3>
                </div>
                <button
                  onClick={copyParentCreds}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 transition-all"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copiedKey ? "Copied!" : "Copy Credentials"}</span>
                </button>
              </div>

              <p className="mt-2 text-xs text-indigo-300/80">
                Provide these credentials to your parents so they can log in at <span className="font-mono text-white">/parent</span> to inspect your practice test scores and chapter weak areas:
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800">
                  <span className="block text-[11px] text-slate-400">Parent Username</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {registeredResult.parentCredentials.username}
                  </span>
                </div>
                <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800">
                  <span className="block text-[11px] text-slate-400">Temporary Password</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {registeredResult.parentCredentials.temporaryPassword}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-all"
            >
              <span>Proceed to Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur shadow-xl">
          {/* Role Tabs */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button
              type="button"
              onClick={() => setRole("STUDENT")}
              className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all ${
                role === "STUDENT"
                  ? "border-indigo-500 bg-indigo-950/50 text-white shadow-lg shadow-indigo-950/50"
                  : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-400" />
                <span className="font-bold text-sm">Individual Student</span>
              </div>
              <span className="text-xs text-slate-300 font-semibold mt-1">
                Fee: Rs. 500 / Year
              </span>
              <span className="text-[11px] text-slate-400">
                Includes app practice, auto MCQ grading, short/long paper evaluation & Parent Portal credentials.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRole("ORGANIZATION")}
              className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all ${
                role === "ORGANIZATION"
                  ? "border-amber-500 bg-amber-950/50 text-white shadow-lg shadow-amber-950/50"
                  : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-amber-400" />
                <span className="font-bold text-sm">School / College / Academy</span>
              </div>
              <span className="text-xs text-amber-300 font-semibold mt-1">
                Rs. 500 / month OR Rs. 5,000 / Year
              </span>
              <span className="text-[11px] text-slate-400">
                Includes branded testing series creation, student printable test sheets & downloadable solution PDFs.
              </span>
            </button>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            {/* Common Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name / Contact Person *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Muhammad Ali"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.pk"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {role === "STUDENT" ? (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Student Roll Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={studentRollNumber}
                    onChange={(e) => setStudentRollNumber(e.target.value)}
                    placeholder="e.g. 2025-LHR-908"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Institution / Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Punjab College of Sciences"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Role-Specific Fields */}
            {role === "STUDENT" ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                  <Users className="h-4 w-4" />
                  <span>Parent / Guardian Linkage (Auto-Generates Parent Portal Access)</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Parent&apos;s Full Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="e.g. Tariq Mehmood"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Parent Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      placeholder="parent@example.pk"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400">
                    Organization Subscription Plan Selection:
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-500/30">
                    Save Rs. 1,000 on Annual Plan!
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                      orgPlan === "MONTHLY"
                        ? "border-amber-500 bg-amber-950/40"
                        : "border-slate-800 bg-slate-900/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="orgPlan"
                      checked={orgPlan === "MONTHLY"}
                      onChange={() => setOrgPlan("MONTHLY")}
                      className="mt-1"
                    />
                    <div>
                      <span className="block text-xs font-bold text-white">Monthly Plan</span>
                      <span className="text-xs text-slate-300 font-semibold">Rs. 500 / month</span>
                      <span className="block text-[11px] text-slate-400 mt-1">Billed monthly recurring.</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                      orgPlan === "YEARLY"
                        ? "border-amber-500 bg-amber-950/40 shadow-md"
                        : "border-slate-800 bg-slate-900/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="orgPlan"
                      checked={orgPlan === "YEARLY"}
                      onChange={() => setOrgPlan("YEARLY")}
                      className="mt-1"
                    />
                    <div>
                      <span className="block text-xs font-bold text-emerald-300">Annual Plan (Discounted)</span>
                      <span className="text-xs text-white font-bold">Rs. 5,000 / year</span>
                      <span className="block text-[11px] text-emerald-400 mt-1">Includes Rs. 1,000 Special Discount!</span>
                    </div>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Contact Phone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Campus / City Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Main Boulevard, Gulberg, Lahore"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Bank Details & Slip Upload */}
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Payment & Receipt Verification</h3>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-300">
                  Total Payable: {role === "STUDENT" ? "Rs. 500 (Annual)" : orgPlan === "YEARLY" ? "Rs. 5,000 (Annual - Save Rs. 1000)" : "Rs. 500 (Monthly)"}
                </span>
              </div>

              <div className="rounded-lg bg-slate-950/80 p-3.5 border border-slate-800 text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-slate-200">Official Payment Account:</p>
                <p>• Bank: Allied Bank / Meezan Bank / JazzCash / EasyPaisa</p>
                <p>• Account Title: <span className="font-medium text-white">AI Live Paper Academic Testing Services</span></p>
                <p>• Account/IBAN: <span className="font-mono text-indigo-300">PK89MEZN0001234567890102</span> (or JazzCash: 0300-1234567)</p>
              </div>

              {/* Upload Receipt */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Upload Payment Screenshot / Bank Deposit Slip *
                </label>
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/60 p-6 text-center hover:border-indigo-500 transition-colors">
                  <Upload className="h-8 w-8 text-indigo-400 mb-2" />
                  <p className="text-xs text-slate-300 font-medium">
                    Click to select payment receipt screenshot, image (PNG/JPG) or PDF
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Max size: 10MB. File is reviewed by administration before activation.
                  </p>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleReceiptChange}
                    className="mt-3 text-xs text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-500"
                  />
                  {receiptPreview && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Receipt ready for submission ({receiptFile?.name || "Uploaded"})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Submit Registration & Queue for Admin Approval</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
