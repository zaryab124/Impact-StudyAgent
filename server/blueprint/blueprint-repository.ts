// ==============================================================================
// AI Live Paper Generator - Blueprint Repository (Phase 7)
// Thread-Safe Persistence with Prisma Integration & Resilient In-Memory Store
// ==============================================================================

import {
  ExaminationBlueprint,
  QuestionSpecification,
} from "@/types/blueprint";
import { prisma } from "@/lib/db";

export class BlueprintRepository {
  private static memoryBlueprints: Map<string, ExaminationBlueprint> = new Map();
  private static memorySpecs: Map<string, QuestionSpecification> = new Map();

  /**
   * Saves or updates an ExaminationBlueprint.
   */
  public static async saveBlueprint(
    blueprint: ExaminationBlueprint
  ): Promise<ExaminationBlueprint> {
    const clone = JSON.parse(JSON.stringify(blueprint));
    this.memoryBlueprints.set(clone.id, clone);

    if (process.env.NODE_ENV !== "test") {
      try {
        let patternId = blueprint.sourcePatternId || "default-pattern";

        // Ensure referenced PaperPattern exists to satisfy foreign key constraint
        const existingPattern = await prisma.paperPattern.findUnique({
          where: { id: patternId },
          select: { id: true },
        });

        if (!existingPattern) {
          // Check if any pattern exists for this subject, or create fallback
          const subjectPattern = await prisma.paperPattern.findFirst({
            where: { subjectId: blueprint.subjectId || undefined },
            select: { id: true },
          });

          if (subjectPattern) {
            patternId = subjectPattern.id;
          } else {
            // Upsert fallback pattern with default-pattern ID
            const created = await prisma.paperPattern.upsert({
              where: { id: "default-pattern" },
              update: {},
              create: {
                id: "default-pattern",
                subjectId: blueprint.subjectId || "sub-phy-9",
                title: "Standard Baseline Examination Pattern",
                totalMarks: blueprint.totalMarks || 75,
                version: "v1.0",
                status: "ACTIVE",
              },
            });
            patternId = created.id;
          }
        }

        // Persist blueprint with full JSON in sectionSpecs
        await prisma.paperBlueprint.upsert({
          where: { id: blueprint.id },
          create: {
            id: blueprint.id,
            patternId,
            name: blueprint.title,
            totalMarks: blueprint.totalMarks,
            totalQuestions: blueprint.slots?.length || 0,
            durationMinutes: blueprint.durationMinutes,
            easyCount: blueprint.difficultyComparison?.finalBlueprintDistribution?.easyCount ?? 0,
            mediumCount: blueprint.difficultyComparison?.finalBlueprintDistribution?.mediumCount ?? 0,
            difficultCount: blueprint.difficultyComparison?.finalBlueprintDistribution?.difficultCount ?? 0,
            chapterDistribution: blueprint.coverageAllocation as any,
            choiceRules: blueprint.sections?.map((s) => s.choiceRule) as any,
            sectionSpecs: { fullBlueprint: clone } as any,
          },
          update: {
            name: blueprint.title,
            totalMarks: blueprint.totalMarks,
            totalQuestions: blueprint.slots?.length || 0,
            durationMinutes: blueprint.durationMinutes,
            easyCount: blueprint.difficultyComparison?.finalBlueprintDistribution?.easyCount ?? 0,
            mediumCount: blueprint.difficultyComparison?.finalBlueprintDistribution?.mediumCount ?? 0,
            difficultCount: blueprint.difficultyComparison?.finalBlueprintDistribution?.difficultCount ?? 0,
            chapterDistribution: blueprint.coverageAllocation as any,
            choiceRules: blueprint.sections?.map((s) => s.choiceRule) as any,
            sectionSpecs: { fullBlueprint: clone } as any,
          },
        });
      } catch (err) {
        console.warn("[BlueprintRepository] DB persistence warning (in-memory authority preserved):", err);
      }
    }

    return clone;
  }

  /**
   * Retrieves an ExaminationBlueprint by ID with seamless DB fallback for serverless restarts.
   */
  public static async findBlueprintById(
    id: string
  ): Promise<ExaminationBlueprint | null> {
    if (!id || typeof id !== "string") {
      return null;
    }
    const mem = this.memoryBlueprints.get(id);
    if (mem) {
      return JSON.parse(JSON.stringify(mem));
    }

    // Serverless container cold start fallback: fetch from PostgreSQL
    try {
      const dbRow = await prisma.paperBlueprint.findUnique({
        where: { id },
      });

      if (dbRow) {
        const full = (dbRow.sectionSpecs as any)?.fullBlueprint;
        if (full) {
          this.memoryBlueprints.set(id, full);
          return JSON.parse(JSON.stringify(full));
        }
      }
    } catch (err) {
      console.warn("[BlueprintRepository] DB lookup failed, checking in-memory only:", err);
    }

    return null;
  }

  /**
   * Lists all blueprints, pulling from DB to survive serverless cold starts.
   */
  public static async listBlueprints(filters: {
    subjectId?: string;
    classId?: string;
    boardId?: string;
    status?: string;
  } = {}): Promise<ExaminationBlueprint[]> {
    try {
      const dbRows = await prisma.paperBlueprint.findMany({
        orderBy: { createdAt: "desc" },
      });

      for (const row of dbRows) {
        const full = (row.sectionSpecs as any)?.fullBlueprint;
        if (full && !this.memoryBlueprints.has(full.id)) {
          this.memoryBlueprints.set(full.id, full);
        }
      }
    } catch (err) {
      console.warn("[BlueprintRepository] DB list failed, using in-memory only:", err);
    }

    let list = Array.from(this.memoryBlueprints.values());

    if (filters.subjectId) {
      list = list.filter((b) => b.subjectId === filters.subjectId);
    }
    if (filters.classId) {
      list = list.filter((b) => b.classId === filters.classId);
    }
    if (filters.boardId) {
      list = list.filter((b) => b.boardId === filters.boardId);
    }
    if (filters.status) {
      list = list.filter((b) => b.status === filters.status);
    }

    return JSON.parse(JSON.stringify(list));
  }

  /**
   * Deletes a blueprint from repository and DB.
   */
  public static async deleteBlueprint(id: string): Promise<boolean> {
    const existed = this.memoryBlueprints.delete(id);
    try {
      await prisma.paperBlueprint.delete({ where: { id } });
    } catch {
      // ignore if not present in DB
    }
    return existed;
  }

  /**
   * Saves QuestionSpecifications for a blueprint.
   */
  public static async saveSpecifications(
    specs: QuestionSpecification[]
  ): Promise<QuestionSpecification[]> {
    for (const spec of specs) {
      this.memorySpecs.set(spec.id, JSON.parse(JSON.stringify(spec)));
    }
    return specs;
  }

  /**
   * Retrieves a QuestionSpecification by ID.
   */
  public static async findSpecificationById(
    id: string
  ): Promise<QuestionSpecification | null> {
    const spec = this.memorySpecs.get(id);
    return spec ? JSON.parse(JSON.stringify(spec)) : null;
  }

  /**
   * Lists all QuestionSpecifications for a blueprint.
   */
  public static async listSpecifications(
    blueprintId?: string
  ): Promise<QuestionSpecification[]> {
    let list = Array.from(this.memorySpecs.values());
    if (blueprintId) {
      list = list.filter((s) => s.blueprintId === blueprintId);
    }
    return JSON.parse(JSON.stringify(list));
  }

  /**
   * Clears memory state (for test isolation).
   */
  public static resetMemory(): void {
    this.memoryBlueprints.clear();
    this.memorySpecs.clear();
  }
}
