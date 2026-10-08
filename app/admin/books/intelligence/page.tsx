"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  Layers,
  Sparkles,
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowLeft,
  ChevronRight,
  Database,
  Hash,
  Eye,
  Tag,
  ShieldCheck,
  FileCheck,
  Binary,
} from "lucide-react";
import { DocumentQualityReport, DocumentStatus, ElementType, ChunkType, KnowledgeSearchResult } from "@/types/knowledge";

export default function BookIntelligencePage() {
  const [books, setBooks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [autoProcess, setAutoProcess] = useState<boolean>(true);
  const [uploadProgress, setUploadProgress] = useState<string>("");


  // Elements Browser State
  const [elements, setElements] = useState<any[]>([]);
  const [selectedElementType, setSelectedElementType] = useState<string>("ALL");
  const [loadingElements, setLoadingElements] = useState(false);

  // Search Sandbox State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchChunkType, setSearchChunkType] = useState<string>("");
  const [searchMinScore, setSearchMinScore] = useState<number>(0.3);
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Fetch initial books & documents
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [booksRes, docsRes] = await Promise.all([
        fetch("/api/books").then((r) => r.json()),
        fetch("/api/documents").then((r) => r.json()),
      ]);

      if (booksRes.data?.books) {
        setBooks(booksRes.data.books);
        if (booksRes.data.books.length > 0 && !selectedBookId) {
          setSelectedBookId(booksRes.data.books[0].id);
        }
      }

      if (docsRes.data?.documents) {
        setDocuments(docsRes.data.documents);
        if (docsRes.data.documents.length > 0 && !selectedDocId) {
          setSelectedDocId(docsRes.data.documents[0].id);
        }
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: `Failed to load initial data: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch full document details when selectedDocId changes
  useEffect(() => {
    if (!selectedDocId) {
      setActiveDoc(null);
      setElements([]);
      return;
    }

    const fetchDocDetails = async () => {
      try {
        const res = await fetch(`/api/documents/${selectedDocId}`);
        const data = await res.json();
        if (res.ok && data.data) {
          setActiveDoc(data.data);
          loadDocumentElements(selectedDocId, selectedElementType);
        }
      } catch (err: any) {
        console.error("Failed to fetch document details:", err);
      }
    };

    fetchDocDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocId]);

  // Fetch elements for active document
  const loadDocumentElements = async (docId: string, type: string) => {
    setLoadingElements(true);
    try {
      const url = type === "ALL" 
        ? `/api/documents/${docId}/elements?limit=100` 
        : `/api/documents/${docId}/elements?type=${type}&limit=100`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.data?.elements) {
        setElements(data.data.elements);
      }
    } catch (err: any) {
      console.error("Failed to load elements:", err);
    } finally {
      setLoadingElements(false);
    }
  };

  const handleElementTypeFilter = (type: string) => {
    setSelectedElementType(type);
    if (selectedDocId) {
      loadDocumentElements(selectedDocId, type);
    }
  };

  // Upload handler with automatic chunking for files > 4MB (bypasses Vercel 4.5MB limit)
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setFeedback({ type: "error", message: "Please select a textbook PDF file to upload." });
      return;
    }
    if (!selectedBookId) {
      setFeedback({ type: "error", message: "Please select a target book for this textbook." });
      return;
    }

    setUploading(true);
    setFeedback(null);
    setUploadProgress("");

    try {
      const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB per chunk (safely under Vercel 4.5MB serverless limit)
      let finalData: any = null;

      if (uploadFile.size > CHUNK_SIZE) {
        // Chunked upload pipeline
        const totalChunks = Math.ceil(uploadFile.size / CHUNK_SIZE);
        const uploadId = `upl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const start = chunkIndex * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, uploadFile.size);
          const chunkBlob = uploadFile.slice(start, end);

          const pct = Math.round(((chunkIndex + 1) / totalChunks) * 100);
          setUploadProgress(`Uploading chunk ${chunkIndex + 1} of ${totalChunks} (${pct}%)...`);

          const formData = new FormData();
          formData.append("chunk", chunkBlob, uploadFile.name);
          formData.append("uploadId", uploadId);
          formData.append("chunkIndex", chunkIndex.toString());
          formData.append("totalChunks", totalChunks.toString());
          formData.append("fileName", uploadFile.name);
          formData.append("bookId", selectedBookId);
          formData.append("autoProcess", autoProcess ? "true" : "false");

          const res = await fetch("/api/documents/upload-chunk", {
            method: "POST",
            body: formData,
          });

          let chunkResData: any;
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            chunkResData = await res.json();
          } else {
            const textErr = await res.text();
            throw new Error(`Server returned HTTP ${res.status}: ${textErr.substring(0, 150)}`);
          }

          if (!res.ok) {
            throw new Error(chunkResData?.error?.message || `Failed to upload chunk ${chunkIndex + 1}.`);
          }

          if (chunkResData.data?.completed) {
            finalData = chunkResData.data;
          }
        }
      } else {
        // Direct upload for small files <= 3MB
        setUploadProgress("Uploading textbook...");
        const formData = new FormData();
        formData.append("file", uploadFile);
        formData.append("bookId", selectedBookId);
        formData.append("autoProcess", autoProcess ? "true" : "false");

        const res = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        let data: any;
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          data = await res.json();
        } else {
          const rawText = await res.text();
          if (res.status === 413) {
            throw new Error("File exceeds server payload limits (HTTP 413). Please try again using chunked upload.");
          }
          throw new Error(`Server returned HTTP ${res.status}: ${rawText.substring(0, 150)}`);
        }

        if (!res.ok) {
          throw new Error(data.error?.message || "Failed to upload document.");
        }
        finalData = data.data;
      }

      setFeedback({
        type: "success",
        message: `Textbook "${uploadFile.name}" ingested successfully! Status: ${finalData?.status || "REGISTERED"}`,
      });

      setUploadFile(null);
      setUploadProgress("");

      // Reload document list
      const updatedDocsRes = await fetch("/api/documents").then((r) => r.json());
      if (updatedDocsRes.data?.documents) {
        setDocuments(updatedDocsRes.data.documents);
        if (finalData?.id) {
          setSelectedDocId(finalData.id);
        }
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
      setUploadProgress("");
    } finally {
      setUploading(false);
    }
  };


  // Trigger processing pipeline
  const handleTriggerProcess = async (docId: string) => {
    setProcessing(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/documents/${docId}/process`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Processing failed.");

      setFeedback({
        type: "success",
        message: `Pipeline finished! Status: ${data.data.status}. Provenance coverage: ${data.data.qualityReport?.provenanceCoveragePct || 100}%`,
      });

      // Refresh active doc
      const docRes = await fetch(`/api/documents/${docId}`).then((r) => r.json());
      if (docRes.data) setActiveDoc(docRes.data);
      loadDocumentElements(docId, selectedElementType);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setProcessing(false);
    }
  };

  // Search sandbox execution
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchResults([]);
    try {
      const payload: any = {
        queryText: searchQuery,
        minScore: searchMinScore,
        limit: 10,
      };
      if (searchChunkType) payload.chunkType = searchChunkType;
      if (selectedDocId && activeDoc?.bookId) payload.bookId = activeDoc.bookId;

      const res = await fetch("/api/knowledge/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Retrieval search failed");
      setSearchResults(data.data?.results || []);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSearching(false);
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case "COMPLETED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</span>;
      case "COMPLETED_WITH_WARNINGS":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300"><AlertTriangle className="w-3.5 h-3.5" /> Completed (Warnings)</span>;
      case "FAILED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300"><AlertCircle className="w-3.5 h-3.5" /> Failed</span>;
      case "UPLOADED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300"><Clock className="w-3.5 h-3.5" /> Uploaded</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> {status}</span>;
    }
  };

  const stages = ["UPLOADED", "VALIDATING", "EXTRACTING", "STRUCTURING", "CHUNKING", "EMBEDDING", "COMPLETED"];
  const currentStageIndex = activeDoc ? stages.indexOf(activeDoc.status) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Education Foundation
            </Link>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow">
                <BookOpen className="w-4 h-4" />
              </div>
              <h1 className="text-lg font-bold text-slate-800">Book Intelligence & Knowledge Ingestion</h1>
            </div>
          </div>
          <button
            onClick={loadInitialData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl flex items-start gap-3 border shadow-sm ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : feedback.type === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {feedback.type === "success" && <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            {feedback.type === "warning" && <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            {feedback.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <div className="text-sm font-medium">{feedback.message}</div>
          </div>
        )}

        {/* Section 1: Ingestion & Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Card */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-800">Ingest Textbook PDF</h2>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Upload authorized textbook PDFs. The engine calculates SHA-256 hashes, validates PDF magic bytes (%PDF-), extracts pages, and derives structured knowledge.
              </p>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Book Entity
                  </label>
                  <select
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Select Book --</option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.subject?.name || "Subject"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Textbook File (.pdf)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    required
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {uploadFile && (
                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{(uploadFile.size / 1024 / 1024).toFixed(2)} MB • {uploadFile.name}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="autoProcessCheck"
                    checked={autoProcess}
                    onChange={(e) => setAutoProcess(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="autoProcessCheck" className="text-xs text-slate-600 select-none">
                    Automatically trigger Book Intelligence pipeline
                  </label>
                </div>

                {uploadProgress && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700 font-semibold flex items-center gap-2 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" />
                    <span>{uploadProgress}</span>
                  </div>
                )}

                <button

                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="w-full mt-4 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Ingesting & Validating...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Upload & Ingest Textbook
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Duplicate detection active: Identical SHA-256 hashes are automatically rejected.</span>
            </div>
          </div>

          {/* Ingested Documents List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-800">Ingested Educational Documents</h2>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                  {documents.length} Total
                </span>
              </div>

              {documents.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-medium">No textbooks ingested yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Upload a PDF textbook to initiate extraction.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {documents.map((doc) => {
                    const isSelected = doc.id === selectedDocId;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDocId(doc.id)}
                        className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-indigo-50/70 border border-indigo-200 text-indigo-950"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold flex items-center gap-2">
                              {doc.fileName}
                              {getStatusBadge(doc.status)}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Book: <span className="font-semibold">{doc.bookTitle}</span> • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {doc.pageCount} Pages • {doc.totalChunks} Chunks
                            </div>
                          </div>
                        </div>

                        <ChevronRight className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-slate-300"}`} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {activeDoc && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>SHA-256: {activeDoc.checksum?.slice(0, 16)}...</span>
                </div>
                {activeDoc.status !== "COMPLETED" && (
                  <button
                    onClick={() => handleTriggerProcess(activeDoc.id)}
                    disabled={processing}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${processing ? "animate-spin" : ""}`} />
                    {processing ? "Processing Pipeline..." : "Process / Retry Document"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Pipeline Visual Stepper & Quality Report */}
        {activeDoc && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Pipeline Status & Quality Validation Report
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Document: <span className="font-semibold text-slate-700">{activeDoc.fileName}</span> ({activeDoc.bookTitle})
                </p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(activeDoc.status)}
                <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  Provenance: {activeDoc.qualityReport?.provenanceCoveragePct || 100}%
                </span>
              </div>
            </div>

            {/* Pipeline Stage Tracker */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Pipeline Lifecycle Stages
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                {[
                  { name: "VALIDATING", label: "1. Validation", desc: "Magic Bytes & SHA-256" },
                  { name: "EXTRACTING", label: "2. Extraction", desc: "Page-by-Page Parser" },
                  { name: "STRUCTURING", label: "3. Structure", desc: "Chapters & Topics" },
                  { name: "CHUNKING", label: "4. Semantic Chunks", desc: "Pedagogical Blocks" },
                  { name: "EMBEDDING", label: "5. Embeddings", desc: "768-dim text-embedding-004" },
                  { name: "COMPLETED", label: "6. Verified", desc: "Provenance Quality" },
                ].map((st, idx) => {
                  const isDone = activeDoc.status === "COMPLETED" || (activeDoc.qualityReport && idx < 5);
                  const isCurrent = activeDoc.status === st.name;
                  return (
                    <div
                      key={st.name}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isCurrent
                          ? "bg-indigo-50 border-indigo-400 text-indigo-900 ring-2 ring-indigo-200"
                          : isDone
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                      }`}
                    >
                      <div className="text-xs font-bold">{st.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{st.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quality Report Metrics Cards */}
            {activeDoc.qualityReport && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-lg font-black text-slate-800">{activeDoc.qualityReport.totalPages}</div>
                  <div className="text-[11px] font-medium text-slate-500">Total Pages</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-lg font-black text-indigo-600">{activeDoc.qualityReport.chaptersDetected}</div>
                  <div className="text-[11px] font-medium text-slate-500">Chapters</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-lg font-black text-indigo-600">{activeDoc.qualityReport.topicsDetected}</div>
                  <div className="text-[11px] font-medium text-slate-500">Topics</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-lg font-black text-emerald-600">{activeDoc.qualityReport.elements?.definitions || 0}</div>
                  <div className="text-[11px] font-medium text-slate-500">Definitions</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-lg font-black text-purple-600">{activeDoc.qualityReport.elements?.formulas || 0}</div>
                  <div className="text-[11px] font-medium text-slate-500">Formulas</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-lg font-black text-amber-600">{activeDoc.qualityReport.elements?.exercises || 0}</div>
                  <div className="text-[11px] font-medium text-slate-500">Exercises</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-lg font-black text-blue-600">{activeDoc.qualityReport.totalChunks}</div>
                  <div className="text-[11px] font-medium text-slate-500">Chunks & Vectors</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 3: Educational Elements Explorer */}
        {activeDoc && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800">Pedagogical Elements Explorer</h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {["ALL", "DEFINITION", "FORMULA", "EXAMPLE", "EXERCISE", "TABLE", "DIAGRAM", "SLO"].map((t) => (
                  <button
                    key={t}
                    onClick={() => handleElementTypeFilter(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      selectedElementType === t
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {loadingElements ? (
              <div className="p-8 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                <p className="text-xs">Loading structured educational elements...</p>
              </div>
            ) : elements.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                <Layers className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">No elements found for type &quot;{selectedElementType}&quot;.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1">
                {elements.map((el) => (
                  <div key={el.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-300 transition-all shadow-sm space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 tracking-wide uppercase mr-2">
                          {el.type}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{el.title || "Educational Element"}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full flex-shrink-0">
                        Page {el.pageNumber}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] leading-relaxed">
                      {el.sourceText}
                    </div>

                    {el.isAiDerived && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>AI-Derived Visual Description: Preserves original textbook primacy.</span>
                      </div>
                    )}

                    {el.type === "FORMULA" && el.content?.expression && (
                      <div className="text-xs text-indigo-800 bg-indigo-50 p-2 rounded-lg font-mono">
                        Equation: <span className="font-bold">{el.content.expression}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 4: Knowledge Retrieval & Provenance Sandbox */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-800">Interactive Knowledge Retrieval Sandbox</h3>
          </div>
          <p className="text-xs text-slate-500">
            Query the vector store with hybrid semantic and metadata filtering. Every returned chunk strictly includes full source provenance (Document, Book, Chapter, Topic, Page, and Source Text).
          </p>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask or search textbook knowledge (e.g. 'What is the definition of velocity?' or 'equations of motion')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition-colors flex items-center gap-2"
              >
                {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <label className="block font-semibold mb-1">Filter by Chunk Type (Optional)</label>
                <select
                  value={searchChunkType}
                  onChange={(e) => setSearchChunkType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                >
                  <option value="">All Chunk Types</option>
                  <option value="DEFINITION">Definition</option>
                  <option value="FORMULA">Formula</option>
                  <option value="CONCEPT">Concept</option>
                  <option value="EXAMPLE">Example</option>
                  <option value="EXERCISE">Exercise</option>
                  <option value="TABLE">Table</option>
                  <option value="DIAGRAM">Diagram</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Minimum Similarity Score: {searchMinScore}</label>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={searchMinScore}
                  onChange={(e) => setSearchMinScore(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </form>

          {/* Search Results Display */}
          {searchResults.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Retrieved Results ({searchResults.length}) with Provenance
              </div>

              <div className="space-y-3">
                {searchResults.map((r, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{r.heading || `Result #${idx + 1}`}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                          {r.chunkType}
                        </span>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                        Score: {(r.similarityScore * 100).toFixed(1)}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">{r.content}</p>

                    {/* Strict Provenance Trace Inspector */}
                    <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-500 space-y-1">
                      <div className="font-bold text-slate-700 flex items-center gap-1.5 mb-1 text-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Source Provenance Verification Trace:</span>
                      </div>
                      <div>• <span className="font-semibold text-slate-600">Textbook Document:</span> {r.provenance.documentName}</div>
                      <div>• <span className="font-semibold text-slate-600">Book Title:</span> {r.provenance.bookTitle}</div>
                      <div>• <span className="font-semibold text-slate-600">Chapter:</span> {r.provenance.chapterTitle ? `Chapter ${r.provenance.chapterNumber}: ${r.provenance.chapterTitle}` : "General Content"}</div>
                      <div>• <span className="font-semibold text-slate-600">Topic:</span> {r.provenance.topicTitle ? `${r.provenance.topicCode || ""} ${r.provenance.topicTitle}` : "Section Concept"}</div>
                      <div>• <span className="font-semibold text-slate-600">Physical Page:</span> Page {r.provenance.pageNumber}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
