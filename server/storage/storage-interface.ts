// ==============================================================================
// AI Live Paper Generator - Storage Provider Interface (Phase 10)
// Production Storage Abstraction for Educational PDFs, Assets & Snapshots
// ==============================================================================

export interface StorageObjectInfo {
  key: string;
  sizeBytes: number;
  contentType: string;
  checksumSha256: string;
  url: string;
  uploadedAt: string;
  metadata?: Record<string, string>;
}

export interface IStorageProvider {
  readonly providerName: string;

  upload(
    key: string,
    data: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<StorageObjectInfo>;

  download(key: string): Promise<Buffer>;

  delete(key: string): Promise<boolean>;

  exists(key: string): Promise<boolean>;

  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
