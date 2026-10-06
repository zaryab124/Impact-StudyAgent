export type EntityStatus = "ACTIVE" | "INACTIVE" | "DRAFT" | "ARCHIVED";

export interface BoardDTO {
  id: string;
  code: string;
  name: string;
  country: string;
  region?: string | null;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYearDTO {
  id: string;
  boardId: string;
  name: string;
  code: string;
  startDate?: string | null;
  endDate?: string | null;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClassDTO {
  id: string;
  academicYearId: string;
  name: string;
  numericLevel: number;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectDTO {
  id: string;
  classId: string;
  name: string;
  code: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BookDTO {
  id: string;
  title: string;
  edition?: string | null;
  publisher: string;
  author?: string | null;
  isbn?: string | null;
  boardId?: string | null;
  academicYearId?: string | null;
  classId: string;
  subjectId: string;
  version: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterDTO {
  id: string;
  bookId: string;
  chapterNumber: number;
  title: string;
  description?: string | null;
  orderIndex: number;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TopicDTO {
  id: string;
  chapterId: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  topicCode?: string | null;
  learningOutcomes?: string | null;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EducationHierarchyTreeDTO {
  board: BoardDTO;
  academicYears: Array<
    AcademicYearDTO & {
      classes: Array<
        ClassDTO & {
          subjects: Array<
            SubjectDTO & {
              books: Array<
                BookDTO & {
                  chapters: Array<
                    ChapterDTO & {
                      topics: TopicDTO[];
                    }
                  >;
                }
              >;
            }
          >;
        }
      >;
    }
  >;
}
