import { describe, it, expect, beforeEach } from "vitest";
import { SubscriptionService } from "@/server/subscription/subscription-service";
import { prisma } from "@/lib/db";

describe("Subscription, Portals & Role Approvals Tests", () => {
  const testStudentEmail = `test.student.${Date.now()}@candidate.edu.pk`;
  const testOrgEmail = `test.org.${Date.now()}@school.edu.pk`;

  it("1. Student Registration enforces Rs. 500/year and auto-provisions Parent credentials", async () => {
    const result = await SubscriptionService.registerStudent({
      name: "Ahmed Ali",
      email: testStudentEmail,
      password: "StudentPassword123",
      studentRollNumber: "2025-SSC-889",
      parentName: "Ali Raza",
      receiptUrl: "uploads/receipts/bank_slip_500.png",
    });

    expect(result.student).toBeDefined();
    expect(result.student.role).toBe("STUDENT");
    expect(result.student.subscriptionStatus).toBe("PENDING_APPROVAL");

    // Fee Invariant: Rs. 500 / year
    expect(Number(result.subscription.amount)).toBe(500);
    expect(result.subscription.plan).toBe("YEARLY");
    expect(result.subscription.status).toBe("PENDING_APPROVAL");

    // Parent Auto-Provisioning Invariant
    expect(result.parentCredentials).toBeDefined();
    expect(result.parentCredentials.username).toMatch(/^parent_/);
    expect(result.parentCredentials.temporaryPassword).toMatch(/^Parent@\d+/);
  });

  it("2. Organization Registration supports Monthly (Rs. 500) and Annual (Rs. 5,000 with Rs. 1,000 discount)", async () => {
    const annualResult = await SubscriptionService.registerOrganization({
      name: "Principal Farooq",
      email: testOrgEmail,
      password: "OrgPassword123",
      orgName: "Beaconhouse College Campus",
      plan: "YEARLY",
      contactPhone: "03001234567",
      receiptUrl: "uploads/receipts/org_annual_slip.png",
    });

    expect(annualResult.organization).toBeDefined();
    expect(annualResult.user.role).toBe("ORGANIZATION");
    expect(annualResult.user.subscriptionStatus).toBe("PENDING_APPROVAL");

    // Pricing & Discount Invariant: Rs. 5,000 with Rs. 1,000 discount
    expect(Number(annualResult.subscription.amount)).toBe(5000);
    expect(Number(annualResult.subscription.discountApplied)).toBe(1000);
    expect(annualResult.subscription.plan).toBe("YEARLY");
  });

  it("3. Admin Approval activates student, parent, and organization accounts", async () => {
    const pendingList = await SubscriptionService.listPendingApprovals();
    expect(Array.isArray(pendingList)).toBe(true);

    const studentPending = pendingList.find((s) => s.user?.email === testStudentEmail);
    expect(studentPending).toBeDefined();
    expect(studentPending?.parentAccount?.parentUsername).toBeDefined();

    // Approve Student
    const approvalRes = await SubscriptionService.approveSubscription(
      studentPending!.id,
      "admin-approver-01"
    );
    expect(approvalRes.success).toBe(true);
    expect(approvalRes.status).toBe("ACTIVE");

    // Verify student is now ACTIVE
    const updatedStudent = await SubscriptionService.getUser(testStudentEmail);
    expect(updatedStudent?.subscriptionStatus).toBe("ACTIVE");
  });

  it("4. Password verification and database login succeeds for registered users", async () => {
    const authResult = await SubscriptionService.authenticateWithDb(
      testStudentEmail,
      "StudentPassword123"
    );

    expect(authResult).not.toBeNull();
    expect(authResult?.user.email).toBe(testStudentEmail);
    expect(authResult?.user.role).toBe("STUDENT");
    expect(authResult?.user.subscriptionStatus).toBe("ACTIVE");
    expect(authResult?.token).toMatch(/^sat_/);
  });

  it("5. Parent Analytics retrieves student exam performance and weak areas", async () => {
    const student = await SubscriptionService.getUser(testStudentEmail);

    const analytics = await SubscriptionService.getStudentAnalytics(student!.id);
    expect(analytics.student.email).toBe(testStudentEmail);
    expect(analytics.summary).toBeDefined();
    expect(Array.isArray(analytics.weakAreas)).toBe(true);
    expect(Array.isArray(analytics.recentAttempts)).toBe(true);
  });
});
