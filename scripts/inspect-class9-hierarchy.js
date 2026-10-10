const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.class.findMany({
    where: { numericLevel: 9 },
    include: {
      academicYear: {
        include: { board: true }
      },
      subjects: true
    }
  });

  console.log("Total Class 9 instances:", classes.length);
  for (const c of classes) {
    console.log(`\nClass: ${c.name} [${c.id}] | Board: ${c.academicYear?.board?.code} - ${c.academicYear?.board?.name}`);
    for (const s of c.subjects) {
      console.log(`  - Subject: [${s.id}] ${s.name} (${s.code})`);
    }
  }

  // Also check all boards
  const boards = await prisma.board.findMany();
  console.log("\nALL BOARDS IN DB:", boards.map(b => `${b.code} (${b.name})`).join(", "));
}

main().catch(console.error).finally(() => prisma.$disconnect());
