import crypto from "crypto";

/**
 * Computes SHA-256 hash for document integrity and provenance tracking.
 */
export function computeSha256Checksum(buffer: Buffer | string): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Sanitizes raw string input to guard against injection.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .trim();
}

/**
 * Generates a deterministic or cryptographic seed for paper generation.
 */
export function generateReproducibilitySeed(): string {
  return crypto.randomBytes(8).toString("hex");
}
