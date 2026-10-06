import { prisma } from "@/lib/db";
import {
  CreateBoardInput,
  CreateAcademicYearInput,
  CreateClassInput,
  CreateSubjectInput,
  CreateBookInput,
  CreateChapterInput,
  CreateTopicInput,
} from "@/lib/validations/education";
import { CreateSyllabusInput } from "@/lib/validations/syllabus";
import { PUNJAB_BOARDS_REGISTRY } from "./punjab/punjab-boards-config";
import { PCTB_OFFICIAL_CATALOG } from "./punjab/pctb-service";

const DEFAULT_CHAPTERS = [
  { id: "chap-01", bookId: "book-physics-09", chapterNumber: 1, title: "Physical Quantities and Measurement", orderIndex: 1, status: "ACTIVE", topics: [] },
  { id: "chap-02", bookId: "book-physics-09", chapterNumber: 2, title: "Kinematics", orderIndex: 2, status: "ACTIVE", topics: [] },
  { id: "chap-03", bookId: "book-physics-09", chapterNumber: 3, title: "Dynamics", orderIndex: 3, status: "ACTIVE", topics: [] },
  { id: "chap-04", bookId: "book-physics-09", chapterNumber: 4, title: "Turning Effect of Forces", orderIndex: 4, status: "ACTIVE", topics: [] },
  { id: "chap-05", bookId: "book-physics-09", chapterNumber: 5, title: "Gravitation", orderIndex: 5, status: "ACTIVE", topics: [] },
  { id: "chap-06", bookId: "book-physics-09", chapterNumber: 6, title: "Work and Energy", orderIndex: 6, status: "ACTIVE", topics: [] },
  { id: "chap-07", bookId: "book-physics-09", chapterNumber: 7, title: "Properties of Matter", orderIndex: 7, status: "ACTIVE", topics: [] },
  { id: "chap-08", bookId: "book-physics-09", chapterNumber: 8, title: "Thermal Properties of Matter", orderIndex: 8, status: "ACTIVE", topics: [] },
  { id: "chap-09", bookId: "book-physics-09", chapterNumber: 9, title: "Transfer of Heat", orderIndex: 9, status: "ACTIVE", topics: [] },
  // PCTB Physics Chapters
  ...PCTB_OFFICIAL_CATALOG[0].chapters.map((ch) => ({
    id: `chap-pctb-phy-${ch.chapterNumber}`,
    bookId: "pctb-phy-09",
    chapterNumber: ch.chapterNumber,
    title: ch.title,
    orderIndex: ch.orderIndex,
    status: "ACTIVE",
    topics: ch.topics.map((t) => ({
      id: `top-pctb-phy-${ch.chapterNumber}-${t.orderIndex}`,
      title: t.title,
      topicCode: t.topicCode,
      orderIndex: t.orderIndex,
      status: "ACTIVE",
    })),
  })),
];

const DEFAULT_BOARDS = [
  {
    id: "board-fed-01",
    code: "FBISE",
    name: "Federal Board of Intermediate and Secondary Education",
    country: "Pakistan",
    region: "Islamabad",
    status: "ACTIVE",
    _count: { academicYears: 1, books: 4 },
  },
  ...PUNJAB_BOARDS_REGISTRY.map((b) => ({
    id: b.id,
    code: b.code,
    name: b.name,
    country: b.country,
    region: b.region,
    status: b.status,
    _count: { academicYears: 1, books: 4 },
  })),
];

const DEFAULT_ACADEMIC_YEARS = [
  {
    id: "year-current",
    boardId: "board-fed-01",
    code: "2024-2025",
    name: "Session 2024-2025",
    status: "ACTIVE",
    board: { id: "board-fed-01", name: "Federal Board of Intermediate and Secondary Education", code: "FBISE" },
    _count: { classes: 1, books: 4 },
  },
];

const DEFAULT_CLASSES = [
  {
    id: "class-9",
    academicYearId: "year-current",
    name: "Class 9 (SSC Part-I)",
    numericLevel: 9,
    status: "ACTIVE",
    academicYear: { id: "year-current", name: "Session 2024-2025", code: "2024-2025", boardId: "board-fed-01" },
    _count: { subjects: 4, books: 4 },
  },
];

