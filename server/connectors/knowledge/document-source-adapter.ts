// ==============================================================================
// AI Live Paper Generator - Document Source Adapter (Phase 10)
// Onboarding Official Curriculum PDFs & Authoritative Textbooks
// ==============================================================================

import { createHash } from "crypto";
import {
  IKnowledgeSourceConnector,
  ConnectorConfig,
  ConnectionStatus,
  KnowledgeSourceItem,
  SourceDocumentPayload,
  KnowledgeSyncResult,
} from "./knowledge-source-interface";

export class DocumentSourceAdapter implements IKnowledgeSourceConnector {
  public readonly connectorId = "connector-document-source";
  public readonly name = "Authorized Document Repository Adapter";
  public readonly type = "LOCAL_DOCUMENT" as const;

  private isConnected = false;
  private basePath = "";
  private documentRegistry: Map<string, SourceDocumentPayload> = new Map();

  public async connect(config: ConnectorConfig): Promise<{ status: ConnectionStatus; message: string }> {
    this.basePath = config.workspacePath || "./data/curriculum";
    this.isConnected = true;
    return {
      status: "CONNECTED",
      message: `Document repository initialized at: ${this.basePath}`,
    };
  }

  public registerDocument(doc: {
    id: string;
    title: string;
    content: string;
    subject?: string;
    classLevel?: number;
    publisher?: string;
    sourceUrl?: string;
    sections?: Array<{ heading: string; level: number; content: string; pageNumber?: number }>;
  }): SourceDocumentPayload {
    const hash = createHash("sha256").update(doc.content).digest("hex");
    const payload: SourceDocumentPayload = {
      sourceId: doc.id,
      title: doc.title,
      rawText: doc.content,
      sourceHash: hash,
      sections: doc.sections || [],
      metadata: {
        publisher: doc.publisher || "National Curriculum Board",
        subject: doc.subject,
        classLevel: doc.classLevel,
        sourceUrl: doc.sourceUrl,
      },
    };

    this.documentRegistry.set(doc.id, payload);
    return payload;
  }

  public async listSources(filter?: { subject?: string; search?: string }): Promise<KnowledgeSourceItem[]> {
    const items: KnowledgeSourceItem[] = [];

    for (const [id, doc] of this.documentRegistry.entries()) {
      if (filter?.search && !doc.title.toLowerCase().includes(filter.search.toLowerCase())) {
        continue;
      }
      if (filter?.subject && doc.metadata.subject !== filter.subject) {
        continue;
      }

      items.push({
        id,
        title: doc.title,
        authorOrPublisher: (doc.metadata.publisher as string) || "National Curriculum Board",
        subject: doc.metadata.subject as string | undefined,
        classLevel: doc.metadata.classLevel as number | undefined,
        mimeType: "application/pdf",
        sourceHash: doc.sourceHash,
        lastModified: new Date().toISOString(),
        provenanceDetails: {
          sourceUrl: doc.metadata.sourceUrl as string | undefined,
          verified: true,
        },
      });
    }

    return items;
  }

  public async fetchDocumentContent(sourceId: string): Promise<SourceDocumentPayload> {
    const doc = this.documentRegistry.get(sourceId);
    if (!doc) {
      throw new Error(`Curriculum document "${sourceId}" not found in repository.`);
    }
    return doc;
  }

  public async sync(sourceIds: string[]): Promise<KnowledgeSyncResult> {
    const result: KnowledgeSyncResult = {
      connectorId: this.connectorId,
      totalRequested: sourceIds.length,
      syncedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      items: [],
    };

    for (const id of sourceIds) {
      const doc = this.documentRegistry.get(id);
      if (!doc) {
        result.failedCount++;
        result.items.push({
          sourceId: id,
          title: "Unknown",
          status: "FAILED",
          documentHash: "",
          errorMessage: "Document not registered",
        });
        continue;
      }

      result.syncedCount++;
      result.items.push({
        sourceId: id,
        title: doc.title,
        status: "SYNCED",
        documentHash: doc.sourceHash,
      });
    }

    return result;
  }
}
