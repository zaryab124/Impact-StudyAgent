import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as getPunjabBoards } from "@/app/api/punjab/boards/route";
import { GET as getPunjabPolicies, POST as postPunjabPolicy } from "@/app/api/punjab/policies/route";
import { POST as syncPunjabPolicies } from "@/app/api/punjab/policies/sync/route";
import { GET as getPunjabBooks } from "@/app/api/punjab/books/route";
import { POST as syncPunjabBook } from "@/app/api/punjab/books/sync/route";
import { GET as getPunjabPatterns, POST as postPunjabPattern } from "@/app/api/punjab/patterns/route";
import { POST as generatePunjabPaper } from "@/app/api/punjab/papers/generate/route";

describe("Punjab BISE & PBCC API Routes Integration", () => {
  it("GET /api/punjab/boards should return all 9 Punjab BISE boards", async () => {
    const res = await getPunjabBoards();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.totalBoards).toBe(9);
    expect(json.boards.some((b: any) => b.code === "BISE_LHR")).toBe(true);
    expect(json.boards.some((b: any) => b.code === "BISE_RWP")).toBe(true);
    expect(json.boards.some((b: any) => b.code === "BISE_GRW")).toBe(true);
    expect(json.boards.some((b: any) => b.code === "BISE_FSD")).toBe(true);
    expect(json.boards.some((b: any) => b.code === "BISE_MUL")).toBe(true);
    expect(json.boards.some((b: any) => b.code === "BISE_SWL")).toBe(true);
    expect(json.boards.some((b: any) => b.code === "BISE_SGD")).toBe(true);
    expect(json.boards.some((b: any) => b.code === "BISE_BWP")).toBe(true);
    expect(json.boards.some((b: any) => b.code === "BISE_DGK")).toBe(true);
  });

  it("GET /api/punjab/policies should return PBCC policies with SLO distribution", async () => {
    const req = new NextRequest("http://localhost:3000/api/punjab/policies");
    const res = await getPunjabPolicies(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.count).toBeGreaterThanOrEqual(4);
    const slo = json.policies.find((p: any) => p.policyCode === "PBCC-SLO-2025");
    expect(slo).toBeDefined();
    expect(slo.parameters.sloDistribution.knowledge).toBe(50);
    expect(slo.parameters.sloDistribution.understanding).toBe(35);
    expect(slo.parameters.sloDistribution.application).toBe(15);
  });

  it("POST /api/punjab/policies/sync should trigger portal synchronization", async () => {
    const res = await syncPunjabPolicies();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.report.checkedBoards).toBe(9);
    expect(json.report.portalEndpoints.length).toBe(10);
  });

  it("GET /api/punjab/books should return PCTB catalog and vault status", async () => {
    const res = await getPunjabBooks();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.catalogCount).toBeGreaterThanOrEqual(4);
    expect(json.storageVault.vaultDirectory).toContain("storage-vault");
    expect(json.books.some((b: any) => b.code === "PCTB-PHY-09")).toBe(true);
  });

  it("POST /api/punjab/books/sync should persist textbook to storage vault", async () => {
    const req = new NextRequest("http://localhost:3000/api/punjab/books/sync", {
      method: "POST",
      body: JSON.stringify({ bookCode: "PCTB-PHY-09" }),
    });

    const res = await syncPunjabBook(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.result.vaultPath).toContain("pctb-phy-09-vault.json");
    expect(json.result.checksum).toBeDefined();
  });

  it("GET /api/punjab/patterns should return learned 60-mark science pattern", async () => {
    const req = new NextRequest("http://localhost:3000/api/punjab/patterns?boardCode=BISE_LHR&subjectCode=PHY-09");
    const res = await getPunjabPatterns(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.pattern.totalMarks).toBe(60);
    expect(json.pattern.sectionCount).toBe(3);
    expect(json.pattern.sections[0].totalMarks).toBe(12); // MCQs
    expect(json.pattern.sections[1].totalMarks).toBe(30); // SQs
    expect(json.pattern.sections[2].totalMarks).toBe(18); // LQs
  });

  it("POST /api/punjab/papers/generate should generate a frozen exam adhering to PBCC rules", async () => {
    const req = new NextRequest("http://localhost:3000/api/punjab/papers/generate", {
      method: "POST",
      body: JSON.stringify({
        boardCode: "BISE_LHR",
        subjectCode: "PHY-09",
        classLevel: 9,
      }),
    });

    const res = await generatePunjabPaper(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.paper.totalMarks).toBe(60);
    expect(json.paper.boardCode).toBe("BISE_LHR");
    expect(json.paper.isFrozen).toBe(true);
    expect(json.paper.sections).toHaveLength(3);
    expect(json.paper.bookSource.vaultPath).toContain("pctb-phy-09-vault.json");
  });
});