const DEFAULT_SUBJECTS = [
  {
    id: "subj-physics",
    classId: "class-9",
    name: "Physics",
    code: "PHY-09",
    status: "ACTIVE",
    class: { id: "class-9", name: "Class 9 (SSC Part-I)", numericLevel: 9 },
    _count: { books: 1, samplePapers: 1 },
  },
  {
    id: "subj-chemistry",
    classId: "class-9",
    name: "Chemistry",
    code: "CHM-09",
    status: "ACTIVE",
    class: { id: "class-9", name: "Class 9 (SSC Part-I)", numericLevel: 9 },
    _count: { books: 1, samplePapers: 1 },
  },
  {
    id: "subj-biology",
    classId: "class-9",
    name: "Biology",
    code: "BIO-09",
    status: "ACTIVE",
    class: { id: "class-9", name: "Class 9 (SSC Part-I)", numericLevel: 9 },
    _count: { books: 1, samplePapers: 1 },
  },
  {
    id: "subj-math",
    classId: "class-9",
    name: "Mathematics",
    code: "MTH-09",
    status: "ACTIVE",
    class: { id: "class-9", name: "Class 9 (SSC Part-I)", numericLevel: 9 },
    _count: { books: 1, samplePapers: 1 },
  },
];

const DEFAULT_BOOKS = [
  {
    id: "book-physics-09",
    title: "Physics Class 9 (National Book Foundation)",
    edition: "2024 Edition",
    publisher: "National Book Foundation",
    author: "Federal Curriculum Committee",
    boardId: "board-fed-01",
    academicYearId: "year-current",
    classId: "class-9",
    subjectId: "subj-physics",
    version: "2024.1",
    status: "ACTIVE",
    subject: { id: "subj-physics", name: "Physics", code: "PHY-09" },
    class: { id: "class-9", name: "Class 9 (SSC Part-I)", numericLevel: 9 },
    board: { id: "board-fed-01", name: "Federal Board", code: "FBISE" },
    academicYear: { id: "year-current", name: "Session 2024-2025", code: "2024-2025" },
    _count: { chapters: 9 },
  },
  {
    id: "book-chem-09",
    title: "Chemistry Class 9 (National Book Foundation)",
    edition: "2024 Edition",
    publisher: "National Book Foundation",
    author: "Federal Curriculum Committee",
    boardId: "board-fed-01",
    academicYearId: "year-current",
    classId: "class-9",
    subjectId: "subj-chemistry",
    version: "2024.1",
    status: "ACTIVE",
    subject: { id: "subj-chemistry", name: "Chemistry", code: "CHM-09" },
    class: { id: "class-9", name: "Class 9 (SSC Part-I)", numericLevel: 9 },
    board: { id: "board-fed-01", name: "Federal Board", code: "FBISE" },
    academicYear: { id: "year-current", name: "Session 2024-2025", code: "2024-2025" },
    _count: { chapters: 8 },
  },
  // PCTB Official Textbooks
  ...PCTB_OFFICIAL_CATALOG.map((pctb) => ({
    id: pctb.id,
    title: pctb.title,
    edition: pctb.edition,
    publisher: pctb.publisher,
    author: "Punjab Curriculum and Textbook Board",
    boardId: "board-punjab-lhr",
    academicYearId: "year-current",
    classId: "class-9",
    subjectId: `subj-${pctb.subjectName.toLowerCase()}`,
    version: "2024.1",
    status: "ACTIVE",
    subject: { id: `subj-${pctb.subjectName.toLowerCase()}`, name: pctb.subjectName, code: pctb.subjectCode },
    class: { id: "class-9", name: "Class 9 (SSC Part-I)", numericLevel: 9 },
    board: { id: "board-punjab-lhr", name: "BISE Lahore", code: "BISE_LHR" },
    academicYear: { id: "year-current", name: "Session 2024-2025", code: "2024-2025" },
    _count: { chapters: pctb.chaptersCount },
  })),
];

export class EducationService {
  // ----------------------------------------------------------------------------
  // BOARDS
  // ----------------------------------------------------------------------------
  public static async createBoard(input: CreateBoardInput) {
    const existing = await prisma.board.findUnique({
      where: { code: input.code },
    });
    if (existing) {
      throw new Error(`A board with code "${input.code}" already exists.`);
    }

    return prisma.board.create({
      data: {
        code: input.code,
        name: input.name,
        country: input.country || "Pakistan",
        region: input.region,
        status: input.status || "ACTIVE",
      },
    });
  }

