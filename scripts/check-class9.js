const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const class9 = await prisma.class.findMany({
    where: { numericLevel: 9 },
    include: {
      subjects: {
        include: {
          books: {
            include: { board: true }
          }
        }
      },
      academicYear: {
        include: { board: true }
      }
    }
  });

  console.log("CLASS 9 RECORDS:", class9.length);
  for (const c of class9) {
    console.log(`Class ID: ${c.id} | Name: ${c.name} | Board: ${c.academicYear?.board?.code} (${c.academicYear?.board?.name})`);
    for (const s of c.subjects) {
      console.log(`  Subject ID: ${s.id} | Name: ${s.name} (${s.code})`);
      for (const b of s.books) {
        console.log(`    -> Book ID: ${b.id} | Title: ${b.title} | Board: ${b.board?.code}`);
      }
      if (s.books.length === 0) {
        console.log(`    -> NO BOOKS!`);
      }
    }
  }

  // Also query Book table directly for classId matching 9
  const books9 = await prisma.book.findMany({
    where: {
      OR: [
        { class: { numericLevel: 9 } },
        { classId: { contains: "9" } },
        { title: { contains: "9" } }
      ]
    },
    include: { class: true, subject: true, board: true }
  });
  console.log("\nDIRECT BOOKS MATCHING 9:", books9.length);
  for (const b of books9) {
    console.log(`Book: [${b.id}] "${b.title}" | Class: ${b.class?.name} (${b.classId}) | Subj: ${b.subject?.name} (${b.subjectId}) | Board: ${b.board?.code}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
