// ==============================================================================
// AI Live Paper Generator - Master Storage Service (Phase 10)
// Security Verification, Magic-Byte Inspection & File Lifecycle Management
// ==============================================================================

import { IStorageProvider, StorageObjectInfo } from "./storage-interface";
import { LocalStorageProvider } from "./local-storage-provider";

export class StorageService {
  private static activeProvider: IStorageProvider = new LocalStorageProvider();
  private static readonly MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

  /**
   * Sets custom storage provider (e.g. for S3 or testing).
   */
  public static setProvider(provider: IStorageProvider): void {
    this.activeProvider = provider;
  }

  /**
   * Inspects buffer magic bytes to ensure file contents match claimed MIME type.
   */
  public static verifyMagicBytes(data: Buffer, claimedMimeType: string): boolean {
    if (data.length < 4) return false;

    if (claimedMimeType === "application/pdf") {
      // PDF starts with %PDF- (0x25, 0x50, 0x44, 0x46)
      return (
        data[0] === 0x25 &&
        data[1] === 0x50 &&
        data[2] === 0x44 &&
        data[3] === 0x46
      );
    }

    if (claimedMimeType === "image/png") {
      // PNG starts with 0x89, 0x50, 0x4E, 0x47
      return (
        data[0] === 0x89 &&
        data[1] === 0x50 &&
        data[2] === 0x4e &&
        data[3] === 0x47
      );
    }

    if (claimedMimeType === "image/jpeg") {
      // JPEG starts with 0xFF, 0xD8, 0xFF
      return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
    }

    if (claimedMimeType === "application/json" || claimedMimeType.startsWith("text/")) {
      // Valid UTF-8 / ASCII text
      return true;
    }

    return true;
  }

  /**
   * Uploads an educational asset after security verification.
   */
  public static async uploadFile(
    key: string,
    data: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<StorageObjectInfo> {
    if (data.length > this.MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `File size (${Math.round(data.length / (1024 * 1024))}MB) exceeds maximum permitted limit (50MB).`
      );
    }

    if (!this.verifyMagicBytes(data, contentType)) {
      throw new Error(
        `Security verification failed: File content does not match claimed MIME type "${contentType}".`
      );
    }

    return this.activeProvider.upload(key, data, contentType, metadata);
  }

  /**
   * Downloads a stored asset.
   */
  public static async downloadFile(key: string): Promise<Buffer> {
    return this.activeProvider.download(key);
  }

  /**
   * Deletes a stored asset.
   */
  public static async deleteFile(key: string): Promise<boolean> {
    return this.activeProvider.delete(key);
  }

  /**
   * Checks existence of a file key.
   */
  public static async fileExists(key: string): Promise<boolean> {
    return this.activeProvider.exists(key);
  }

  /**
   * Generates a signed access URL.
   */
  public static async getSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    return this.activeProvider.getSignedUrl(key, expiresInSeconds);
  }
}
