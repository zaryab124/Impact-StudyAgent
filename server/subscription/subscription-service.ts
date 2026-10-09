// ==============================================================================
// AI Live Paper Generator - Subscription & Membership Management Service
// Handles Student (Rs. 500/yr), Organization (Rs. 500/mo or Rs. 5000/yr),
// Payment Receipts, Admin Approval, Parent Auto-Provisioning & RBAC Access
// ==============================================================================

import { createHash, randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { AuthenticatedUser, UserRole } from "@/types/auth";
import { ServerAuthService } from "@/server/auth/auth-service";

export interface RegisterPaidStudentInput {
  name: string;
  email: string;
  password: string;
  receiptUrl?: string;
  receiptData?: string;
  studentRollNumber?: string;
  parentName?: string;
  parentEmail?: string;
}

export interface RegisterPaidOrgInput {
  name: string;
  email: string;
  password: string;
  orgName: string;
  orgCode?: string;
  plan: "MONTHLY" | "YEARLY";
  receiptUrl?: string;
  receiptData?: string;
  contactPhone?: string;
  address?: string;
}

export class SubscriptionService {
  /**
   * Hashes a plain password using SHA-256 with salt.
   */
  public static hashPassword(password: string): string {
    return createHash("sha256").update(`salt_agy_${password}`).digest("hex");
  }

  /**
   * Verifies password against hash.
   */
  public static verifyPassword(password: string, hash: string): boolean {
    const computed = this.hashPassword(password);
    return computed === hash;
  }

  /**
   * Registers a student with yearly fee (Rs. 500), payment receipt upload,
   * sets status to PENDING_APPROVAL, and auto-provisions Parent credentials.
   */
  public static async registerStudent(input: RegisterPaidStudentInput) {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new Error(`User with email "${normalizedEmail}" is already registered.`);
    }

    const passwordHash = this.hashPassword(input.password);
    const receipt = input.receiptData || input.receiptUrl || "uploads/receipts/pending_receipt.pdf";

    // Create student
    const student = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: input.name,
        passwordHash,
        role: "STUDENT",
        subscriptionStatus: "PENDING_APPROVAL",
        isActive: true,
      },
    });

    // Create subscription record (Rs. 500 / year)
    const subscription = await prisma.subscription.create({
      data: {
        userId: student.id,
        role: "STUDENT",
        plan: "YEARLY",
        amount: 500.0,
        discountApplied: 0,
        receiptUrl: receipt,
        status: "PENDING_APPROVAL",
        notes: `Student self-registration for ${input.name}. Roll: ${input.studentRollNumber || "N/A"}`,
      },
    });

    // Generate Parent account credentials
    const emailPrefix = normalizedEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    const parentUsername = `parent_${emailPrefix}`;
    const parentPassword = `Parent@${Math.floor(1000 + Math.random() * 9000)}`;
    const parentEmail = (input.parentEmail || `parent.${normalizedEmail}`).toLowerCase().trim();

    // Create or find Parent user
    let parentUser = await prisma.user.findUnique({
      where: { email: parentEmail },
    });

    if (!parentUser) {
      parentUser = await prisma.user.create({
        data: {
          email: parentEmail,
          name: input.parentName || `Parent of ${input.name}`,
          passwordHash: this.hashPassword(parentPassword),
          role: "PARENT",
          subscriptionStatus: "PENDING_APPROVAL",
          isActive: true,
        },
      });
    }

    // Link Parent to Student
    await prisma.parentStudentLink.create({
      data: {
        parentId: parentUser.id,
        studentId: student.id,
        parentUsername,
        parentPassword, // Saved for student reference / admin view
        relationship: "Parent/Guardian",
      },
    });

    return {
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        role: student.role,
        subscriptionStatus: student.subscriptionStatus,
      },
      subscription: {
        id: subscription.id,
        amount: subscription.amount,
        plan: subscription.plan,
        status: subscription.status,
      },
      parentCredentials: {
        username: parentUsername,
        email: parentEmail,
        temporaryPassword: parentPassword,
        portalNotice: "Share these credentials with your parent to access the Parent Progress Portal.",
      },
    };
  }

  /**
   * Registers an organization with Monthly (Rs. 500) or Yearly (Rs. 5,000, Rs. 1,000 discount)
   * fee, receipt upload, and sets status to PENDING_APPROVAL.
   */
  public static async registerOrganization(input: RegisterPaidOrgInput) {
    const normalizedEmail = input.email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new Error(`Account with email "${normalizedEmail}" already exists.`);
    }

    // Organization code generation
    const orgCode = (
      input.orgCode ||
      input.orgName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) + `_${Math.floor(100 + Math.random() * 900)}`
    ).trim();

    // Determine fees and discount:
    // Monthly: Rs. 500 / month
    // Yearly: Rs. 5,000 / year (Standard 12 x 500 = 6,000, Discount = 1,000)
    const plan = input.plan === "MONTHLY" ? "MONTHLY" : "YEARLY";
    const amount = plan === "YEARLY" ? 5000.0 : 500.0;
    const discountApplied = plan === "YEARLY" ? 1000.0 : 0.0;
    const receipt = input.receiptData || input.receiptUrl || "uploads/receipts/pending_org_receipt.pdf";

    // Create Organization
    const organization = await prisma.organization.create({
      data: {
        name: input.orgName,
        code: orgCode,
        contactPerson: input.name,
        contactEmail: normalizedEmail,
        contactPhone: input.contactPhone,
        address: input.address,
        subscriptionStatus: "PENDING_APPROVAL",
        plan,
      },
    });

    // Create Org Admin User
    const passwordHash = this.hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: input.name,
        passwordHash,
        role: "ORGANIZATION",
        organizationId: organization.id,
        subscriptionStatus: "PENDING_APPROVAL",
        isActive: true,
      },
    });

    // Create Subscription record
    const subscription = await prisma.subscription.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        role: "ORGANIZATION",
        plan,
        amount,
        discountApplied,
        receiptUrl: receipt,
        status: "PENDING_APPROVAL",
        notes: `Organization registration for "${input.orgName}" (${plan} plan).`,
      },
    });

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        code: organization.code,
        subscriptionStatus: organization.subscriptionStatus,
        plan: organization.plan,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
      },
      subscription: {
        id: subscription.id,
        amount: subscription.amount,
        discountApplied: subscription.discountApplied,
        plan: subscription.plan,
        status: subscription.status,
      },
    };
  }

  /**
   * Authenticates user via database credentials and creates session.
   */
  public static async authenticateWithDb(email: string, password: string): Promise<{
    user: AuthenticatedUser;
    token: string;
    parentCredentials?: any;
  } | null> {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check database first
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }],
      },
      include: {
        organization: true,
        parentLinks: {
          include: { student: true },
        },
        studentLinks: true,
      },
    });

    if (dbUser) {
      // Check password if set
      if (dbUser.passwordHash) {
        const matches = this.verifyPassword(password, dbUser.passwordHash);
        if (!matches) {
          return null;
        }
      }

      const authUser: AuthenticatedUser = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role as UserRole,
        isActive: dbUser.isActive,
        subscriptionStatus: dbUser.subscriptionStatus as any,
        organizationId: dbUser.organizationId || undefined,
        organizationName: dbUser.organization?.name || undefined,
      };

      const token = ServerAuthService.createSession(authUser);
      return { user: authUser, token };
    }

    // 2. Check if this is a parent username login e.g. "parent_candidate"
    const link = await prisma.parentStudentLink.findFirst({
      where: { parentUsername: normalizedEmail },
      include: { parent: true, student: true },
    });

    if (link && link.parent) {
      if (link.parentPassword && link.parentPassword === password) {
        const authUser: AuthenticatedUser = {
          id: link.parent.id,
          email: link.parent.email,
          name: link.parent.name,
          role: "PARENT",
          isActive: link.parent.isActive,
          subscriptionStatus: link.parent.subscriptionStatus as any,
        };

        const token = ServerAuthService.createSession(authUser);
        return { user: authUser, token };
      }
    }

    return null;
  }

  /**
   * Lists all pending subscriptions requiring admin approval.
   */
  public static async listPendingApprovals() {
    const subscriptions = await prisma.subscription.findMany({
      where: { status: "PENDING_APPROVAL" },
      include: {
        user: {
          include: {
            studentLinks: true,
          },
        },
        organization: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return subscriptions.map((sub) => {
      const parentLink = sub.user?.studentLinks?.[0];
      return {
        id: sub.id,
        role: sub.role,
        plan: sub.plan,
        amount: Number(sub.amount),
        discountApplied: Number(sub.discountApplied),
        receiptUrl: sub.receiptUrl,
        status: sub.status,
        createdAt: sub.createdAt,
        user: sub.user
          ? {
              id: sub.user.id,
              name: sub.user.name,
              email: sub.user.email,
              role: sub.user.role,
              subscriptionStatus: sub.user.subscriptionStatus,
            }
          : null,
        organization: sub.organization
          ? {
              id: sub.organization.id,
              name: sub.organization.name,
              code: sub.organization.code,
              contactEmail: sub.organization.contactEmail,
              contactPhone: sub.organization.contactPhone,
              address: sub.organization.address,
            }
          : null,
        parentAccount: parentLink
          ? {
              parentUsername: parentLink.parentUsername,
              temporaryPassword: parentLink.parentPassword,
            }
          : null,
      };
    });
  }

  /**
   * Approves a subscription, activating user/organization account.
   */
  public static async approveSubscription(subscriptionId: string, adminUserId: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true, organization: true },
    });

    if (!sub) {
      throw new Error(`Subscription with ID "${subscriptionId}" not found.`);
    }

    const startDate = new Date();
    const endDate = new Date();
    if (sub.plan === "YEARLY") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Update Subscription
    const updatedSub = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "ACTIVE",
        approvedAt: startDate,
        approvedBy: adminUserId,
        startDate,
        endDate,
      },
    });

    // Activate User
    if (sub.userId) {
      await prisma.user.update({
        where: { id: sub.userId },
        data: {
          subscriptionStatus: "ACTIVE",
          isActive: true,
        },
      });

      // Also activate parent accounts linked to this student
      const links = await prisma.parentStudentLink.findMany({
        where: { studentId: sub.userId },
      });
      for (const link of links) {
        await prisma.user.update({
          where: { id: link.parentId },
          data: {
            subscriptionStatus: "ACTIVE",
            isActive: true,
          },
        });
      }
    }

    // Activate Organization
    if (sub.organizationId) {
      await prisma.organization.update({
        where: { id: sub.organizationId },
        data: {
          subscriptionStatus: "ACTIVE",
        },
      });

      // Activate all users under this organization
      await prisma.user.updateMany({
        where: { organizationId: sub.organizationId },
        data: {
          subscriptionStatus: "ACTIVE",
          isActive: true,
        },
      });
    }

    return {
      success: true,
      subscriptionId: updatedSub.id,
      status: updatedSub.status,
      activatedUntil: endDate,
    };
  }

  /**
   * Rejects a subscription with specified reason.
   */
  public static async rejectSubscription(subscriptionId: string, adminUserId: string, reason: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!sub) {
      throw new Error(`Subscription with ID "${subscriptionId}" not found.`);
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "REJECTED",
        approvedBy: adminUserId,
        rejectionReason: reason || "Payment receipt invalid or verification failed.",
      },
    });

    if (sub.userId) {
      await prisma.user.update({
        where: { id: sub.userId },
        data: { subscriptionStatus: "REJECTED" },
      });
    }

    if (sub.organizationId) {
      await prisma.organization.update({
        where: { id: sub.organizationId },
        data: { subscriptionStatus: "REJECTED" },
      });
    }

    return {
      success: true,
      subscriptionId: updated.id,
      status: updated.status,
      rejectionReason: updated.rejectionReason,
    };
  }

  /**
   * Retrieves performance analytics and weak areas for student (for Parent Portal).
   */
  public static async getStudentAnalytics(studentId: string) {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, email: true },
    });

    if (!student) {
      throw new Error(`Student with ID "${studentId}" not found.`);
    }

    const attempts = await prisma.examAttempt.findMany({
      where: { userId: studentId },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        },
        result: true,
        answers: {
          select: {
            id: true,
            submittedAnswer: true,
            selectedOption: true,
            marksAwarded: true,
            evaluationFeedback: true,
            weakAreaTag: true,
            answerType: true,
            attachmentUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalAttempts = attempts.length;
    let totalScore = 0;
    let scoreCount = 0;

    const weakAreaCounts: Record<string, { count: number; examples: string[] }> = {};

    attempts.forEach((att) => {
      if (att.result?.percentage) {
        totalScore += Number(att.result.percentage);
        scoreCount += 1;
      }

      att.answers.forEach((ans) => {
        if (ans.weakAreaTag) {
          if (!weakAreaCounts[ans.weakAreaTag]) {
            weakAreaCounts[ans.weakAreaTag] = { count: 0, examples: [] };
          }
          weakAreaCounts[ans.weakAreaTag].count += 1;
          if (ans.evaluationFeedback && weakAreaCounts[ans.weakAreaTag].examples.length < 3) {
            weakAreaCounts[ans.weakAreaTag].examples.push(ans.evaluationFeedback);
          }
        }
      });
    });

    const averagePercentage = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : "0.0";

    const weakAreas = Object.entries(weakAreaCounts)
      .map(([topic, data]) => ({
        topic,
        frequency: data.count,
        severity: data.count >= 3 ? "HIGH" : data.count >= 2 ? "MEDIUM" : "LOW",
        recommendations: data.examples,
      }))
      .sort((a, b) => b.frequency - a.frequency);

    return {
      student,
      summary: {
        totalExamsTaken: totalAttempts,
        averageScore: Number(averagePercentage),
        lastExamDate: attempts[0]?.createdAt || null,
        status: Number(averagePercentage) >= 60 ? "ON_TRACK" : "NEEDS_IMPROVEMENT",
      },
      weakAreas,
      recentAttempts: attempts.map((a) => ({
        id: a.id,
        paperTitle: a.paper.title,
        date: a.createdAt,
        status: a.status,
        percentage: a.result?.percentage ? Number(a.result.percentage) : null,
        grade: a.result?.grade || "N/A",
        feedbackSummary: a.result?.feedbackSummary || null,
      })),
    };
  }
}
