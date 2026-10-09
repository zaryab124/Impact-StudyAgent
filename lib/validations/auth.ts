import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().min(3, "Email or parent username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["STUDENT", "ORGANIZATION", "PARENT", "TEACHER", "EXAMINER", "ADMIN"]).default("STUDENT"),
  plan: z.enum(["MONTHLY", "YEARLY"]).optional().default("YEARLY"),
  receiptData: z.string().optional(), // Base64 or upload reference
  receiptUrl: z.string().optional(),
  // Organization specific fields
  orgName: z.string().optional(),
  orgCode: z.string().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  // Student specific fields
  studentRollNumber: z.string().optional(),
  parentName: z.string().optional(),
  parentEmail: z.string().optional(),
});

