import { describe, it, expect, vi, beforeEach } from "vitest";
import { EducationService } from "@/server/education-service";
import { prisma } from "@/lib/db";
import {
  CreateBoardSchema,
  CreateAcademicYearSchema,
  CreateClassSchema,
  CreateSubjectSchema,
  CreateBookSchema,
  CreateChapterSchema,
  CreateTopicSchema,
} from "@/lib/validations/education";
import { CreateSyllabusSchema } from "@/lib/validations/syllabus";

describe("Phase 2 Education Hierarchy & Database Foundation (12 Requirements)", () => {
  const mockBoardId = "11111111-1111-4111-a111-111111111111";
  const mockYearId = "22222222-2222-4222-a222-222222222222";
  const mockClassId = "33333333-3333-4333-a333-333333333333";
  const mockSubjectId = "44444444-4444-4444-a444-444444444444";
  const mockBookId = "55555555-5555-4555-a555-555555555555";
  const mockChapterId = "66666666-6666-4666-a666-666666666666";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. Creating a board
  // --------------------------------------------------------------------------
  it("1. should create a board with valid schema and attributes", async () => {
    const validBoardInput = {
      code: "TEST_BOARD",
      name: "Test Educational Board",
      country: "Pakistan",
      region: "Test Region",
      status: "ACTIVE" as const,
    };

    expect(CreateBoardSchema.safeParse(validBoardInput).success).toBe(true);

    vi.spyOn(prisma.board, "findUnique").mockResolvedValue(null);
    vi.spyOn(prisma.board, "create").mockResolvedValue({
      id: mockBoardId,
      ...validBoardInput,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const created = await EducationService.createBoard(validBoardInput);
    expect(created.id).toBe(mockBoardId);
    expect(created.code).toBe("TEST_BOARD");
  });

  // --------------------------------------------------------------------------
  // 2. Creating an academic year
  // --------------------------------------------------------------------------
  it("2. should create an academic year linked to a board", async () => {
    const validYearInput = {
      boardId: mockBoardId,
      name: "Session 2024-2025",
      code: "2024-2025",
      status: "ACTIVE" as const,
    };

    expect(CreateAcademicYearSchema.safeParse(validYearInput).success).toBe(true);

    vi.spyOn(prisma.board, "findUnique").mockResolvedValue({ id: mockBoardId, name: "Test Board" } as any);
    vi.spyOn(prisma.academicYear, "findUnique").mockResolvedValue(null);
    vi.spyOn(prisma.academicYear, "create").mockResolvedValue({
      id: mockYearId,
      ...validYearInput,
      startDate: null,
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const created = await EducationService.createAcademicYear(validYearInput);
    expect(created.id).toBe(mockYearId);
    expect(created.code).toBe("2024-2025");
  });

  // --------------------------------------------------------------------------
  // 3. Creating a class
  // --------------------------------------------------------------------------
  it("3. should create a class within an academic year", async () => {
    const validClassInput = {
      academicYearId: mockYearId,
      name: "Class 9",
      numericLevel: 9,
      status: "ACTIVE" as const,
    };

    expect(CreateClassSchema.safeParse(validClassInput).success).toBe(true);

    vi.spyOn(prisma.academicYear, "findUnique").mockResolvedValue({ id: mockYearId } as any);
    vi.spyOn(prisma.class, "findUnique").mockResolvedValue(null);
    vi.spyOn(prisma.class, "create").mockResolvedValue({
      id: mockClassId,
      ...validClassInput,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const created = await EducationService.createClass(validClassInput);
    expect(created.id).toBe(mockClassId);
    expect(created.numericLevel).toBe(9);
  });

  // --------------------------------------------------------------------------
  // 4. Creating a subject
  // --------------------------------------------------------------------------
  it("4. should create a subject within a class", async () => {
    const validSubjectInput = {
      classId: mockClassId,
      name: "General Science",
      code: "SCI-09",
      status: "ACTIVE" as const,
    };

    expect(CreateSubjectSchema.safeParse(validSubjectInput).success).toBe(true);

    vi.spyOn(prisma.class, "findUnique").mockResolvedValue({ id: mockClassId, name: "Class 9" } as any);
    vi.spyOn(prisma.subject, "findUnique").mockResolvedValue(null);
    vi.spyOn(prisma.subject, "create").mockResolvedValue({
      id: mockSubjectId,
      ...validSubjectInput,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const created = await EducationService.createSubject(validSubjectInput);
    expect(created.id).toBe(mockSubjectId);
    expect(created.code).toBe("SCI-09");
  });

  // --------------------------------------------------------------------------
  // 5. Creating a book
  // --------------------------------------------------------------------------
  it("5. should create a versioned book linked to class and subject", async () => {
    const validBookInput = {
      title: "Science Fundamentals",
      publisher: "Educational Publisher",
      classId: mockClassId,
      subjectId: mockSubjectId,
      version: "2024.1",
      status: "ACTIVE" as const,
    };

    expect(CreateBookSchema.safeParse(validBookInput).success).toBe(true);

    vi.spyOn(prisma.subject, "findUnique").mockResolvedValue({
      id: mockSubjectId,
      classId: mockClassId,
      name: "General Science",
    } as any);
    vi.spyOn(prisma.book, "findUnique").mockResolvedValue(null);
    vi.spyOn(prisma.book, "create").mockResolvedValue({
      id: mockBookId,
      ...validBookInput,
      edition: null,
      author: null,
      isbn: null,
      boardId: null,
      academicYearId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const created = await EducationService.createBook(validBookInput);
    expect(created.id).toBe(mockBookId);
    expect(created.version).toBe("2024.1");
  });

  // --------------------------------------------------------------------------
  // 6. Creating chapters
  // --------------------------------------------------------------------------
  it("6. should create chapters inside a book with number and order index", async () => {
    const validChapterInput = {
      bookId: mockBookId,
      chapterNumber: 1,
      title: "Introduction to Science",
      orderIndex: 1,
      status: "ACTIVE" as const,
    };

    expect(CreateChapterSchema.safeParse(validChapterInput).success).toBe(true);

    vi.spyOn(prisma.book, "findUnique").mockResolvedValue({ id: mockBookId, title: "Science Fundamentals" } as any);
    vi.spyOn(prisma.chapter, "findUnique").mockResolvedValue(null);
    vi.spyOn(prisma.chapter, "create").mockResolvedValue({
      id: mockChapterId,
      ...validChapterInput,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const created = await EducationService.createChapter(validChapterInput);
    expect(created.id).toBe(mockChapterId);
    expect(created.chapterNumber).toBe(1);
  });

  // --------------------------------------------------------------------------
  // 7. Creating topics
  // --------------------------------------------------------------------------
  it("7. should create topics inside a chapter with order and learning outcomes", async () => {
    const validTopicInput = {
      chapterId: mockChapterId,
      title: "Scientific Methods",
      orderIndex: 1,
      topicCode: "1.1",
      learningOutcomes: "Understand basic scientific inquiry",
      status: "ACTIVE" as const,
    };

    expect(CreateTopicSchema.safeParse(validTopicInput).success).toBe(true);

    vi.spyOn(prisma.chapter, "findUnique").mockResolvedValue({ id: mockChapterId, title: "Intro" } as any);
    vi.spyOn(prisma.topic, "findUnique").mockResolvedValue(null);
    vi.spyOn(prisma.topic, "create").mockResolvedValue({
      id: "77777777-7777-4777-a777-777777777777",
      ...validTopicInput,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const created = await EducationService.createTopic(validTopicInput);
    expect(created.title).toBe("Scientific Methods");
    expect(created.orderIndex).toBe(1);
  });

  // --------------------------------------------------------------------------
  // 8. Creating a syllabus version
  // --------------------------------------------------------------------------
  it("8. should create a syllabus version with chapter weightages and inclusions", async () => {
    const validSyllabusInput = {
      title: "Science 2024 Examination Syllabus",
      version: "2024-v1",
      academicYearId: mockYearId,
      classId: mockClassId,
      subjectId: mockSubjectId,
      status: "PUBLISHED" as const,
      chapterItems: [
        {
          chapterId: mockChapterId,
          isIncluded: true,
          weightage: 50.0,
          examinationRelevance: "HIGH" as const,
          notes: "Core chapter",
        },
      ],
    };

    expect(CreateSyllabusSchema.safeParse(validSyllabusInput).success).toBe(true);

    vi.spyOn(prisma.subject, "findUnique").mockResolvedValue({
      id: mockSubjectId,
      classId: mockClassId,
      name: "General Science",
    } as any);
    vi.spyOn(prisma.academicYear, "findUnique").mockResolvedValue({ id: mockYearId } as any);
    vi.spyOn(prisma.syllabus, "findUnique").mockResolvedValue(null);
    vi.spyOn(prisma.syllabus, "create").mockResolvedValue({
      id: "88888888-8888-4888-a888-888888888888",
      ...validSyllabusInput,
      description: null,
      boardId: null,
      effectiveDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const created = await EducationService.createSyllabus(validSyllabusInput);
    expect(created.version).toBe("2024-v1");
  });

  // --------------------------------------------------------------------------
  // 9. Retrieving the complete education hierarchy
  // --------------------------------------------------------------------------
  it("9. should retrieve the complete normalized education hierarchy tree", async () => {
    const mockTree = {
      id: mockBoardId,
      code: "TEST_BOARD",
      name: "Test Board",
      academicYears: [
        {
          id: mockYearId,
          code: "2024-2025",
          classes: [
            {
              id: mockClassId,
              name: "Class 9",
              subjects: [
                {
                  id: mockSubjectId,
                  name: "General Science",
                  books: [
                    {
                      id: mockBookId,
                      title: "Science Fundamentals",
                      version: "2024.1",
                      chapters: [
                        {
                          id: mockChapterId,
                          title: "Introduction",
                          topics: [
                            {
                              id: "top-1",
                              title: "Methodology",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    vi.spyOn(prisma.board, "findUnique").mockResolvedValue(mockTree as any);

    const retrieved = await EducationService.getFullEducationHierarchy(mockBoardId);
    expect(retrieved.id).toBe(mockBoardId);
    expect(retrieved.academicYears[0].classes[0].subjects[0].books[0].chapters[0].topics.length).toBe(1);
  });

  // --------------------------------------------------------------------------
  // 10. Preventing invalid relationships
  // --------------------------------------------------------------------------
  it("10. should prevent creating a book when subject does not belong to the specified class", async () => {
    const wrongClassId = "99999999-9999-4999-a999-999999999999";
    vi.spyOn(prisma.subject, "findUnique").mockResolvedValue({
      id: mockSubjectId,
      classId: mockClassId, // Actual class is mockClassId, NOT wrongClassId
      name: "General Science",
    } as any);

    await expect(
      EducationService.createBook({
        title: "Invalid Book",
        publisher: "Publisher",
        classId: wrongClassId,
        subjectId: mockSubjectId,
        version: "2024.1",
      })
    ).rejects.toThrow(/Referential mismatch/);
  });

  // --------------------------------------------------------------------------
  // 11. Preventing duplicate records
  // --------------------------------------------------------------------------
  it("11. should prevent duplicate board codes, duplicate chapters, and duplicate topic orders", async () => {
    // 11a: Duplicate Board Code
    vi.spyOn(prisma.board, "findUnique").mockResolvedValue({ id: "existing" } as any);
    await expect(
      EducationService.createBoard({
        code: "DUPLICATE_CODE",
        name: "Board 2",
      })
    ).rejects.toThrow(/already exists/);

    // 11b: Duplicate Chapter Number in Same Book
    vi.spyOn(prisma.book, "findUnique").mockResolvedValue({ id: mockBookId, title: "Book" } as any);
    vi.spyOn(prisma.chapter, "findUnique").mockResolvedValue({ id: "existing-ch" } as any);
    await expect(
      EducationService.createChapter({
        bookId: mockBookId,
        chapterNumber: 1, // already exists
        title: "Another Chapter 1",
        orderIndex: 2,
      })
    ).rejects.toThrow(/already exists in book/);

    // 11c: Duplicate Topic Order in Same Chapter
    vi.spyOn(prisma.chapter, "findUnique").mockResolvedValue({ id: mockChapterId, title: "Ch" } as any);
    vi.spyOn(prisma.topic, "findUnique").mockResolvedValue({ id: "existing-topic" } as any);
    await expect(
      EducationService.createTopic({
        chapterId: mockChapterId,
        title: "Duplicate Topic",
        orderIndex: 1, // already exists
      })
    ).rejects.toThrow(/already exists in chapter/);
  });

  // --------------------------------------------------------------------------
  // 12. Confirming old academic-year data remains intact when new version is added
  // --------------------------------------------------------------------------
  it("12. should allow new version of a book without overwriting or deleting old version", async () => {
    // Version 2024.1 exists
    const v2024Book = {
      id: "book-v2024",
      subjectId: mockSubjectId,
      version: "2024.1",
      title: "Biology Grade 9 (2024 Edition)",
    };

    // When creating version 2025.1
    vi.spyOn(prisma.subject, "findUnique").mockResolvedValue({
      id: mockSubjectId,
      classId: mockClassId,
      name: "Biology",
    } as any);

    // findUnique for (subjectId, "2025.1") returns null (new version doesn't exist yet)
    vi.spyOn(prisma.book, "findUnique").mockResolvedValue(null);

    const v2025Book = {
      id: "book-v2025",
      subjectId: mockSubjectId,
      version: "2025.1",
      title: "Biology Grade 9 (2025 Edition)",
    };

    vi.spyOn(prisma.book, "create").mockResolvedValue(v2025Book as any);

    const createdV2025 = await EducationService.createBook({
      title: "Biology Grade 9 (2025 Edition)",
      publisher: "National Board",
      classId: mockClassId,
      subjectId: mockSubjectId,
      version: "2025.1",
    });

    expect(createdV2025.version).toBe("2025.1");
    expect(createdV2025.id).not.toBe(v2024Book.id);

    // Verify trying to create 2024.1 again throws without overwriting
    vi.spyOn(prisma.book, "findUnique").mockResolvedValue(v2024Book as any);
    await expect(
      EducationService.createBook({
        title: "Biology Overwrite Attempt",
        publisher: "National Board",
        classId: mockClassId,
        subjectId: mockSubjectId,
        version: "2024.1",
      })
    ).rejects.toThrow(/already exists. A newer version cannot overwrite an existing version/);
  });
});
