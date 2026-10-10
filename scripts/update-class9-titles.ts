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
  console.log("Renaming and ensuring Class 9 titles in database...");

  const updates = [
    {
      id: "book-pctb-phy-09",
      title: "Class 9 Physics (Science - Bio & Computer Group) (Punjab Curriculum & Textbook Board)",
    },
    {
      id: "book-nbf-phy-09",
      title: "Class 9 Physics (Science - Bio & Computer Group) (National Book Foundation / Federal)",
    },
    {
      id: "book-pctb-chm-09",
      title: "Class 9 Chemistry (Science - Bio & Computer Group) (Punjab Curriculum & Textbook Board)",
    },
    {
      id: "book-nbf-chm-09",
      title: "Class 9 Chemistry (Science - Bio & Computer Group) (National Book Foundation / Federal)",
    },
    {
      id: "book-pctb-bio-09",
      title: "Class 9 Biology (Science - Bio Group) (Punjab Curriculum & Textbook Board)",
    },
    {
      id: "book-nbf-bio-09",
      title: "Class 9 Biology (Science - Bio Group) (National Book Foundation / Federal)",
    },
    {
      id: "book-pctb-cs-09",
      title: "Class 9 Computer Science (Science - Computer Group) (Punjab Curriculum & Textbook Board)",
    },
    {
      id: "book-nbf-cs-09",
      title: "Class 9 Computer Science (Science - Computer Group) (National Book Foundation / Federal)",
    },
    {
      id: "book-pctb-mth-09",
      title: "Class 9 Mathematics (Science Group) (Punjab Curriculum & Textbook Board)",
    },
    {
      id: "book-nbf-mth-09",
      title: "Class 9 Mathematics (Science Group) (National Book Foundation / Federal)",
    },
    {
      id: "book-pctb-eng-09",
      title: "Class 9 English Compulsory (Punjab Curriculum & Textbook Board)",
    },
    {
      id: "book-nbf-eng-09",
      title: "Class 9 English Compulsory (National Book Foundation / Federal)",
    },
    {
      id: "book-pctb-urd-09",
      title: "Class 9 Urdu Compulsory (Punjab Curriculum & Textbook Board)",
    },
    {
      id: "book-nbf-urd-09",
      title: "Class 9 Urdu Compulsory (National Book Foundation / Federal)",
    },
    {
      id: "book-pctb-isl-09",
      title: "Class 9 Islamic Studies / Islamiat Compulsory (Punjab Curriculum & Textbook Board)",
    },
    {
      id: "book-nbf-isl-09",
      title: "Class 9 Islamic Studies / Islamiat Compulsory (National Book Foundation / Federal)",
    },
  ];

  for (const u of updates) {
    const res = await withRetry(() =>
      prisma.book.updateMany({
        where: { id: u.id },
        data: { title: u.title },
      })
    );
    console.log(`Updated book ${u.id}: ${u.title} (${res.count} updated)`);
  }

  console.log("All 16 Class 9 books updated with explicit 'Class 9' in title!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
