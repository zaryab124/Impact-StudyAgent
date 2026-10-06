import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Phase 2 Educational Hierarchy (Example / Demo Data Only)...");

  // 1. Seed Users (Admin & Examiner)
  await prisma.user.upsert({
    where: { email: "admin@example.edu" },
    update: {},
    create: {
      email: "admin@example.edu",
      name: "Example Administrator",
      role: UserRole.ADMIN,
      passwordHash: "demo_secure_scrypt_hash",
    },
  });

  await prisma.user.upsert({
    where: { email: "examiner@example.edu" },
    update: {},
    create: {
      email: "examiner@example.edu",
      name: "Example Examiner",
      role: UserRole.EXAMINER,
      passwordHash: "demo_secure_scrypt_hash",
    },
  });

  // 2. Seed Example Board (Clearly marked as demo data)
  const exampleBoard = await prisma.board.upsert({
    where: { code: "DEMO_BOARD" },
    update: {},
    create: {
      code: "DEMO_BOARD",
      name: "Example Educational Board",
      country: "Pakistan",
      region: "Demo Region",
      status: "ACTIVE",
    },
  });

  // 3. Seed Multiple Academic Years (Demonstrating multi-year version retention)
  const year2024 = await prisma.academicYear.upsert({
    where: {
      boardId_code: {
        boardId: exampleBoard.id,
        code: "2024-2025",
      },
    },
    update: {},
    create: {
      boardId: exampleBoard.id,
      name: "Example Academic Session 2024-2025",
      code: "2024-2025",
      startDate: new Date("2024-04-01"),
      endDate: new Date("2025-03-31"),
      status: "ACTIVE",
    },
  });

  const year2025 = await prisma.academicYear.upsert({
    where: {
      boardId_code: {
        boardId: exampleBoard.id,
        code: "2025-2026",
      },
    },
    update: {},
    create: {
      boardId: exampleBoard.id,
      name: "Example Academic Session 2025-2026",
      code: "2025-2026",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-31"),
      status: "ACTIVE",
    },
  });

  // 4. Seed Example Class
  const exampleClass9 = await prisma.class.upsert({
    where: {
      academicYearId_numericLevel: {
        academicYearId: year2024.id,
        numericLevel: 9,
      },
    },
    update: {},
    create: {
      academicYearId: year2024.id,
      name: "Example Class 9 (SSC Part 1)",
      numericLevel: 9,
      status: "ACTIVE",
    },
  });

  // 5. Seed Example Subject
  const exampleSubject = await prisma.subject.upsert({
    where: {
      classId_code: {
        classId: exampleClass9.id,
        code: "DEMO-SCI-09",
      },
    },
    update: {},
    create: {
      classId: exampleClass9.id,
      code: "DEMO-SCI-09",
      name: "Example General Science",
      status: "ACTIVE",
    },
  });

  // 6. Seed Books with Versioning (v2024.1 for 2024 and v2025.1 for 2025)
  // Ensures newer versions do NOT overwrite older versions
  const book2024 = await prisma.book.upsert({
    where: {
      subjectId_version: {
        subjectId: exampleSubject.id,
        version: "2024.1",
      },
    },
    update: {},
    create: {
      title: "Example Science Fundamentals (2024 Edition)",
      edition: "2024 First Printing",
      publisher: "Example Educational Publishing",
      author: "Demo Curriculum Author",
      isbn: "978-0-000-00001-0",
      boardId: exampleBoard.id,
      academicYearId: year2024.id,
      classId: exampleClass9.id,
      subjectId: exampleSubject.id,
      version: "2024.1",
      status: "ACTIVE",
    },
  });

  const book2025 = await prisma.book.upsert({
    where: {
      subjectId_version: {
        subjectId: exampleSubject.id,
        version: "2025.1",
      },
    },
    update: {},
    create: {
      title: "Example Science Fundamentals (2025 Revised Edition)",
      edition: "2025 Second Printing",
      publisher: "Example Educational Publishing",
      author: "Demo Curriculum Author",
      isbn: "978-0-000-00002-7",
      boardId: exampleBoard.id,
      academicYearId: year2025.id,
      classId: exampleClass9.id,
      subjectId: exampleSubject.id,
      version: "2025.1",
      status: "ACTIVE",
    },
  });

  // 7. Seed Example Chapters & Topics for 2024 Book
  const ch1 = await prisma.chapter.upsert({
    where: {
      bookId_chapterNumber: {
        bookId: book2024.id,
        chapterNumber: 1,
      },
    },
    update: {},
    create: {
      bookId: book2024.id,
      chapterNumber: 1,
      title: "Example Chapter 1: Introduction to Scientific Method",
      description: "Fundamental overview of observation, measurement, and hypothesis testing.",
      orderIndex: 1,
      status: "ACTIVE",
    },
  });

  const ch2 = await prisma.chapter.upsert({
    where: {
      bookId_chapterNumber: {
        bookId: book2024.id,
        chapterNumber: 2,
      },
    },
    update: {},
    create: {
      bookId: book2024.id,
      chapterNumber: 2,
      title: "Example Chapter 2: Matter and Its Transformations",
      description: "Basic states of matter, physical changes, and conservation of mass.",
      orderIndex: 2,
      status: "ACTIVE",
    },
  });

  const topic1 = await prisma.topic.upsert({
    where: {
      chapterId_orderIndex: {
        chapterId: ch1.id,
        orderIndex: 1,
      },
    },
    update: {},
    create: {
      chapterId: ch1.id,
      title: "Example Topic 1.1: Observing Natural Phenomena",
      description: "Techniques for qualitative and quantitative observation in demo science.",
      orderIndex: 1,
      topicCode: "1.1",
      learningOutcomes: "Define observation and describe standard measurement instruments.",
      status: "ACTIVE",
    },
  });

  const topic2 = await prisma.topic.upsert({
    where: {
      chapterId_orderIndex: {
        chapterId: ch1.id,
        orderIndex: 2,
      },
    },
    update: {},
    create: {
      chapterId: ch1.id,
      title: "Example Topic 1.2: Formulating Hypotheses",
      description: "Formulating testable scientific predictions.",
      orderIndex: 2,
      topicCode: "1.2",
      learningOutcomes: "State the criteria for a falsifiable hypothesis.",
      status: "ACTIVE",
    },
  });

  // 8. Seed Example Multi-Version Syllabus (Included/Excluded items & weights)
  const syllabus2024 = await prisma.syllabus.upsert({
    where: {
      subjectId_academicYearId_version: {
        subjectId: exampleSubject.id,
        academicYearId: year2024.id,
        version: "2024-v1",
      },
    },
    update: {},
    create: {
      title: "Example Grade 9 Science Syllabus (Session 2024)",
      version: "2024-v1",
      description: "Official demo syllabus specifying included/excluded chapters and weights.",
      boardId: exampleBoard.id,
      academicYearId: year2024.id,
      classId: exampleClass9.id,
      subjectId: exampleSubject.id,
      status: "PUBLISHED",
      effectiveDate: new Date("2024-04-01"),
    },
  });

  // Link syllabus chapter & topic items with weights
  await prisma.syllabusChapterItem.upsert({
    where: {
      syllabusId_chapterId: {
        syllabusId: syllabus2024.id,
        chapterId: ch1.id,
      },
    },
    update: {},
    create: {
      syllabusId: syllabus2024.id,
      chapterId: ch1.id,
      isIncluded: true,
      weightage: 60.0, // 60% exam weight
      examinationRelevance: "HIGH",
      notes: "Core compulsory chapter for midterm and annual examination.",
    },
  });

  await prisma.syllabusChapterItem.upsert({
    where: {
      syllabusId_chapterId: {
        syllabusId: syllabus2024.id,
        chapterId: ch2.id,
      },
    },
    update: {},
    create: {
      syllabusId: syllabus2024.id,
      chapterId: ch2.id,
      isIncluded: true,
      weightage: 40.0, // 40% exam weight
      examinationRelevance: "MEDIUM",
      notes: "Secondary unit covered in section B.",
    },
  });

  await prisma.syllabusTopicItem.upsert({
    where: {
      syllabusId_topicId: {
        syllabusId: syllabus2024.id,
        topicId: topic1.id,
      },
    },
    update: {},
    create: {
      syllabusId: syllabus2024.id,
      topicId: topic1.id,
      isIncluded: true,
      weightage: 30.0,
      examinationRelevance: "HIGH",
      notes: "High frequency in objective Section A.",
    },
  });

  console.log("✅ Seed completed successfully with clearly marked demo data!");
  console.log(`- Board: ${exampleBoard.name} (${exampleBoard.code})`);
  console.log(`- Years: ${year2024.code}, ${year2025.code}`);
  console.log(`- Books: ${book2024.version} & ${book2025.version} (Older version preserved intact)`);
  console.log(`- Syllabus: ${syllabus2024.title} (${syllabus2024.version})`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
