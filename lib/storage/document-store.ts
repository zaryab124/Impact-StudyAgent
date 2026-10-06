import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads", "documents");

export interface StoredDocumentMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  checksum: string;
}

export class DocumentStorageService {
  private static ensureStorageDir(): void {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  /**
   * Computes SHA-256 hash of a file buffer for immutable provenance and duplicate detection.
   */
  public static computeChecksum(buffer: Buffer): string {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  /**
   * Validates file buffer for PDF MIME type and %PDF- magic bytes signature.
   */
  public static validatePdfBuffer(buffer: Buffer, originalFileName: string): void {
    const MAX_SIZE = Number(process.env.MAX_FILE_SIZE_BYTES) || 52428800; // 50MB

    if (buffer.length === 0) {
      throw new Error("File is empty (0 bytes).");
    }

    if (buffer.length > MAX_SIZE) {
      throw new Error(
        `File size (${(buffer.length / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed limit (${(MAX_SIZE / 1024 / 1024).toFixed(2)} MB).`
      );
    }

    // Verify magic bytes "%PDF-" (0x25 0x50 0x44 0x46 0x2D)
    const header = buffer.subarray(0, 5).toString("utf-8");
    if (!header.startsWith("%PDF-")) {
      throw new Error(
        `Invalid file signature. File "${originalFileName}" is not a valid PDF document (missing %PDF- header).`
      );
    }
  }

  /**
   * Securely saves the PDF file buffer to disk. Uses checksum as filename to prevent traversal and duplicate storage.
   */
  public static async saveDocument(
    buffer: Buffer,
    originalFileName: string
  ): Promise<StoredDocumentMetadata> {
    this.ensureStorageDir();
    this.validatePdfBuffer(buffer, originalFileName);

    const checksum = this.computeChecksum(buffer);
    const sanitizedBase = path.basename(originalFileName).replace(/[^a-zA-Z0-9_.-]/g, "_");
    const targetFileName = `${checksum}.pdf`;
    const targetPath = path.join(UPLOADS_DIR, targetFileName);

    // Write file securely
    await fs.promises.writeFile(targetPath, buffer);

    return {
      fileName: sanitizedBase,
      fileSize: buffer.length,
      mimeType: "application/pdf",
      storagePath: targetPath,
      checksum,
    };
  }

  /**
   * Retrieves original document buffer from secure server-side storage.
   */
  public static async getDocumentBuffer(storagePath: string): Promise<Buffer> {
    const resolvedPath = path.resolve(storagePath);
    if (!resolvedPath.startsWith(UPLOADS_DIR)) {
      throw new Error("Access Denied: Attempted path traversal outside document storage.");
    }
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Document file not found at storage path: ${resolvedPath}`);
    }
    return fs.promises.readFile(resolvedPath);
  }
}
