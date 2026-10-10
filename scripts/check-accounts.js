const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, subscriptionStatus: true },
    take: 20
  });
  console.log('USERS:', JSON.stringify(users, null, 2));

  const parentLinks = await prisma.parentStudentLink.findMany({
    select: { parentUsername: true, parentPassword: true, parentId: true, studentId: true },
    take: 10
  });
  console.log('PARENT_LINKS:', JSON.stringify(parentLinks, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
