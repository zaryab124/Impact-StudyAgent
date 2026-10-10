import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function withRetry<T>(fn: () => Promise<T>, retries = 5): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      if (i === retries - 1) throw err;
      console.log(`Connection attempt ${i + 1} failed, retrying in 2s...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("Retry exhausted");
}

async function main() {
  const books = await withRetry(() =>
    prisma.book.findMany({
      where: {
        OR: [
          { class: { numericLevel: 9 } },
          { classId: "3c54d8e3-745e-4d50-bdba-131047d069dc" },
          { title: { contains: "Class 9" } },
          { title: { contains: "9th" } },
          { title: { contains: "09" } },
        ],
      },
      include: {
        class: true,
        subject: true,
        board: true,
        _count: { select: { chapters: true, documents: true } },
      },
    })
  );

  console.log(`FOUND ${books.length} BOOKS FOR CLASS 9:`);
  for (const b of books) {
    console.log(`- ID: ${b.id}`);
    console.log(`  Title: ${b.title}`);
    console.log(`  Board: ${b.board?.code} (${b.board?.name})`);
    console.log(`  Subject: ${b.subject?.name} (${b.subject?.code})`);
    console.log(`  Class: ${b.class?.name} (ID: ${b.classId})`);
    console.log(`  Chapters: ${b._count.chapters} | Docs: ${b._count.documents}`);
    console.log("--------------------------------------------------");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
