// ==============================================================================
// AI Live Paper Generator - Provenance & Source Validator (Phase 10)
// Prevents Educational Data Fabrication & Enforces Strict Source Traceability
// ==============================================================================

import {
  ImportBoardPayload,
  ProvenanceMetadata,
  ImportValidationError,
  ImportValidationWarning,
  VerificationState,
} from "./data-import-types";

export class SourceValidator {
  /**
   * Evaluates the provenance metadata of an incoming curriculum document.
   * INVARIANT: Never allow ungrounded or fabricated educational records into VERIFIED status.
   */
  public static validateProvenance(
    provenance?: ProvenanceMetadata,
    contextPath: string = "root"
  ): {
    errors: ImportValidationError[];
    warnings: ImportValidationWarning[];
    resolvedStatus: VerificationState;
  } {
    const errors: ImportValidationError[] = [];
    const warnings: ImportValidationWarning[] = [];

    if (!provenance) {
      errors.push({
        path: `${contextPath}.provenance`,
        code: "DATA_SOURCE_REQUIRED",
        message: "Educational data provenance is completely missing. Source specification is strictly required.",
      });
      return { errors, warnings, resolvedStatus: "DATA_SOURCE_REQUIRED" };
    }

    if (!provenance.sourceName || provenance.sourceName.trim().length < 3) {
      errors.push({
        path: `${contextPath}.provenance.sourceName`,
        code: "MISSING_PROVENANCE",
        message: "Source name must be at least 3 characters identifying the official syllabus or curriculum document.",
      });
    }

    if (!provenance.publisher || provenance.publisher.trim().length < 2) {
      errors.push({
        path: `${contextPath}.provenance.publisher`,
        code: "MISSING_PROVENANCE",
        message: "Publisher must specify the responsible textbook board or ministry of education.",
      });
    }

    if (!provenance.importedBy || provenance.importedBy.trim().length === 0) {
      errors.push({
        path: `${contextPath}.provenance.importedBy`,
        code: "MISSING_PROVENANCE",
        message: "ImportedBy user identification is mandatory for audit trail accountability.",
      });
    }

    // Check for source verification evidence
    const hasHash = Boolean(provenance.sourceDocumentHash && provenance.sourceDocumentHash.length >= 16);
    const hasUrl = Boolean(provenance.sourceUrl && provenance.sourceUrl.startsWith("http"));
    const hasPublicationDate = Boolean(provenance.officialPublicationDate);

    let resolvedStatus: VerificationState = provenance.verificationStatus || "UNVERIFIED";

    if (!hasHash && !hasUrl && !hasPublicationDate) {
      warnings.push({
        path: `${contextPath}.provenance`,
        code: "UNVERIFIED_SOURCE",
        message: "No official URL, document hash, or publication date was provided. Record requires secondary verification.",
      });
      if (resolvedStatus === "VERIFIED") {
        // Prevent unwarranted claim of VERIFIED status without evidence
        resolvedStatus = "NEEDS_VERIFICATION";
      }
    }

    return { errors, warnings, resolvedStatus };
  }

