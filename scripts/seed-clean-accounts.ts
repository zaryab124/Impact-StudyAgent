import { PrismaClient } from "@prisma/client";
import { SubscriptionService } from "../server/subscription/subscription-service";

const prisma = new PrismaClient();

async function main() {
  console.log("Provisioning official authentic accounts in PostgreSQL...");

  // 1. Official Administrator
  const adminEmail = "admin@studyagent.edu.pk";
  const adminPass = "Admin@StudyAgent2025";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: SubscriptionService.hashPassword(adminPass),
      role: "ADMIN",
      subscriptionStatus: "ACTIVE",
      isActive: true,
      name: "Chief Academic Administrator",
    },
    create: {
      email: adminEmail,
      name: "Chief Academic Administrator",
      passwordHash: SubscriptionService.hashPassword(adminPass),
      role: "ADMIN",
      subscriptionStatus: "ACTIVE",
      isActive: true,
    },
  });
  console.log("Admin provisioned:", admin.email);

  // 2. Official Student
  const studentEmail = "student@studyagent.edu.pk";
  const studentPass = "Student@StudyAgent2025";
  const student = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {
      passwordHash: SubscriptionService.hashPassword(studentPass),
      role: "STUDENT",
      subscriptionStatus: "ACTIVE",
      isActive: true,
      name: "Muhammad Student (Matric & Inter)",
    },
    create: {
      email: studentEmail,
      name: "Muhammad Student (Matric & Inter)",
      passwordHash: SubscriptionService.hashPassword(studentPass),
      role: "STUDENT",
      subscriptionStatus: "ACTIVE",
      isActive: true,
    },
  });
  console.log("Student provisioned:", student.email);

  // 3. Official Parent
  const parentEmail = "parent@studyagent.edu.pk";
  const parentPass = "Parent@StudyAgent2025";
  const parentUsername = "parent_student";
  const parent = await prisma.user.upsert({
    where: { email: parentEmail },
    update: {
      passwordHash: SubscriptionService.hashPassword(parentPass),
      role: "PARENT",
      subscriptionStatus: "ACTIVE",
      isActive: true,
      name: "Muhammad Guardian",
    },
    create: {
      email: parentEmail,
      name: "Muhammad Guardian",
      passwordHash: SubscriptionService.hashPassword(parentPass),
      role: "PARENT",
      subscriptionStatus: "ACTIVE",
      isActive: true,
    },
  });

  // Link Parent to Student
  await prisma.parentStudentLink.deleteMany({
    where: { parentId: parent.id },
  });
  const link = await prisma.parentStudentLink.create({
    data: {
      parentId: parent.id,
      studentId: student.id,
      parentUsername: parentUsername,
      parentPassword: parentPass,
      relationship: "FATHER",
    },
  });
  console.log("Parent provisioned:", parent.email, "Username:", link.parentUsername);

  // 4. Official Organization
  const orgEmail = "organization@studyagent.edu.pk";
  const orgPass = "Org@StudyAgent2025";
  const orgCode = "PECTS_2025";

  let org = await prisma.organization.findUnique({
    where: { code: orgCode },
  });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "Punjab Educational College & Testing System",
        code: orgCode,
        contactPerson: "Prof. Farooq Ahmad",
        contactEmail: orgEmail,
        contactPhone: "0300-1234567",
        address: "Lahore Education Complex, Canal Road, Lahore",
        subscriptionStatus: "ACTIVE",
        plan: "YEARLY",
      },
    });
  }

  const orgUser = await prisma.user.upsert({
    where: { email: orgEmail },
    update: {
      passwordHash: SubscriptionService.hashPassword(orgPass),
      role: "ORGANIZATION",
      organizationId: org.id,
      subscriptionStatus: "ACTIVE",
      isActive: true,
      name: "Prof. Farooq Ahmad (Institutional Principal)",
    },
    create: {
      email: orgEmail,
      name: "Prof. Farooq Ahmad (Institutional Principal)",
      passwordHash: SubscriptionService.hashPassword(orgPass),
      role: "ORGANIZATION",
      organizationId: org.id,
      subscriptionStatus: "ACTIVE",
      isActive: true,
    },
  });
  console.log("Organization provisioned:", orgUser.email, "Org:", org.name);

  console.log("ALL ACCOUNTS SUCCESSFULLY PROVISIONED IN POSTGRESQL!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
