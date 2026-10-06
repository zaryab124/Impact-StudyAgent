// ==============================================================================
// AI Live Paper Generator - NotebookLM Connector Implementation (Phase 10)
// Provider-Agnostic Research Notebook Knowledge Ingestion Connector
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

export class NotebookConnector implements IKnowledgeSourceConnector {
  public readonly connectorId = "connector-notebooklm";
  public readonly name = "NotebookLM Knowledge Connector";
  public readonly type = "NOTEBOOK_LM" as const;

  private isConnected = false;
  private connectionStatus: ConnectionStatus = "UNVERIFIED";
  private activeConfig: ConnectorConfig | null = null;
  private localNotebookStore: Map<string, SourceDocumentPayload> = new Map();

  /**
   * Connects to the NotebookLM / research notebook workspace.
   * STRICT INVARIANT: If credentials or endpoint are not explicitly provided,
   * never report fake success. Report UNVERIFIED or OFFLINE.
   */
  public async connect(config: ConnectorConfig): Promise<{ status: ConnectionStatus; message: string }> {
    this.activeConfig = config;

    // Check if configuration provides real authorization or endpoint
    if (!config.endpoint && !config.apiKey && !config.workspacePath) {
      this.isConnected = false;
      this.connectionStatus = "UNVERIFIED";
      return {
        status: "UNVERIFIED",
        message: "No notebook workspace endpoint, API key, or workspace directory provided. Connector is unverified.",
      };
    }

    // In local development or workspace mock mode
    if (config.workspacePath) {
      this.isConnected = true;
      this.connectionStatus = "CONNECTED";
      return {
        status: "CONNECTED",
        message: `Connected to local notebook repository at "${config.workspacePath}".`,
      };
    }

    if (config.endpoint && config.apiKey) {
      // In production with real endpoint and key
      this.isConnected = true;
      this.connectionStatus = "CONNECTED";
      return {
        status: "CONNECTED",
        message: `Connected to remote notebook endpoint: ${config.endpoint}`,
      };
    }

    this.isConnected = false;
    this.connectionStatus = "OFFLINE";
    return {
      status: "OFFLINE",
      message: "Notebook endpoint provided but API credentials are unverified.",
    };
  }

  /**
   * Registers a notebook document (for authorized local ingestion or testing).
   */
  public registerNotebookDocument(payload: SourceDocumentPayload): void {
    this.localNotebookStore.set(payload.sourceId, payload);
  }

  /**
   * Lists available notebook sources.
   */
  public async listSources(filter?: { subject?: string; search?: string }): Promise<KnowledgeSourceItem[]> {
    const items: KnowledgeSourceItem[] = [];

    for (const [id, doc] of this.localNotebookStore.entries()) {
      if (filter?.search && !doc.title.toLowerCase().includes(filter.search.toLowerCase())) {
        continue;
      }
      if (filter?.subject && doc.metadata.subject !== filter.subject) {
        continue;
      }

      items.push({
        id,
        title: doc.title,
        authorOrPublisher: (doc.metadata.publisher as string) || "NotebookLM Curated Notes",
        subject: doc.metadata.subject as string | undefined,
        classLevel: doc.metadata.classLevel as number | undefined,
        mimeType: "text/markdown",
        sourceHash: doc.sourceHash,
        lastModified: new Date().toISOString(),
        provenanceDetails: {
          sourceUrl: (doc.metadata.sourceUrl as string) || undefined,
          verified: this.connectionStatus === "CONNECTED",
        },
      });
    }

    return items;
  }

  /**
   * Fetches content of a notebook source.
   */
  public async fetchDocumentContent(sourceId: string): Promise<SourceDocumentPayload> {
    const doc = this.localNotebookStore.get(sourceId);
    if (!doc) {
      throw new Error(`Notebook document with ID "${sourceId}" not found.`);
    }
    return doc;
  }

  /**
   * Syncs requested sources.
   */
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
      const doc = this.localNotebookStore.get(id);
      if (!doc) {
        result.failedCount++;
        result.items.push({
          sourceId: id,
          title: "Unknown",
          status: "FAILED",
          documentHash: "",
          errorMessage: "Document not found in notebook store",
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

  /**
   * Helper to create document payload with automatic SHA-256 hash.
   */
  public static createPayload(
    id: string,
    title: string,
    rawText: string,
    metadata: Record<string, unknown> = {}
  ): SourceDocumentPayload {
    const sourceHash = createHash("sha256").update(rawText).digest("hex");
    return {
      sourceId: id,
      title,
      rawText,
      sourceHash,
      metadata,
    };
  }
}
