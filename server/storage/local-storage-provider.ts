// ==============================================================================
// AI Live Paper Generator - Local File Storage Provider (Phase 10)
// Hardened Local Filesystem Storage with Path Traversal Protection
// ==============================================================================

import fs from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import { IStorageProvider, StorageObjectInfo } from "./storage-interface";

export class LocalStorageProvider implements IStorageProvider {
  public readonly providerName = "local-storage";
  private readonly basePath: string;

  constructor(baseDirectory?: string) {
    this.basePath = path.resolve(baseDirectory || "./storage-vault");
  }

  /**
   * Sanitizes key and ensures it stays strictly within the base directory.
   */
  private resolveSafePath(key: string): string {
    // Disallow null bytes
    if (key.includes("\0")) {
      throw new Error("Invalid storage key: Null bytes are not permitted.");
    }

    if (key.includes("..")) {
      throw new Error(`Invalid storage key: Path traversal attempt detected for "${key}".`);
    }

    const fullPath = path.resolve(this.basePath, path.normalize(key));

    if (!fullPath.startsWith(this.basePath)) {
      throw new Error(`Invalid storage key: Path traversal attempt detected for "${key}".`);
    }

    return fullPath;
  }

  public async upload(
    key: string,
    data: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<StorageObjectInfo> {
    const filePath = this.resolveSafePath(key);
    const parentDir = path.dirname(filePath);

    await fs.mkdir(parentDir, { recursive: true });
    await fs.writeFile(filePath, data);

    const checksum = createHash("sha256").update(data).digest("hex");

    return {
      key,
      sizeBytes: data.length,
      contentType,
      checksumSha256: checksum,
      url: `/api/storage/files/${encodeURIComponent(key)}`,
      uploadedAt: new Date().toISOString(),
      metadata,
    };
  }

  public async download(key: string): Promise<Buffer> {
    const filePath = this.resolveSafePath(key);
    try {
      return await fs.readFile(filePath);
    } catch (err: any) {
      if (err.code === "ENOENT") {
        throw new Error(`File with key "${key}" does not exist in storage.`);
      }
      throw err;
    }
  }

  public async delete(key: string): Promise<boolean> {
    const filePath = this.resolveSafePath(key);
    try {
      await fs.unlink(filePath);
      return true;
    } catch (err: any) {
      if (err.code === "ENOENT") {
        return false;
      }
      throw err;
    }
  }

  public async exists(key: string): Promise<boolean> {
    const filePath = this.resolveSafePath(key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  public async getSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    // Local signed URL simulation with expiry token
    const token = Buffer.from(`${key}:${Date.now() + expiresInSeconds * 1000}`).toString("base64url");
    return `/api/storage/files/${encodeURIComponent(key)}?token=${token}`;
  }
}
