/**
 * Synthetic PDF generator for Phase 3 Book Intelligence testing.
 * Generates valid multi-page PDF binary buffers compliant with PDF-1.4 specification.
 * Contains educational physics textbook content (Chapters, Topics, Definitions, Formulas,
 * Solved Examples, Exercises, Tables, Diagrams, and Student Learning Outcomes).
 */

export interface SyntheticChapterSpec {
  chapterNumber: number;
  title: string;
  pages: string[];
}

export function generatePdfFromPages(pagesText: string[]): Buffer {
  const objects: string[] = [];
  const byteOffsets: number[] = [];

  // Helper to add an object
  function addObject(content: string): number {
    const objIndex = objects.length + 1;
    objects.push(content);
    return objIndex;
  }

  // 1. Font object
  const fontObjIndex = 1;
  objects.push(`1 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);

  // We will collect page object indices
  const pageObjIndices: number[] = [];

  // Placeholder for catalog and pages dict: we'll define them first
  // Obj 2: Catalog
  // Obj 3: Pages parent
  const catalogObjIndex = 2;
  const pagesParentObjIndex = 3;

  objects.push(""); // Obj 2 placeholder
  objects.push(""); // Obj 3 placeholder

  // Now create Page and Content objects
  let currentObj = 4;
  for (const pageText of pagesText) {
    const pageObjNum = currentObj++;
    const contentObjNum = currentObj++;
    pageObjIndices.push(pageObjNum);

    // Escape text for PDF string literal
    const lines = pageText.split("\n");
    let streamBody = "BT\n/F1 12 Tf\n40 750 Td\n14 TL\n";
    for (const line of lines) {
      const escaped = line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
      streamBody += `(${escaped}) '\n`;
    }
    streamBody += "ET\n";

    const streamObj = `${contentObjNum} 0 obj\n<< /Length ${Buffer.byteLength(
      streamBody,
      "utf8"
    )} >>\nstream\n${streamBody}endstream\nendobj\n`;

    const pageObj = `${pageObjNum} 0 obj\n<< /Type /Page /Parent ${pagesParentObjIndex} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjIndex} 0 R >> >> /Contents ${contentObjNum} 0 R >>\nendobj\n`;

    objects.push(pageObj);
    objects.push(streamObj);
  }

  // Set Obj 2 (Catalog) and Obj 3 (Pages)
  objects[1] = `${catalogObjIndex} 0 obj\n<< /Type /Catalog /Pages ${pagesParentObjIndex} 0 R >>\nendobj\n`;
  objects[2] = `${pagesParentObjIndex} 0 obj\n<< /Type /Pages /Kids [${pageObjIndices
    .map((idx) => `${idx} 0 R`)
    .join(" ")}] /Count ${pageObjIndices.length} >>\nendobj\n`;

  // Assemble full PDF
  let header = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  let fullPdf = header;
  byteOffsets.push(0); // 0 is dummy for 0000000000 65535 f

  let currentOffset = Buffer.byteLength(header, "utf8");
  for (const obj of objects) {
    byteOffsets.push(currentOffset);
    fullPdf += obj;
    currentOffset += Buffer.byteLength(obj, "utf8");
  }

  const xrefOffset = currentOffset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    xref += `${String(byteOffsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjIndex} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  fullPdf += xref + trailer;

  return Buffer.from(fullPdf, "binary");
}

/**
 * Generates standard multi-chapter synthetic Physics textbook PDF for comprehensive test coverage.
 */
export function createSyntheticPhysicsTextbook(): Buffer {
  const page1 = `Physics Class 9 - Educational Textbook
Table of Contents
Chapter 1: Physical Quantities and Measurement
Chapter 2: Kinematics

SLO: Students will understand fundamental units and basic kinematics equations.
`;

  const page2 = `Chapter 1: Physical Quantities and Measurement
Topic 1.1: Physical Quantities
Definition: A physical quantity is any physical property that can be measured and quantified.

Table 1.1: SI Base Units
| Quantity | Unit Name | Symbol |
| Length   | Metre     | m      |
| Mass     | Kilogram  | kg     |
| Time     | Second    | s      |
`;

  const page3 = `Topic 1.2: Base and Derived Units
Definition: Base units are the units that are fundamentally defined, while derived units are formed by powers or products of base units.

Figure 1.1: Standard Platinum-Iridium Kilogram cylinder preserved at BIPM.
Exercise 1.1: List seven base quantities along with their SI units and symbols.
Exercise 1.2: What is the difference between base quantities and derived quantities?
`;

  const page4 = `Chapter 2: Kinematics
Topic 2.1: Rest and Motion
Definition: A body is said to be at rest if it does not change its position with respect to its surroundings.
Definition: Velocity is the rate of displacement of a body with respect to time.

Formula: Average velocity is given by v = s / t where v is velocity, s is displacement, and t is time elapsed.
`;

  const page5 = `Topic 2.2: Equations of Motion
Formula: First equation of motion: v = u + at where v is final velocity, u is initial velocity, a is acceleration, and t is time.
Formula: Second equation of motion: s = ut + 0.5 a t^2 where s is distance, u is initial velocity, a is acceleration, and t is time.

Example 2.1: A car accelerates uniformly from rest at 2 m/s^2 for 5 seconds. Calculate its final velocity.
Solution: Given u = 0 m/s, a = 2 m/s^2, t = 5 s. Using v = u + at, we obtain v = 0 + (2)(5) = 10 m/s.

Figure 2.1: Speed-time graph of a uniformly accelerating vehicle.
Exercise 2.1: Prove that v^2 - u^2 = 2as using algebraic motion equations.
Exercise 2.2: A train slows down from 20 m/s to rest in 10 seconds. Find the retardation.
`;

  return generatePdfFromPages([page1, page2, page3, page4, page5]);
}
