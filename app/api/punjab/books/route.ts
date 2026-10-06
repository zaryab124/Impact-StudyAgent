import { NextResponse } from "next/server";
import { PctbService } from "@/server/punjab/pctb-service";

export async function GET() {
  try {
    const catalog = PctbService.getCatalog();
    const vaultStatus = PctbService.getStorageVaultStatus();

    return NextResponse.json({
      success: true,
      catalogCount: catalog.length,
      storageVault: vaultStatus,
      books: catalog.map((b) => ({
        id: b.id,
        code: b.code,
        subjectCode: b.subjectCode,
        subjectName: b.subjectName,
        classLevel: b.classLevel,
        title: b.title,
        edition: b.edition,
        publisher: b.publisher,
        officialSourceUrl: b.officialSourceUrl,
        chaptersCount: b.chaptersCount,
        isPersistedInVault: vaultStatus.persistedBooks.some(
          (pb) => pb.bookCode.toUpperCase() === b.code.toUpperCase()
        ),
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve PCTB books" },
      { status: 500 }
    );
  }
}
