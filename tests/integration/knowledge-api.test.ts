import { describe, it, expect, vi } from "vitest";
import { GET as getDocuments } from "@/app/api/documents/route";
import { POST as uploadDocument } from "@/app/api/documents/upload/route";
import { GET as getDocumentById } from "@/app/api/documents/[id]/route";
import { POST as searchKnowledge } from "@/app/api/knowledge/search/route";
import { GET as getChunkProvenance } from "@/app/api/knowledge/chunk/[id]/route";
import { prisma } from "@/lib/db";
import { KnowledgeRetrievalService } from "@/server/book-intelligence/retrieval-service";
import { NextRequest } from "next/server";

describe("Phase 3: Book Intelligence API Routes Integration", () => {
  it("GET /api/documents should return success with list of documents", async () => {
    vi.spyOn(prisma.document, "count").mockResolvedValue(1);
    vi.spyOn(prisma.document, "findMany").mockResolvedValue([
      {
        id: "doc-1",
        bookId: "book-1",
        fileName: "Physics_Grade9.pdf",
        fileSize: BigInt(1048576),
        mimeType: "application/pdf",
        checksum: "abc123sha256hash",
        status: "COMPLETED",
        pageCount: 5,
        qualityReport: null,
        errorMessage: null,
        createdAt: new Date("2026-09-25T12:00:00Z"),
        updatedAt: new Date("2026-09-25T12:00:00Z"),
        book: {
          id: "book-1",
          title: "Physics Textbook Grade 9",
          subject: {
            id: "subj-1",
            name: "Physics",
            class: { id: "cls-1", name: "Class 9" },
          },
        },
        _count: { pages: 5, chunks: 20, elements: 15 },
      } as any,
    ]);

    const req = new NextRequest("http://localhost:3000/api/documents");
    const res = await getDocuments(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.total).toBe(1);
    expect(json.data.documents[0].fileName).toBe("Physics_Grade9.pdf");
    expect(typeof json.data.documents[0].fileSize).toBe("number");
  });

  it("POST /api/documents/upload should reject request with missing file", async () => {
    const formData = new FormData();
    formData.append("bookId", "book-123");

    const req = new NextRequest("http://localhost:3000/api/documents/upload", {
      method: "POST",
      body: formData,
    });

    const res = await uploadDocument(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("MISSING_FILE");
  });

  it("POST /api/documents/upload should reject request with missing bookId", async () => {
    const formData = new FormData();
    const fakeFile = new File(["%PDF-1.4 sample"], "sample.pdf", { type: "application/pdf" });
    formData.append("file", fakeFile);

    const req = new NextRequest("http://localhost:3000/api/documents/upload", {
      method: "POST",
      body: formData,
    });

    const res = await uploadDocument(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("MISSING_BOOK_ID");
  });

  it("GET /api/documents/[id] should return 404 for nonexistent document", async () => {
    vi.spyOn(prisma.document, "findUnique").mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/documents/non-existent-id");
    const res = await getDocumentById(req, { params: Promise.resolve({ id: "non-existent-id" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("DOCUMENT_NOT_FOUND");
  });

  it("POST /api/knowledge/search should reject empty query text with 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/knowledge/search", {
      method: "POST",
      body: JSON.stringify({ queryText: "" }),
    });

    const res = await searchKnowledge(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/knowledge/search should execute search and return strict provenance metadata", async () => {
    vi.spyOn(KnowledgeRetrievalService, "searchKnowledge").mockResolvedValue([
      {
        chunkId: "chk-123",
        content: "Velocity is the rate of displacement of a body.",
        heading: "Definition: Velocity",
        chunkType: "DEFINITION",
        similarityScore: 0.94,
        provenance: {
          documentId: "doc-1",
          documentName: "Physics_Grade9.pdf",
          bookId: "book-1",
          bookTitle: "Physics Textbook Grade 9",
          chapterId: "ch-2",
          chapterNumber: 2,
          chapterTitle: "Kinematics",
          topicId: "top-2-1",
          topicCode: "2.1",
          topicTitle: "Rest and Motion",
          pageNumber: 4,
          chunkId: "chk-123",
          chunkType: "DEFINITION",
          sourceTextExcerpt: "Velocity is the rate of displacement of a body.",
          confidence: 0.95,
        },
      },
    ]);

    const req = new NextRequest("http://localhost:3000/api/knowledge/search", {
      method: "POST",
      body: JSON.stringify({
        queryText: "What is velocity?",
        minScore: 0.3,
        limit: 5,
      }),
    });

    const res = await searchKnowledge(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.totalResults).toBe(1);
    const first = json.data.results[0];
    expect(first.chunkId).toBe("chk-123");
    // Verify provenance fields are all present
    expect(first.provenance).toBeDefined();
    expect(first.provenance.documentName).toBe("Physics_Grade9.pdf");
    expect(first.provenance.pageNumber).toBe(4);
    expect(first.provenance.chapterTitle).toBe("Kinematics");
    expect(first.provenance.topicCode).toBe("2.1");
  });

  it("GET /api/knowledge/chunk/[id] should return 404 for unknown chunk", async () => {
    vi.spyOn(KnowledgeRetrievalService, "getChunkProvenance").mockRejectedValue(
      new Error("Knowledge chunk with ID \"unknown-chunk\" not found.")
    );

    const req = new NextRequest("http://localhost:3000/api/knowledge/chunk/unknown-chunk");
    const res = await getChunkProvenance(req, {
      params: Promise.resolve({ id: "unknown-chunk" }),
    });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("PROVENANCE_ERROR");
  });
});
