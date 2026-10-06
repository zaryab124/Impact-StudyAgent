// ==============================================================================
// AI Live Paper Generator - Knowledge Source Sync Service (Phase 10)
// Coordinates Connectors, Provenance Tracking & Chunk Knowledge Integration
// ==============================================================================

import { AuditLogger } from "@/server/audit-logger";
import {
  IKnowledgeSourceConnector,
  KnowledgeSourceItem,
  SourceDocumentPayload,
  KnowledgeSyncResult,
} from "./knowledge-source-interface";

export interface SyncedDocumentChunk {
  chunkId: string;
  sourceId: string;
  connectorType: string;
  sourceDocumentHash: string;
  text: string;
  sectionHeading?: string;
  pageNumber?: number;
  metadata: Record<string, unknown>;
  syncedAt: string;
}

export class SourceSyncService {
  private static connectors: Map<string, IKnowledgeSourceConnector> = new Map();
  private static syncedChunks: Map<string, SyncedDocumentChunk[]> = new Map(); // key: sourceId

  /**
   * Registers a knowledge source connector.
   */
  public static registerConnector(connector: IKnowledgeSourceConnector): void {
    this.connectors.set(connector.connectorId, connector);
  }

  /**
   * Retrieves a registered connector.
   */
  public static getConnector(connectorId: string): IKnowledgeSourceConnector | undefined {
    return this.connectors.get(connectorId);
  }

  /**
   * Lists all available sources across all registered connectors.
   */
  public static async listAllSources(filter?: { subject?: string; search?: string }): Promise<
    Array<KnowledgeSourceItem & { connectorId: string; connectorType: string }>
  > {
    const results: Array<KnowledgeSourceItem & { connectorId: string; connectorType: string }> = [];

    for (const [connectorId, connector] of this.connectors.entries()) {
      try {
        const sources = await connector.listSources(filter);
        for (const s of sources) {
          results.push({
            ...s,
            connectorId,
            connectorType: connector.type,
          });
        }
      } catch (err) {
        console.warn(`[SourceSyncService] Failed to list sources for connector "${connectorId}":`, err);
      }
    }

    return results;
  }

  /**
   * Syncs a document from a specific connector and chunks it into traceable knowledge units.
   */
  public static async syncDocument(
    connectorId: string,
    sourceId: string,
    userId: string = "system"
  ): Promise<{ success: boolean; chunksCount: number; documentHash: string; error?: string }> {
    const connector = this.connectors.get(connectorId);
    if (!connector) {
      return {
        success: false,
        chunksCount: 0,
        documentHash: "",
        error: `Connector "${connectorId}" is not registered.`,
      };
    }

    try {
      const doc: SourceDocumentPayload = await connector.fetchDocumentContent(sourceId);

      // Break into paragraph/section chunks with provenance
      const chunks: SyncedDocumentChunk[] = [];
      const sections = doc.sections && doc.sections.length > 0
        ? doc.sections
        : [{ heading: doc.title, level: 1, content: doc.rawText, pageNumber: 1 }];

      let chunkIdx = 1;
      for (const sec of sections) {
        const paragraphs = sec.content
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter((p) => p.length > 20);

        for (const p of paragraphs) {
          chunks.push({
            chunkId: `${sourceId}-chk-${chunkIdx++}`,
            sourceId,
            connectorType: connector.type,
            sourceDocumentHash: doc.sourceHash,
            text: p,
            sectionHeading: sec.heading,
            pageNumber: sec.pageNumber || 1,
            metadata: {
              ...doc.metadata,
              documentTitle: doc.title,
            },
            syncedAt: new Date().toISOString(),
          });
        }
      }

      this.syncedChunks.set(sourceId, chunks);

      await AuditLogger.log({
        userId,
        action: "KNOWLEDGE_DOCUMENT_SYNCED",
        resource: "KnowledgeSource",
        resourceId: sourceId,
        metadata: {
          connectorId,
          connectorType: connector.type,
          chunksCount: chunks.length,
          documentHash: doc.sourceHash,
          title: doc.title,
        },
      });

      return {
        success: true,
        chunksCount: chunks.length,
        documentHash: doc.sourceHash,
      };
    } catch (err: any) {
      return {
        success: false,
        chunksCount: 0,
        documentHash: "",
        error: err.message || "Failed to sync document",
      };
    }
  }

  /**
   * Retrieves synced chunks for a source document.
   */
  public static getSyncedChunks(sourceId: string): SyncedDocumentChunk[] {
    return this.syncedChunks.get(sourceId) || [];
  }

  /**
   * Clears in-memory data for testing.
   */
  public static resetMemory(): void {
    this.connectors.clear();
    this.syncedChunks.clear();
  }
}
