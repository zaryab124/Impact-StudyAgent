import {
  RetrievalQualityReport,
  RetrievalResultItem,
} from "@/types/retrieval";

export class RetrievalDiagnostics {
  /**
   * Generates a factual quality report evaluating retrieval precision,
   * provenance coverage, syllabus alignment, and latency.
   *
   * STRICT INVARIANT: Never fabricates evaluation scores or synthetic metrics.
   */
  public static generateQualityReport(
    query: string,
    results: RetrievalResultItem[],
    latencyMs: number,
    expectedTopic: string | null = null,
    targetLatencyMs: number = 500
  ): RetrievalQualityReport {
    const isBenchmarkMet = latencyMs <= targetLatencyMs;

    if (results.length === 0) {
      return {
        query,
        expectedTopic,
        retrievedTopics: [],
        relevantResultCount: 0,
        irrelevantResultCount: 0,
        provenanceCoverage: 1.0,
        averageSimilarity: 0.0,
        retrievalLatency: latencyMs,
        targetLatencyMs,
        isBenchmarkMet,
        syllabusEligibilityCoverage: 1.0,
      };
    }

    // 1. Gather Unique Retrieved Topics
    const topicSet = new Set<string>();
    for (const r of results) {
      if (r.provenance.topicTitle) {
        topicSet.add(r.provenance.topicTitle);
      }
    }
    const retrievedTopics = Array.from(topicSet);

    // 2. Count Relevant vs Irrelevant (relevanceScore >= 0.35 considered relevant)
    let relevantCount = 0;
    let irrelevantCount = 0;
    let totalScore = 0;
    let validProvenanceCount = 0;
    let eligibleCount = 0;

    for (const r of results) {
      totalScore += r.relevanceScore;
      if (r.relevanceScore >= 0.35) {
        relevantCount++;
      } else {
        irrelevantCount++;
      }

      if (r.explanation.provenanceVerified) {
        validProvenanceCount++;
      }

      if (r.provenance.eligibilityStatus === "ELIGIBLE") {
        eligibleCount++;
      }
    }

    const averageSimilarity = Number((totalScore / results.length).toFixed(3));
    const provenanceCoverage = Number((validProvenanceCount / results.length).toFixed(3));
    const syllabusEligibilityCoverage = Number((eligibleCount / results.length).toFixed(3));

    return {
      query,
      expectedTopic,
      retrievedTopics,
      relevantResultCount: relevantCount,
      irrelevantResultCount: irrelevantCount,
      provenanceCoverage,
      averageSimilarity,
      retrievalLatency: latencyMs,
      targetLatencyMs,
      isBenchmarkMet,
      syllabusEligibilityCoverage,
    };
  }

  /**
   * Builds an admin-facing diagnostic trace explaining rejection or filtering reasons.
   */
  public static formatDiagnosticExplanation(result: RetrievalResultItem): string {
    const exp = result.explanation;
    const prov = result.provenance;
    const parts = [
      `Final Score: ${(exp.finalScore * 100).toFixed(1)}%`,
      `Semantic Similarity: ${(exp.semanticScore * 100).toFixed(1)}%`,
      `Keyword Match: ${(exp.keywordScore * 100).toFixed(1)}%`,
      `Chapter Grounding: ${exp.chapterMatch} (${prov.chapterTitle || "None"})`,
      `Topic Grounding: ${exp.topicMatch} (${prov.topicTitle || "None"})`,
      `Syllabus Status: ${prov.eligibilityStatus} (Syllabus: ${prov.syllabusId})`,
      `Provenance: ${exp.provenanceVerified ? "VERIFIED" : "INCOMPLETE"} (Page ${prov.pageNumber})`,
    ];

    if (prov.diagnosticCode) {
      parts.push(`Diagnostic: ${prov.diagnosticCode}`);
    }
    if (prov.granularIdentifier) {
      parts.push(`Granular: [${prov.granularScope || "ITEM"}] ${prov.granularIdentifier}`);
    }

    return parts.join(" | ");
  }
}
