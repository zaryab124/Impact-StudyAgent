/**
 * Future Phase 3 Prompt Template: Exam Paper Quality & Semantic Duplication Validator.
 */

export function buildPaperValidationPrompt(paperJson: string): string {
  return `You are an examination auditing officer.
Audit the following draft examination paper for semantic duplication, ambiguities, and alignment:

PAPER SPECIFICATION:
"""
${paperJson}
"""

CHECKLIST:
1. Verify if any two questions test the exact same concept redundantly.
2. Verify clarity of question wording and absence of ambiguous phrasing.
3. Verify that multiple-choice options have exactly one unambiguous correct option.

Provide an auditing report in structured JSON format.`;
}
