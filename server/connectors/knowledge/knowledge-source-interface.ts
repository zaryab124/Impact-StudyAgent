// ==============================================================================
// AI Live Paper Generator - Knowledge Source Connector Interface (Phase 10)
// Provider-Agnostic Knowledge Repository & NotebookLM Ingestion Abstraction
// ==============================================================================

export type ConnectorType = "NOTEBOOK_LM" | "LOCAL_DOCUMENT" | "AUTHORIZED_REPOSITORY";

export type ConnectionStatus = "CONNECTED" | "UNVERIFIED" | "OFFLINE" | "ERROR";

export interface ConnectorConfig {
  endpoint?: string;
  apiKey?: string;
  workspacePath?: string;
  sourceType: ConnectorType;
  options?: Record<string, unknown>;
}

export interface KnowledgeSourceItem {
  id: string;
  title: string;
  authorOrPublisher?: string;
  subject?: string;
  classLevel?: number;
  mimeType: string;
  sourceHash?: string; // SHA-256
  lastModified?: string;
  provenanceDetails: {
    sourceUrl?: string;
    verified: boolean;
    license?: string;
  };
}

export interface SourceDocumentPayload {
  sourceId: string;
  title: string;
  rawText: string;
  sections?: Array<{
    heading: string;
    level: number;
    content: string;
    pageNumber?: number;
  }>;
  sourceHash: string;
  metadata: Record<string, unknown>;
}

export interface KnowledgeSyncResult {
  connectorId: string;
  totalRequested: number;
  syncedCount: number;
  skippedCount: number;
  failedCount: number;
  items: Array<{
    sourceId: string;
    title: string;
    status: "SYNCED" | "SKIPPED" | "FAILED";
    documentHash: string;
    errorMessage?: string;
  }>;
}

export interface IKnowledgeSourceConnector {
  readonly connectorId: string;
  readonly name: string;
  readonly type: ConnectorType;

  connect(config: ConnectorConfig): Promise<{ status: ConnectionStatus; message: string }>;
  listSources(filter?: { subject?: string; search?: string }): Promise<KnowledgeSourceItem[]>;
  fetchDocumentContent(sourceId: string): Promise<SourceDocumentPayload>;
  sync(sourceIds: string[]): Promise<KnowledgeSyncResult>;
}