  public static async getBoards() {
    try {
      const res = await prisma.board.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { academicYears: true, books: true },
          },
        },
      });
      if (res && res.length > 0) return res;
      return DEFAULT_BOARDS as any;
    } catch {
      return DEFAULT_BOARDS as any;
    }
  }

  // ----------------------------------------------------------------------------
  // ACADEMIC YEARS
  // ----------------------------------------------------------------------------
  public static async createAcademicYear(input: CreateAcademicYearInput) {
    const board = await prisma.board.findUnique({
      where: { id: input.boardId },
    });
    if (!board) {
      throw new Error(`Referenced board with ID "${input.boardId}" not found.`);
    }

    const existing = await prisma.academicYear.findUnique({
      where: {
        boardId_code: {
          boardId: input.boardId,
          code: input.code,
        },
      },
    });
    if (existing) {
      throw new Error(
        `Academic year with code "${input.code}" already exists for board "${board.name}".`
      );
    }

    return prisma.academicYear.create({
      data: {
        boardId: input.boardId,
        name: input.name,
        code: input.code,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        status: input.status || "ACTIVE",
      },
    });
  }

  public static async getAcademicYears(boardId?: string) {
    try {
      const res = await prisma.academicYear.findMany({
        where: boardId ? { boardId } : undefined,
        orderBy: { code: "desc" },
        include: {
          board: { select: { id: true, name: true, code: true } },
          _count: { select: { classes: true, books: true } },
        },
      });
      if (res && res.length > 0) return res;
      return DEFAULT_ACADEMIC_YEARS as any;
    } catch {
      return DEFAULT_ACADEMIC_YEARS as any;
    }
  }

  // ----------------------------------------------------------------------------
  // CLASSES
  // ----------------------------------------------------------------------------
  public static async createClass(input: CreateClassInput) {
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: input.academicYearId },
    });
    if (!academicYear) {
      throw new Error(
        `Referenced academic year with ID "${input.academicYearId}" not found.`
      );
    }

    const existing = await prisma.class.findUnique({
      where: {
        academicYearId_numericLevel: {
          academicYearId: input.academicYearId,
          numericLevel: input.numericLevel,
        },
      },
    });
    if (existing) {
      throw new Error(
        `Class with numeric level ${input.numericLevel} already exists in this academic year.`
      );
    }

    return prisma.class.create({
      data: {
        academicYearId: input.academicYearId,
        name: input.name,
        numericLevel: input.numericLevel,
        status: input.status || "ACTIVE",
      },
    });
  }

  public static async getClasses(academicYearId?: string) {
    try {
      const res = await prisma.class.findMany({
        where: academicYearId ? { academicYearId } : undefined,
        orderBy: { numericLevel: "asc" },
        include: {
          academicYear: {
            select: { id: true, name: true, code: true, boardId: true },
          },
          _count: { select: { subjects: true, books: true } },
        },
      });
      if (res && res.length > 0) return res;
      return DEFAULT_CLASSES as any;
    } catch {
      return DEFAULT_CLASSES as any;
    }
  }

  // ----------------------------------------------------------------------------
  // SUBJECTS
  // ----------------------------------------------------------------------------
  public static async createSubject(input: CreateSubjectInput) {
    const classEntity = await prisma.class.findUnique({
      where: { id: input.classId },
    });
    if (!classEntity) {
      throw new Error(`Referenced class with ID "${input.classId}" not found.`);
    }

    const existing = await prisma.subject.findUnique({
      where: {
        classId_code: {
          classId: input.classId,
          code: input.code,
        },
      },
    });
    if (existing) {
      throw new Error(
        `Subject with code "${input.code}" already exists in class "${classEntity.name}".`
      );
    }

    return prisma.subject.create({
      data: {
        classId: input.classId,
        name: input.name,
        code: input.code,
        status: input.status || "ACTIVE",
      },
    });
  }

  public static async getSubjects(classId?: string) {
    try {
      const res = await prisma.subject.findMany({
        where: classId ? { classId } : undefined,
        orderBy: { name: "asc" },
        include: {
          class: { select: { id: true, name: true, numericLevel: true } },
          _count: { select: { books: true, samplePapers: true } },
        },
      });
      if (res && res.length > 0) return res;
      return DEFAULT_SUBJECTS as any;
    } catch {
      return DEFAULT_SUBJECTS as any;
    }
  }

  // ----------------------------------------------------------------------------
  // BOOKS & VERSIONING
  // ----------------------------------------------------------------------------
  public static async createBook(input: CreateBookInput) {
    // 1. Referential integrity: check subject exists and relates to class
    const subject = await prisma.subject.findUnique({
      where: { id: input.subjectId },
      include: { class: true },
    });
    if (!subject) {
      throw new Error(`Referenced subject with ID "${input.subjectId}" not found.`);
    }

    if (subject.classId !== input.classId) {
      throw new Error(
        `Referential mismatch: Subject "${subject.name}" does not belong to Class ID "${input.classId}".`
      );
    }

    // 2. Versioning check: ensure this exact version doesn't already exist
    const existingVersion = await prisma.book.findUnique({
      where: {
        subjectId_version: {
          subjectId: input.subjectId,
          version: input.version,
        },
      },
    });
    if (existingVersion) {
      throw new Error(
        `Book version "${input.version}" for subject "${subject.name}" already exists. A newer version cannot overwrite an existing version.`
      );
    }

    return prisma.book.create({
      data: {
        title: input.title,
        edition: input.edition,
        publisher: input.publisher,
        author: input.author,
        isbn: input.isbn,
        boardId: input.boardId,
        academicYearId: input.academicYearId,
        classId: input.classId,
        subjectId: input.subjectId,
        version: input.version,
        status: input.status || "ACTIVE",
      },
    });
  }

  public static async getBooks(subjectId?: string) {
    try {
      const res = await prisma.book.findMany({
        where: subjectId ? { subjectId } : undefined,
        orderBy: [{ title: "asc" }, { version: "desc" }],
        include: {
          subject: { select: { id: true, name: true, code: true } },
          class: { select: { id: true, name: true, numericLevel: true } },
          board: { select: { id: true, name: true, code: true } },
          academicYear: { select: { id: true, name: true, code: true } },
          _count: { select: { chapters: true } },
        },
      });
      if (res && res.length > 0) return res;
      return (subjectId ? DEFAULT_BOOKS.filter((b) => b.subjectId === subjectId) : DEFAULT_BOOKS) as any;
    } catch {
      return (subjectId ? DEFAULT_BOOKS.filter((b) => b.subjectId === subjectId) : DEFAULT_BOOKS) as any;
    }
  }

  public static async getBookById(id: string) {
    try {
      const book = await prisma.book.findUnique({
        where: { id },
        include: {
          subject: true,
          class: true,
          board: true,
          academicYear: true,
          chapters: {
            orderBy: { orderIndex: "asc" },
            include: {
              topics: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
        },
      });
      if (book) return book;
      const fb = DEFAULT_BOOKS.find((b) => b.id === id) || DEFAULT_BOOKS[0];
      return { ...fb, chapters: DEFAULT_CHAPTERS } as any;
    } catch {
      const fb = DEFAULT_BOOKS.find((b) => b.id === id) || DEFAULT_BOOKS[0];
      return { ...fb, chapters: DEFAULT_CHAPTERS } as any;
    }
  }

  public static async getBookChapters(bookId: string) {
    try {
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        include: {
          chapters: {
            orderBy: { orderIndex: "asc" },
            include: {
              topics: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
        },
      });
      if (book) return book.chapters;
      return DEFAULT_CHAPTERS as any;
    } catch {
      return DEFAULT_CHAPTERS as any;
    }
  }

  // ----------------------------------------------------------------------------
  // CHAPTERS & TOPICS
  // ----------------------------------------------------------------------------
  public static async createChapter(input: CreateChapterInput) {
    const book = await prisma.book.findUnique({
      where: { id: input.bookId },
    });
    if (!book) {
      throw new Error(`Referenced book with ID "${input.bookId}" not found.`);
    }

    // Check duplicate chapterNumber
    const existingNum = await prisma.chapter.findUnique({
      where: {
        bookId_chapterNumber: {
          bookId: input.bookId,
          chapterNumber: input.chapterNumber,
        },
      },
    });
    if (existingNum) {
      throw new Error(
        `Chapter number ${input.chapterNumber} already exists in book "${book.title}".`
      );
    }

    // Check duplicate orderIndex
    const existingOrder = await prisma.chapter.findUnique({
      where: {
        bookId_orderIndex: {
          bookId: input.bookId,
          orderIndex: input.orderIndex,
        },
      },
    });
    if (existingOrder) {
      throw new Error(
        `Chapter with order index ${input.orderIndex} already exists in book "${book.title}".`
      );
    }

    return prisma.chapter.create({
      data: {
        bookId: input.bookId,
        chapterNumber: input.chapterNumber,
        title: input.title,
        description: input.description,
        orderIndex: input.orderIndex,
        status: input.status || "ACTIVE",
      },
    });
  }

  public static async createTopic(input: CreateTopicInput) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: input.chapterId },
      include: { book: true },
    });
    if (!chapter) {
      throw new Error(`Referenced chapter with ID "${input.chapterId}" not found.`);
    }

    // Check duplicate orderIndex inside same chapter
    const existingOrder = await prisma.topic.findUnique({
      where: {
        chapterId_orderIndex: {
          chapterId: input.chapterId,
          orderIndex: input.orderIndex,
        },
      },
    });
    if (existingOrder) {
      throw new Error(
        `Topic with order index ${input.orderIndex} already exists in chapter "${chapter.title}".`
      );
    }

    return prisma.topic.create({
      data: {
        chapterId: input.chapterId,
        title: input.title,
        description: input.description,
        orderIndex: input.orderIndex,
        topicCode: input.topicCode,
        learningOutcomes: input.learningOutcomes,
        status: input.status || "ACTIVE",
      },
    });
  }

  public static async getChapterTopics(chapterId: string) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        topics: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });
    if (!chapter) {
      throw new Error(`Chapter with ID "${chapterId}" not found.`);
    }
    return chapter.topics;
  }

  // ----------------------------------------------------------------------------
  // SYLLABUS & VERSIONING
  // ----------------------------------------------------------------------------
  public static async createSyllabus(input: CreateSyllabusInput) {
    // 1. Referential integrity: check subject belongs to class
    const subject = await prisma.subject.findUnique({
      where: { id: input.subjectId },
      include: { class: true },
    });
    if (!subject) {
      throw new Error(`Referenced subject with ID "${input.subjectId}" not found.`);
    }

    if (subject.classId !== input.classId) {
      throw new Error(
        `Referential mismatch: Subject "${subject.name}" does not belong to Class ID "${input.classId}".`
      );
    }

    // 2. Check academic year exists
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: input.academicYearId },
    });
    if (!academicYear) {
      throw new Error(
        `Referenced academic year with ID "${input.academicYearId}" not found.`
      );
    }

    // 3. Unique version constraint per subject & academic year
    const existing = await prisma.syllabus.findUnique({
      where: {
        subjectId_academicYearId_version: {
          subjectId: input.subjectId,
          academicYearId: input.academicYearId,
          version: input.version,
        },
      },
    });
    if (existing) {
      throw new Error(
        `Syllabus version "${input.version}" already exists for this subject and academic year.`
      );
    }

    // 4. Create syllabus with nested items
    return prisma.syllabus.create({
      data: {
        title: input.title,
        version: input.version,
        description: input.description,
        boardId: input.boardId,
        academicYearId: input.academicYearId,
        classId: input.classId,
        subjectId: input.subjectId,
        status: input.status || "DRAFT",
        effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : null,
        chapterItems: {
          create: input.chapterItems?.map((ci) => ({
            chapterId: ci.chapterId,
            isIncluded: ci.isIncluded ?? true,
            weightage: ci.weightage,
            examinationRelevance: ci.examinationRelevance || "HIGH",
            notes: ci.notes,
          })),
        },
        topicItems: {
          create: input.topicItems?.map((ti) => ({
            topicId: ti.topicId,
            isIncluded: ti.isIncluded ?? true,
            weightage: ti.weightage,
            examinationRelevance: ti.examinationRelevance || "HIGH",
            notes: ti.notes,
          })),
        },
      },
      include: {
        chapterItems: { include: { chapter: true } },
        topicItems: { include: { topic: true } },
      },
    });
  }

  public static async getSyllabi(
    subjectId?: string,
    academicYearId?: string,
    status?: any,
    boardId?: string,
    classId?: string
  ) {
    return prisma.syllabus.findMany({
      where: {
        ...(subjectId ? { subjectId } : {}),
        ...(academicYearId ? { academicYearId } : {}),
        ...(status ? { status } : {}),
        ...(boardId ? { boardId } : {}),
        ...(classId ? { classId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, numericLevel: true } },
        academicYear: { select: { id: true, name: true, code: true } },
        chapterItems: {
          include: {
            chapter: {
              select: { id: true, chapterNumber: true, title: true },
            },
          },
        },
        topicItems: {
          include: {
            topic: {
              select: { id: true, topicCode: true, title: true },
            },
          },
        },
      },
    });
  }

  // ----------------------------------------------------------------------------
  // COMPLETE HIERARCHY TREE
  // ----------------------------------------------------------------------------
  public static async getFullEducationHierarchy(boardId: string) {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        academicYears: {
          orderBy: { code: "desc" },
          include: {
            classes: {
              orderBy: { numericLevel: "asc" },
              include: {
                subjects: {
                  orderBy: { name: "asc" },
                  include: {
                    books: {
                      orderBy: [{ title: "asc" }, { version: "desc" }],
                      include: {
                        chapters: {
                          orderBy: { orderIndex: "asc" },
                          include: {
                            topics: {
                              orderBy: { orderIndex: "asc" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!board) {
      throw new Error(`Board with ID "${boardId}" not found.`);
    }
    return board;
  }
}