  /**
   * Validates the structural integrity, naming rules, and parent-child hierarchy.
   */
  public static validateHierarchy(payload: ImportBoardPayload): {
    errors: ImportValidationError[];
    warnings: ImportValidationWarning[];
  } {
    const errors: ImportValidationError[] = [];
    const warnings: ImportValidationWarning[] = [];

    // 1. Board Level
    if (!payload.code || !/^[A-Za-z0-9_-]+$/.test(payload.code)) {
      errors.push({
        path: "board.code",
        code: "INVALID_FIELD",
        message: `Board code "${payload.code}" must contain only alphanumeric characters, underscores, or hyphens.`,
      });
    }

    if (!payload.name || payload.name.trim().length < 2) {
      errors.push({
        path: "board.name",
        code: "INVALID_FIELD",
        message: "Board name must be provided and contain at least 2 characters.",
      });
    }

    if (!payload.academicYears || payload.academicYears.length === 0) {
      errors.push({
        path: "board.academicYears",
        code: "INVALID_HIERARCHY",
        message: "Board must include at least one academic year session.",
      });
      return { errors, warnings };
    }

    // 2. Academic Year Level
    const seenYearCodes = new Set<string>();
    payload.academicYears.forEach((year, yIdx) => {
      const yearPath = `board.academicYears[${yIdx}]`;
      if (!year.code || year.code.trim().length === 0) {
        errors.push({
          path: `${yearPath}.code`,
          code: "INVALID_FIELD",
          message: "Academic year code is required (e.g. 2024-2025).",
        });
      } else if (seenYearCodes.has(year.code)) {
        errors.push({
          path: `${yearPath}.code`,
          code: "DUPLICATE_CODE",
          message: `Duplicate academic year code "${year.code}" in import payload.`,
        });
      } else {
        seenYearCodes.add(year.code);
      }

      if (!year.classes || year.classes.length === 0) {
        warnings.push({
          path: `${yearPath}.classes`,
          code: "MISSING_RECOMMENDED_FIELD",
          message: `Academic year "${year.code}" has no classes defined.`,
        });
      }

      // 3. Class Level
      const seenLevels = new Set<number>();
      (year.classes || []).forEach((cls, cIdx) => {
        const classPath = `${yearPath}.classes[${cIdx}]`;
        if (typeof cls.numericLevel !== "number" || cls.numericLevel < 1 || cls.numericLevel > 16) {
          errors.push({
            path: `${classPath}.numericLevel`,
            code: "INVALID_FIELD",
            message: `Class numericLevel must be between 1 and 16, got "${cls.numericLevel}".`,
          });
        } else if (seenLevels.has(cls.numericLevel)) {
          errors.push({
            path: `${classPath}.numericLevel`,
            code: "DUPLICATE_CODE",
            message: `Duplicate class numeric level "${cls.numericLevel}" in year "${year.code}".`,
          });
        } else {
          seenLevels.add(cls.numericLevel);
        }

        // 4. Subject Level
        const seenSubjectCodes = new Set<string>();
        (cls.subjects || []).forEach((subject, sIdx) => {
          const subjectPath = `${classPath}.subjects[${sIdx}]`;
          if (!subject.code || subject.code.trim().length === 0) {
            errors.push({
              path: `${subjectPath}.code`,
              code: "INVALID_FIELD",
              message: "Subject code is required.",
            });
          } else if (seenSubjectCodes.has(subject.code)) {
            errors.push({
              path: `${subjectPath}.code`,
              code: "DUPLICATE_CODE",
              message: `Duplicate subject code "${subject.code}" in class level ${cls.numericLevel}.`,
            });
          } else {
            seenSubjectCodes.add(subject.code);
          }

          // 5. Book Level
          (subject.books || []).forEach((book, bIdx) => {
            const bookPath = `${subjectPath}.books[${bIdx}]`;
            if (!book.title || book.title.trim().length === 0) {
              errors.push({
                path: `${bookPath}.title`,
                code: "INVALID_FIELD",
                message: "Book title is required.",
              });
            }

            const bookProv = this.validateProvenance(book.provenance, bookPath);
            errors.push(...bookProv.errors);
            warnings.push(...bookProv.warnings);

            // 6. Chapter Level
            const seenChapterNums = new Set<number>();
            (book.chapters || []).forEach((ch, chIdx) => {
              const chPath = `${bookPath}.chapters[${chIdx}]`;
              if (typeof ch.chapterNumber !== "number" || ch.chapterNumber < 1) {
                errors.push({
                  path: `${chPath}.chapterNumber`,
                  code: "INVALID_FIELD",
                  message: `Chapter number must be a positive integer, got "${ch.chapterNumber}".`,
                });
              } else if (seenChapterNums.has(ch.chapterNumber)) {
                errors.push({
                  path: `${chPath}.chapterNumber`,
                  code: "DUPLICATE_CODE",
                  message: `Duplicate chapter number ${ch.chapterNumber} in book "${book.title}".`,
                });
              } else {
                seenChapterNums.add(ch.chapterNumber);
              }

              if (!ch.title || ch.title.trim().length === 0) {
                errors.push({
                  path: `${chPath}.title`,
                  code: "INVALID_FIELD",
                  message: "Chapter title is required.",
                });
              }

              // 7. Topic Level
              const seenTopicOrders = new Set<number>();
              (ch.topics || []).forEach((topic, tIdx) => {
                const topicPath = `${chPath}.topics[${tIdx}]`;
                if (!topic.title || topic.title.trim().length === 0) {
                  errors.push({
                    path: `${topicPath}.title`,
                    code: "INVALID_FIELD",
                    message: "Topic title is required.",
                  });
                }
                if (typeof topic.orderIndex !== "number" || topic.orderIndex < 1) {
                  errors.push({
                    path: `${topicPath}.orderIndex`,
                    code: "INVALID_FIELD",
                    message: `Topic orderIndex must be a positive integer, got "${topic.orderIndex}".`,
                  });
                } else if (seenTopicOrders.has(topic.orderIndex)) {
                  errors.push({
                    path: `${topicPath}.orderIndex`,
                    code: "DUPLICATE_CODE",
                    message: `Duplicate topic orderIndex ${topic.orderIndex} in chapter ${ch.chapterNumber}.`,
                  });
                } else {
                  seenTopicOrders.add(topic.orderIndex);
                }
              });
            });
          });
        });
      });
    });

    return { errors, warnings };
  }
}
