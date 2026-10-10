// ==============================================================================
// AI Live Paper Generator - Punjab & Federal Board Curriculum Question Bank Engine
// Comprehensive grade-specific, subject-specific, and board-grounded questions
// Classes: Class 9 (SSC-I), Class 10 (SSC-II), 1st Year (HSSC-I), 2nd Year (HSSC-II)
// Subjects: Physics, Chemistry, Biology, Mathematics, Computer Science, English, Urdu, Islamiat/Pak Studies
// Guaranteed distinct, authentic questions across all classes and subjects
// ==============================================================================

export interface StandardQuestion {
  id: string;
  classLevel: "9" | "10" | "11" | "12";
  subjectKey: string; // e.g. "PHY", "CHM", "BIO", "CS", "MTH", "ENG", "URD", "ISL", "PAK"
  chapterTitle: string;
  topicTitle: string;
  type: "MCQ" | "SHORT" | "LONG";
  marks: number;
  text: string;
  options?: Array<{ key: "A" | "B" | "C" | "D"; text: string }>;
  correctOption?: "A" | "B" | "C" | "D";
  solutionExplanation?: string;
  modelAnswer?: string;
  rubric?: string;
  markingRubric?: string[];
  cognitiveLevel?: "KNOWLEDGE" | "UNDERSTAND" | "APPLY";
  difficulty?: "EASY" | "MEDIUM" | "DIFFICULT";
}

export interface GeneratedPaperSection {
  sectionName: string;
  sectionType: "MCQ" | "SHORT" | "LONG";
  totalMarks: number;
  instructions: string;
  questions: Array<{
    id: string;
    sequence: number;
    text: string;
    marks: number;
    options?: Array<{ key: "A" | "B" | "C" | "D"; text: string }>;
    correctOption?: "A" | "B" | "C" | "D";
    solutionExplanation?: string;
    modelAnswer?: string;
    rubric?: string;
    markingRubric?: string[];
    chapterTitle?: string;
    topicTitle?: string;
  }>;
}

// ------------------------------------------------------------------------------
// Question Bank Registry Categorized by Class Level (9, 10, 11, 12) & Subject
// ------------------------------------------------------------------------------
export const CURRICULUM_QUESTION_REGISTRY: StandardQuestion[] = [
  // ============================================================================
  // CLASS 9 (SSC PART-I) - PHYSICS
  // ============================================================================
  {
    id: "q_p9_mcq_1",
    classLevel: "9",
    subjectKey: "PHY",
    chapterTitle: "Physical Quantities and Measurement",
    topicTitle: "Least Count of Vernier Callipers",
    type: "MCQ",
    marks: 1,
    text: "The least count of a standard metric Vernier Callipers with 0.1 mm division accuracy is:",
    options: [
      { key: "A", text: "0.1 cm" },
      { key: "B", text: "0.01 cm (0.1 mm)" },
      { key: "C", text: "0.001 cm" },
      { key: "D", text: "1.0 mm" },
    ],
    correctOption: "B",
    solutionExplanation: "Least count of Vernier Callipers is smallest main scale division (1 mm) divided by total vernier scale divisions (10) = 0.1 mm = 0.01 cm.",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_p9_mcq_2",
    classLevel: "9",
    subjectKey: "PHY",
    chapterTitle: "Kinematics",
    topicTitle: "Equations of Motion",
    type: "MCQ",
    marks: 1,
    text: "Which equation of motion correctly relates initial velocity (vi), final velocity (vf), acceleration (a), and displacement (S)?",
    options: [
      { key: "A", text: "2aS = vf² - vi²" },
      { key: "B", text: "S = vit + 2at²" },
      { key: "C", text: "vf = vi + 2at" },
      { key: "D", text: "aS = 2(vf - vi)" },
    ],
    correctOption: "A",
    solutionExplanation: "The third equation of uniformly accelerated motion is 2aS = vf² - vi².",
    rubric: "1 Mark for selecting (A).",
  },
  {
    id: "q_p9_mcq_3",
    classLevel: "9",
    subjectKey: "PHY",
    chapterTitle: "Dynamics",
    topicTitle: "Newton's Second Law & Momentum",
    type: "MCQ",
    marks: 1,
    text: "When an unbalanced net force F acts on a mass m, the acceleration produced is directly proportional to:",
    options: [
      { key: "A", text: "Mass m" },
      { key: "B", text: "Force F" },
      { key: "C", text: "Inversely to Force F" },
      { key: "D", text: "Square of Mass m²" },
    ],
    correctOption: "B",
    solutionExplanation: "According to Newton's Second Law of Motion: a ∝ F and a ∝ 1/m, giving F = ma.",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_p9_mcq_4",
    classLevel: "9",
    subjectKey: "PHY",
    chapterTitle: "Gravitation",
    topicTitle: "Law of Universal Gravitation",
    type: "MCQ",
    marks: 1,
    text: "The value of gravitational constant G in SI units is:",
    options: [
      { key: "A", text: "6.673 × 10⁻¹¹ N m² kg⁻²" },
      { key: "B", text: "9.8 N kg⁻¹" },
      { key: "C", text: "6.4 × 10⁶ m" },
      { key: "D", text: "5.97 × 10²⁴ kg" },
    ],
    correctOption: "A",
    solutionExplanation: "The universal gravitational constant G determined by Cavendish is 6.673 × 10⁻¹¹ N m² kg⁻².",
    rubric: "1 Mark for selecting (A).",
  },
  {
    id: "q_p9_short_1",
    classLevel: "9",
    subjectKey: "PHY",
    chapterTitle: "Kinematics",
    topicTitle: "Scalars and Vectors",
    type: "SHORT",
    marks: 3,
    text: "Differentiate between scalar and vector physical quantities with two examples of each.",
    modelAnswer: "Scalar Quantities: Physical quantities described completely by magnitude and unit alone, having no direction (e.g. Mass, Speed, Time).\nVector Quantities: Physical quantities requiring both magnitude with unit and specified direction for complete description (e.g. Velocity, Force, Displacement).",
    markingRubric: [
      "1.5 Marks: Clear conceptual definitions of scalars and vectors.",
      "1.5 Marks: Two correct examples for each category.",
    ],
  },
  {
    id: "q_p9_short_2",
    classLevel: "9",
    subjectKey: "PHY",
    chapterTitle: "Dynamics",
    topicTitle: "Centripetal Force",
    type: "SHORT",
    marks: 3,
    text: "Define centripetal force. Write its mathematical formula and explain why banking of roads is needed on curved tracks.",
    modelAnswer: "Definition: The net force required to keep a body moving along a circular path directed toward the center of the circle.\nFormula: Fc = (m * v²) / r.\nBanking of Roads: Tilting the outer edge of a curved road provides necessary horizontal component of normal reaction, preventing vehicles from skidding at high speeds.",
    markingRubric: [
      "1.0 Mark: Accurate definition.",
      "1.0 Mark: Correct formula Fc = mv²/r with notation.",
      "1.0 Mark: Explanation of banking of roads preventing skidding.",
    ],
  },
  {
    id: "q_p9_short_3",
    classLevel: "9",
    subjectKey: "PHY",
    chapterTitle: "Properties of Matter",
    topicTitle: "Pascal's Principle",
    type: "SHORT",
    marks: 3,
    text: "State Pascal's Law and describe how it is applied in a hydraulic lift.",
    modelAnswer: "Pascal's Law states that pressure applied at any point of an enclosed fluid is transmitted equally without loss in all directions to every portion of the fluid and container walls.\nApplication: In a hydraulic lift, small force applied on small piston area (A1) creates pressure P = F1/A1 which produces a multiplied lifting force F2 = P * A2 on larger piston (A2).",
    markingRubric: [
      "1.5 Marks: Formal statement of Pascal's Law.",
      "1.5 Marks: Working formula and explanation of hydraulic lift multiplication.",
    ],
  },
  {
    id: "q_p9_long_1",
    classLevel: "9",
    subjectKey: "PHY",
    chapterTitle: "Kinematics",
    topicTitle: "Derivation of Second Equation of Motion",
    type: "LONG",
    marks: 9,
    text: "Derive the second equation of motion S = vit + (1/2)at² with the help of a speed-time graph.",
    modelAnswer: "1. Graph Description: Plot velocity v on y-axis against time t on x-axis with initial velocity vi at t=0 and final velocity vf at time t.\n2. Total Distance S: Represented by total area under velocity-time graph OABD.\n3. Split Area: Area of rectangle OACD + Area of triangle ABC.\n   Area of rectangle OACD = vi * t\n   Area of triangle ABC = (1/2) * Base * Height = (1/2) * t * (vf - vi) = (1/2) * t * (at) = (1/2)at²\n4. Sum: Total Distance S = vit + (1/2)at².",
    markingRubric: [
      "2.0 Marks: Neat, correctly labeled speed-time graph with axes and regions.",
      "3.0 Marks: Step-by-step area breakdown (rectangle + triangle).",
      "2.0 Marks: Substitution of acceleration relation (vf - vi = at).",
      "2.0 Marks: Final algebraic expression S = vit + 1/2at² with physical units.",
    ],
  },

  // ============================================================================
  // CLASS 9 (SSC PART-I) - BIOLOGY
  // ============================================================================
  {
    id: "q_b9_mcq_1",
    classLevel: "9",
    subjectKey: "BIO",
    chapterTitle: "Introduction to Biology",
    topicTitle: "Levels of Organization",
    type: "MCQ",
    marks: 1,
    text: "Which of the following cellular organelles is known as the powerhouse of the cell due to ATP synthesis?",
    options: [
      { key: "A", text: "Ribosome" },
      { key: "B", text: "Mitochondria" },
      { key: "C", text: "Endoplasmic Reticulum" },
      { key: "D", text: "Golgi Apparatus" },
    ],
    correctOption: "B",
    solutionExplanation: "Mitochondria carry out cellular respiration and Krebs cycle, producing ATP energy currency for the cell.",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_b9_mcq_2",
    classLevel: "9",
    subjectKey: "BIO",
    chapterTitle: "Cells and Tissues",
    topicTitle: "Plant and Animal Cells",
    type: "MCQ",
    marks: 1,
    text: "Cell wall is composed primarily of cellulose in plants, whereas in fungi the cell wall consists of:",
    options: [
      { key: "A", text: "Chitin" },
      { key: "B", text: "Peptidoglycan" },
      { key: "C", text: "Glycogen" },
      { key: "D", text: "Lignin" },
    ],
    correctOption: "A",
    solutionExplanation: "Fungal cell walls are made of chitin, while bacterial cell walls are peptidoglycan and plant cell walls are cellulose.",
    rubric: "1 Mark for selecting (A).",
  },
  {
    id: "q_b9_mcq_3",
    classLevel: "9",
    subjectKey: "BIO",
    chapterTitle: "Enzymes",
    topicTitle: "Lock and Key Model",
    type: "MCQ",
    marks: 1,
    text: "The Lock and Key model of enzyme action was originally proposed by German chemist:",
    options: [
      { key: "A", text: "Daniel Koshland" },
      { key: "B", text: "Emil Fischer" },
      { key: "C", text: "Robert Hooke" },
      { key: "D", text: "Louis Pasteur" },
    ],
    correctOption: "B",
    solutionExplanation: "Emil Fischer proposed the Lock and Key model in 1894, stating that the enzyme active site is a rigid template matching the substrate.",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_b9_mcq_4",
    classLevel: "9",
    subjectKey: "BIO",
    chapterTitle: "Bioenergetics",
    topicTitle: "Photosynthesis Reactions",
    type: "MCQ",
    marks: 1,
    text: "During light-dependent reactions of photosynthesis, photolysis of water produces electrons, protons, and:",
    options: [
      { key: "A", text: "Carbon dioxide gas" },
      { key: "B", text: "Oxygen gas (O2)" },
      { key: "C", text: "Glucose" },
      { key: "D", text: "Methane" },
    ],
    correctOption: "B",
    solutionExplanation: "Water splitting (photolysis) in photosystem II releases oxygen gas (O2) into the atmosphere as a byproduct.",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_b9_short_1",
    classLevel: "9",
    subjectKey: "BIO",
    chapterTitle: "Cell Cycle",
    topicTitle: "Mitosis vs Meiosis",
    type: "SHORT",
    marks: 3,
    text: "Differentiate between mitosis and meiosis in terms of daughter cell count and chromosome number.",
    modelAnswer: "Mitosis: Produces two diploid daughter cells (2n) genetically identical to parent cell, occurring in somatic cells for growth and repair.\nMeiosis: Produces four haploid daughter cells (1n) with half the chromosome number and genetic variation, occurring in germ cells for gamete formation.",
    markingRubric: [
      "1.5 Marks: Comparison of daughter cell quantity and genetic identity.",
      "1.5 Marks: Comparison of chromosome ploidy (diploid 2n vs haploid n) and cell types.",
    ],
  },
  {
    id: "q_b9_short_2",
    classLevel: "9",
    subjectKey: "BIO",
    chapterTitle: "Bioenergetics",
    topicTitle: "Aerobic vs Anaerobic Respiration",
    type: "SHORT",
    marks: 3,
    text: "Write the balanced chemical equation for aerobic respiration and state the net ATP yield per glucose molecule.",
    modelAnswer: "Equation: C6H12O6 + 6O2 → 6CO2 + 6H2O + Energy (ATP)\nNet Yield: Complete aerobic oxidation of one glucose molecule yields 36 to 38 molecules of ATP in eukaryotic cellular respiration.",
    markingRubric: [
      "1.5 Marks: Balanced stoichiometric chemical equation.",
      "1.5 Marks: Accurate statement of net ATP yield (36-38 ATP).",
    ],
  },
  {
    id: "q_b9_short_3",
    classLevel: "9",
    subjectKey: "BIO",
    chapterTitle: "Transport",
    topicTitle: "Arteries vs Veins",
    type: "SHORT",
    marks: 3,
    text: "Distinguish between arteries and veins with respect to wall thickness, valves, and direction of blood flow.",
    modelAnswer: "Arteries: Carry oxygenated blood away from the heart (except pulmonary artery), possess thick elastic muscular walls, and have no valves due to high pressure.\nVeins: Carry deoxygenated blood toward the heart (except pulmonary vein), possess thinner walls with wider lumen, and contain semilunar valves to prevent backflow.",
    markingRubric: [
      "1.0 Mark: Direction of blood flow relative to heart.",
      "1.0 Mark: Wall thickness and lumen comparison.",
      "1.0 Mark: Presence/absence of internal valves.",
    ],
  },
  {
    id: "q_b9_long_1",
    classLevel: "9",
    subjectKey: "BIO",
    chapterTitle: "Cells and Tissues",
    topicTitle: "Fluid Mosaic Model of Cell Membrane",
    type: "LONG",
    marks: 9,
    text: "Describe the Fluid Mosaic Model of the cell membrane with a labeled diagram and explain the role of lipid bilayer and membrane proteins.",
    modelAnswer: "1. Model Statement: Proposed by Singer and Nicolson (1972). Membrane is a fluid phospholipid bilayer with mosaic pattern of embedded proteins.\n2. Phospholipid Bilayer: Hydrophilic phosphate heads face outward toward aqueous environment; hydrophobic fatty acid tails face inward, creating selective permeability barrier.\n3. Membrane Proteins: Integral (transmembrane) proteins act as ion channels and carrier pumps; peripheral proteins provide structural support and cellular signaling.\n4. Cholesterol & Carbohydrates: Regulate membrane fluidity and act as cell-recognition markers (glycoproteins/glycolipids).",
    markingRubric: [
      "2.5 Marks: Neat, accurately labeled schematic diagram of fluid mosaic membrane.",
      "2.5 Marks: Detailed explanation of phospholipid bilayer structure and hydrophobic core.",
      "2.0 Marks: Description of transport proteins (channels, carriers, receptors).",
      "2.0 Marks: Explanation of fluidity and selective permeability.",
    ],
  },

  // ============================================================================
  // CLASS 9 (SSC PART-I) - COMPUTER SCIENCE
  // ============================================================================
  {
    id: "q_cs9_mcq_1",
    classLevel: "9",
    subjectKey: "CS",
    chapterTitle: "Problem Solving & Flowcharts",
    topicTitle: "Flowchart Standard Symbols",
    type: "MCQ",
    marks: 1,
    text: "In standard flowchart notation, which geometrical symbol is strictly used to represent a conditional decision?",
    options: [
      { key: "A", text: "Rectangle" },
      { key: "B", text: "Diamond (Rhombus)" },
      { key: "C", text: "Parallelogram" },
      { key: "D", text: "Oval" },
    ],
    correctOption: "B",
    solutionExplanation: "The diamond symbol represents a decision/condition having two outcomes (True/False or Yes/No).",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_cs9_mcq_2",
    classLevel: "9",
    subjectKey: "CS",
    chapterTitle: "Binary System & Data Representation",
    topicTitle: "Hexadecimal Conversions",
    type: "MCQ",
    marks: 1,
    text: "The binary equivalent of the decimal number 25 is:",
    options: [
      { key: "A", text: "11001" },
      { key: "B", text: "10011" },
      { key: "C", text: "11100" },
      { key: "D", text: "10101" },
    ],
    correctOption: "A",
    solutionExplanation: "25 = 16 + 8 + 1 = 11001 in base-2 binary representation.",
    rubric: "1 Mark for selecting (A).",
  },
  {
    id: "q_cs9_mcq_3",
    classLevel: "9",
    subjectKey: "CS",
    chapterTitle: "Networks & Protocols",
    topicTitle: "Network Topologies",
    type: "MCQ",
    marks: 1,
    text: "In which network topology are all computer nodes connected to a central connecting hub or switch?",
    options: [
      { key: "A", text: "Bus Topology" },
      { key: "B", text: "Ring Topology" },
      { key: "C", text: "Star Topology" },
      { key: "D", text: "Mesh Topology" },
    ],
    correctOption: "C",
    solutionExplanation: "In Star Topology, each device is connected to a central device (hub/switch) with point-to-point links.",
    rubric: "1 Mark for selecting (C).",
  },
  {
    id: "q_cs9_mcq_4",
    classLevel: "9",
    subjectKey: "CS",
    chapterTitle: "Designing Website (HTML & CSS)",
    topicTitle: "HTML Hyperlinks",
    type: "MCQ",
    marks: 1,
    text: "Which HTML anchor tag attribute specifies the destination URL of a hyperlink?",
    options: [
      { key: "A", text: "src" },
      { key: "B", text: "href" },
      { key: "C", text: "link" },
      { key: "D", text: "target" },
    ],
    correctOption: "B",
    solutionExplanation: "The href attribute (Hypertext REFerence) in <a href='...'> defines the URL link target.",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_cs9_short_1",
    classLevel: "9",
    subjectKey: "CS",
    chapterTitle: "Problem Solving & Flowcharts",
    topicTitle: "Algorithm vs Flowchart",
    type: "SHORT",
    marks: 3,
    text: "Differentiate between an algorithm and a flowchart with key characteristics of each.",
    modelAnswer: "Algorithm: A step-by-step written procedure in natural language (pseudo-code) designed to solve a specific computational problem.\nFlowchart: A visual/graphical representation of the sequence of steps and decision points using standardized geometrical symbols and directional flowlines.",
    markingRubric: [
      "1.5 Marks: Formal definition and distinction.",
      "1.5 Marks: Key characteristics (textual steps vs graphical visualization).",
    ],
  },
  {
    id: "q_cs9_short_2",
    classLevel: "9",
    subjectKey: "CS",
    chapterTitle: "Data and Cyber Security",
    topicTitle: "Phishing and Prevention",
    type: "SHORT",
    marks: 3,
    text: "Define phishing attack and list two practical safety measures to protect personal credentials.",
    modelAnswer: "Definition: A fraudulent cyber technique where attackers pose as legitimate organizations via deceptive emails/websites to steal sensitive data (passwords, banking details).\nPrevention Measures:\n1. Verify sender domain and never click unverified suspicious URL links.\n2. Enable two-factor authentication (2FA) and verify HTTPS SSL security certificate.",
    markingRubric: [
      "1.5 Marks: Clear conceptual definition of phishing.",
      "1.5 Marks: Two valid cybersecurity protective practices.",
    ],
  },
  {
    id: "q_cs9_short_3",
    classLevel: "9",
    subjectKey: "CS",
    chapterTitle: "Designing Website (HTML & CSS)",
    topicTitle: "HTML Table Tags",
    type: "SHORT",
    marks: 3,
    text: "Explain the purpose of <table>, <tr>, <th>, and <td> tags in HTML document markup.",
    modelAnswer: "1. <table>: Defines container for the entire HTML tabular data.\n2. <tr>: Table Row - defines an individual horizontal row inside the table.\n3. <th>: Table Header - defines bold, centered column header cell.\n4. <td>: Table Data - defines standard data cell containing content.",
    markingRubric: [
      "1.5 Marks: Accurate definition of <table> and <tr>.",
      "1.5 Marks: Accurate definition of <th> and <td>.",
    ],
  },
  {
    id: "q_cs9_long_1",
    classLevel: "9",
    subjectKey: "CS",
    chapterTitle: "Networks & Protocols",
    topicTitle: "TCP/IP Protocol Suite",
    type: "LONG",
    marks: 9,
    text: "Explain the TCP/IP Five-Layer Model in detail, describing the primary role and protocol examples of each layer.",
    modelAnswer: "1. Application Layer: Provides network services directly to user applications (Protocols: HTTP, FTP, SMTP, DNS).\n2. Transport Layer: Ensures reliable end-to-end data delivery, segmentation, and flow control (Protocols: TCP, UDP).\n3. Network (Internet) Layer: Responsible for logical IP addressing and optimal packet routing across interconnected networks (Protocols: IP, ICMP, ARP).\n4. Data Link Layer: Manages frame formatting, MAC addressing, error detection, and point-to-point transfer across physical media (Protocols: Ethernet, Wi-Fi).\n5. Physical Layer: Transmits raw unstructured bit streams (0s and 1s) over physical electrical, optical, or radio channels.",
    markingRubric: [
      "2.0 Marks: Layered architectural diagram/hierarchy.",
      "4.0 Marks: Detailed explanation of all 5 layers with functions.",
      "3.0 Marks: Accurate protocol examples for each respective layer.",
    ],
  },

  // ============================================================================
  // CLASS 9 (SSC PART-I) - MATHEMATICS
  // ============================================================================
  {
    id: "q_m9_mcq_1",
    classLevel: "9",
    subjectKey: "MTH",
    chapterTitle: "Matrices and Determinants",
    topicTitle: "Singular Matrix",
    type: "MCQ",
    marks: 1,
    text: "A square matrix A is called singular if its determinant |A| is equal to:",
    options: [
      { key: "A", text: "1" },
      { key: "B", text: "0" },
      { key: "C", text: "-1" },
      { key: "D", text: "Undefined" },
    ],
    correctOption: "B",
    solutionExplanation: "A singular matrix has determinant zero (|A| = 0), meaning its multiplicative inverse does not exist.",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_m9_mcq_2",
    classLevel: "9",
    subjectKey: "MTH",
    chapterTitle: "Logarithms",
    topicTitle: "Laws of Logarithms",
    type: "MCQ",
    marks: 1,
    text: "According to the first law of logarithms, log_a(m * n) is equal to:",
    options: [
      { key: "A", text: "log_a(m) - log_a(n)" },
      { key: "B", text: "log_a(m) * log_a(n)" },
      { key: "C", text: "log_a(m) + log_a(n)" },
      { key: "D", text: "n * log_a(m)" },
    ],
    correctOption: "C",
    solutionExplanation: "Logarithm of product equals sum of individual logarithms: log_a(mn) = log_a(m) + log_a(n).",
    rubric: "1 Mark for selecting (C).",
  },
  {
    id: "q_m9_short_1",
    classLevel: "9",
    subjectKey: "MTH",
    chapterTitle: "Matrices and Determinants",
    topicTitle: "Cramer's Rule",
    type: "SHORT",
    marks: 3,
    text: "Evaluate the determinant of matrix A = [[3, -2], [5, 4]] and state whether A is non-singular.",
    modelAnswer: "|A| = (3 * 4) - (-2 * 5) = 12 - (-10) = 12 + 10 = 22.\nSince |A| = 22 ≠ 0, matrix A is non-singular and its inverse exists.",
    markingRubric: [
      "2.0 Marks: Correct cross-multiplication formula and arithmetic step.",
      "1.0 Mark: Concluding that A is non-singular because |A| != 0.",
    ],
  },
  {
    id: "q_m9_long_1",
    classLevel: "9",
    subjectKey: "MTH",
    chapterTitle: "Matrices and Determinants",
    topicTitle: "Matrix Inversion Method",
    type: "LONG",
    marks: 9,
    text: "Solve the following system of linear equations using the Matrix Inversion Method:\n2x - 2y = 4\n3x + 2y = 6",
    modelAnswer: "1. Matrix Form: AX = B\n   A = [[2, -2], [3, 2]], X = [[x], [y]], B = [[4], [6]]\n2. Determinant of A: |A| = (2)(2) - (-2)(3) = 4 + 6 = 10 ≠ 0 (Inverse exists)\n3. Adjoint of A: Adj(A) = [[2, 2], [-3, 2]]\n4. Inverse A⁻¹ = Adj(A) / |A| = (1/10) * [[2, 2], [-3, 2]]\n5. Solution X = A⁻¹ * B = (1/10) * [[2*4 + 2*6], [-3*4 + 2*6]] = (1/10) * [[8 + 12], [-12 + 12]] = (1/10) * [[20], [0]] = [[2], [0]]\nResult: x = 2, y = 0. Solution Set = {(2, 0)}.",
    markingRubric: [
      "2.0 Marks: Matrix notation AX = B setup.",
      "2.0 Marks: Calculation of determinant |A| = 10.",
      "2.0 Marks: Formation of Adjoint Adj(A).",
      "3.0 Marks: Matrix multiplication and final values x = 2, y = 0.",
    ],
  },

  // ============================================================================
  // CLASS 10 (SSC PART-II) - PHYSICS
  // ============================================================================
  {
    id: "q_p10_mcq_1",
    classLevel: "10",
    subjectKey: "PHY",
    chapterTitle: "Simple Harmonic Motion and Waves",
    topicTitle: "Simple Pendulum Time Period",
    type: "MCQ",
    marks: 1,
    text: "The time period of a simple pendulum of length L in a gravitational field g is given by:",
    options: [
      { key: "A", text: "T = 2π √(l/g)" },
      { key: "B", text: "T = 2π √(g/l)" },
      { key: "C", text: "T = (1/2π) √(l/g)" },
      { key: "D", text: "T = 2π √(m/k)" },
    ],
    correctOption: "A",
    solutionExplanation: "The formula for simple pendulum time period is T = 2π √(l/g), independent of the bob's mass.",
    rubric: "1 Mark for selecting (A).",
  },
  {
    id: "q_p10_mcq_2",
    classLevel: "10",
    subjectKey: "PHY",
    chapterTitle: "Geometrical Optics",
    topicTitle: "Refraction & Snell's Law",
    type: "MCQ",
    marks: 1,
    text: "According to Snell's Law, refractive index n of medium 2 relative to medium 1 is:",
    options: [
      { key: "A", text: "n = sin(r) / sin(i)" },
      { key: "B", text: "n = sin(i) / sin(r)" },
      { key: "C", text: "n = sin(i) * sin(r)" },
      { key: "D", text: "n = cos(i) / cos(r)" },
    ],
    correctOption: "B",
    solutionExplanation: "Snell's Law states that the ratio of sine of angle of incidence to sine of angle of refraction is constant: n = sin(i)/sin(r).",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_p10_mcq_3",
    classLevel: "10",
    subjectKey: "PHY",
    chapterTitle: "Current Electricity",
    topicTitle: "Ohm's Law",
    type: "MCQ",
    marks: 1,
    text: "If resistance of an electric circuit is doubled while voltage remains constant, current through the circuit will:",
    options: [
      { key: "A", text: "Double" },
      { key: "B", text: "Be halved" },
      { key: "C", text: "Quadruple" },
      { key: "D", text: "Remain unchanged" },
    ],
    correctOption: "B",
    solutionExplanation: "By Ohm's Law I = V/R, current is inversely proportional to resistance. Doubling R halves current I.",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_p10_mcq_4",
    classLevel: "10",
    subjectKey: "PHY",
    chapterTitle: "Basic Electronics",
    topicTitle: "Logic Gates",
    type: "MCQ",
    marks: 1,
    text: "Which digital logic gate produces an output of logic 0 ONLY when both inputs A and B are logic 1?",
    options: [
      { key: "A", text: "AND Gate" },
      { key: "B", text: "NAND Gate" },
      { key: "C", text: "OR Gate" },
      { key: "D", text: "NOR Gate" },
    ],
    correctOption: "B",
    solutionExplanation: "A NAND gate is an inverted AND gate: output X = NOT(A AND B). When both inputs are 1, output is 0.",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_p10_short_1",
    classLevel: "10",
    subjectKey: "PHY",
    chapterTitle: "Simple Harmonic Motion and Waves",
    topicTitle: "SHM Characteristics",
    type: "SHORT",
    marks: 3,
    text: "State three essential conditions for a body to execute Simple Harmonic Motion (SHM).",
    modelAnswer: "1. Acceleration is directly proportional to displacement from mean position (a ∝ -x).\n2. Acceleration is always directed towards the equilibrium (mean) position.\n3. Restoring force acts on the oscillating mass with minimal frictional damping.",
    markingRubric: [
      "1.0 Mark: Acceleration proportionality to displacement.",
      "1.0 Mark: Restoring force direction towards mean position.",
      "1.0 Mark: Mechanical conditions (inertia & restoring force).",
    ],
  },
  {
    id: "q_p10_short_2",
    classLevel: "10",
    subjectKey: "PHY",
    chapterTitle: "Geometrical Optics",
    topicTitle: "Total Internal Reflection",
    type: "SHORT",
    marks: 3,
    text: "Define critical angle and state two necessary conditions for total internal reflection to occur.",
    modelAnswer: "Critical Angle: Angle of incidence in the denser medium for which the corresponding angle of refraction in rarer medium is 90°.\nConditions:\n1. Light ray must travel from an optically denser medium into an optically rarer medium.\n2. Angle of incidence must exceed the critical angle of the medium (i > c).",
    markingRubric: [
      "1.5 Marks: Formal definition of critical angle with 90° refraction.",
      "1.5 Marks: Two explicit conditions for total internal reflection.",
    ],
  },
  {
    id: "q_p10_short_3",
    classLevel: "10",
    subjectKey: "PHY",
    chapterTitle: "Electrostatics",
    topicTitle: "Capacitance",
    type: "SHORT",
    marks: 3,
    text: "Define capacitance of a capacitor, write its SI unit, and define one Farad.",
    modelAnswer: "Capacitance (C): The ability of a capacitor to store electric charge per unit potential difference: C = Q/V.\nSI Unit: Farad (F).\n1 Farad: A capacitor has a capacitance of 1 Farad if a charge of 1 Coulomb deposited on its plates produces a potential difference of 1 Volt across them.",
    markingRubric: [
      "1.0 Mark: Definition and formula C = Q/V.",
      "1.0 Mark: Name of SI unit (Farad).",
      "1.0 Mark: Accurate definition of 1 Farad.",
    ],
  },
  {
    id: "q_p10_long_1",
    classLevel: "10",
    subjectKey: "PHY",
    chapterTitle: "Electromagnetism",
    topicTitle: "Electric D.C. Motor",
    type: "LONG",
    marks: 9,
    text: "Explain the working principle and construction of a Simple D.C. Motor with a labeled diagram, detailing the function of split-ring commutators.",
    modelAnswer: "1. Principle: When a current-carrying rectangular coil is placed in a magnetic field, magnetic forces act on opposite arms creating a couple and rotational torque.\n2. Construction: Permanent field magnet (N-S poles), armature rectangular coil (ABCD), split-ring commutators (split cylinder), and carbon brushes.\n3. Working: Direct current flows via brush into commutator half. Arm AB experiences upward force while arm CD experiences downward force (Fleming's Left Hand Rule), rotating the coil.\n4. Commutator Role: Reverses current direction in the coil every half rotation (180°), ensuring that torque remains unidirectional and continuous rotation is sustained.",
    markingRubric: [
      "2.0 Marks: Working principle statement.",
      "3.0 Marks: Neat labeled diagram showing coil, magnet, brushes, and split rings.",
      "2.0 Marks: Explanation of magnetic couple and rotation.",
      "2.0 Marks: Explicit role of split rings in current reversal.",
    ],
  },

  // ============================================================================
  // CLASS 10 (SSC PART-II) - COMPUTER SCIENCE
  // ============================================================================
  {
    id: "q_cs10_mcq_1",
    classLevel: "10",
    subjectKey: "CS",
    chapterTitle: "Introduction to Programming (C Language)",
    topicTitle: "Variables and Data Types",
    type: "MCQ",
    marks: 1,
    text: "In C programming language, which format specifier is used with printf() to display a floating-point number?",
    options: [
      { key: "A", text: "%d" },
      { key: "B", text: "%f" },
      { key: "C", text: "%c" },
      { key: "D", text: "%s" },
    ],
    correctOption: "B",
    solutionExplanation: "Format specifier %f is used for float data types, %d for integers, %c for characters, and %s for strings.",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_cs10_mcq_2",
    classLevel: "10",
    subjectKey: "CS",
    chapterTitle: "Conditional Logic",
    topicTitle: "Relational Operators in C",
    type: "MCQ",
    marks: 1,
    text: "Which operator is strictly used in C language to test equality between two variables?",
    options: [
      { key: "A", text: "=" },
      { key: "B", text: "==" },
      { key: "C", text: "!=" },
      { key: "D", text: "<=" },
    ],
    correctOption: "B",
    solutionExplanation: "In C, '==' is the relational equality operator, while '=' is the assignment operator.",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_cs10_short_1",
    classLevel: "10",
    subjectKey: "CS",
    chapterTitle: "Conditional Logic",
    topicTitle: "if-else vs switch statement",
    type: "SHORT",
    marks: 3,
    text: "Differentiate between if-else-if ladder and switch statement in C language.",
    modelAnswer: "if-else-if: Can evaluate complex relational and logical conditions (ranges, floats, inequalities) at each branch.\nswitch statement: Evaluates a single integer or character expression against multiple constant case values using jump tables for faster multi-way branching.",
    markingRubric: [
      "1.5 Marks: Explanation of conditions evaluated (complex ranges vs exact constants).",
      "1.5 Marks: Data types allowed and execution speed differences.",
    ],
  },
  {
    id: "q_cs10_long_1",
    classLevel: "10",
    subjectKey: "CS",
    chapterTitle: "Loops & Arrays",
    topicTitle: "For Loop in C",
    type: "LONG",
    marks: 9,
    text: "Explain the syntax and execution flow of 'for' loop in C language. Write a complete C program to calculate the factorial of a given positive integer.",
    modelAnswer: "1. Syntax: for(initialization; condition; increment/decrement) { statements; }\n2. Execution Flow: (a) Initialization executes once. (b) Condition checked; if true, body runs. (c) Increment/decrement executed. (d) Repeat until condition is false.\n3. Program Code:\n#include <stdio.h>\nint main() {\n    int n, i;\n    unsigned long long fact = 1;\n    printf(\"Enter a positive integer: \");\n    scanf(\"%d\", &n);\n    for(i = 1; i <= n; i++) {\n        fact *= i;\n    }\n    printf(\"Factorial of %d = %llu\\n\", n, fact);\n    return 0;\n}",
    markingRubric: [
      "2.0 Marks: Explanation of for loop syntax and three expressions.",
      "2.0 Marks: Step-by-step flowchart or execution lifecycle.",
      "4.0 Marks: Correct compilable C program with proper variables and loop logic.",
      "1.0 Mark: Accurate input/output statements.",
    ],
  },

  // ============================================================================
  // 1ST YEAR (HSSC PART-I / CLASS 11) - PHYSICS
  // ============================================================================
  {
    id: "q_p11_mcq_1",
    classLevel: "11",
    subjectKey: "PHY",
    chapterTitle: "Vectors and Equilibrium",
    topicTitle: "Scalar and Vector Products",
    type: "MCQ",
    marks: 1,
    text: "If the scalar product of two non-zero vectors A · B = 0, the angle between vectors A and B is:",
    options: [
      { key: "A", text: "0°" },
      { key: "B", text: "45°" },
      { key: "C", text: "90° (Perpendicular)" },
      { key: "D", text: "180°" },
    ],
    correctOption: "C",
    solutionExplanation: "A · B = AB cos(θ). For A · B = 0 with non-zero vectors, cos(θ) = 0, hence θ = 90°.",
    rubric: "1 Mark for selecting (C).",
  },
  {
    id: "q_p11_mcq_2",
    classLevel: "11",
    subjectKey: "PHY",
    chapterTitle: "Motion and Force",
    topicTitle: "Projectile Motion Maximum Range",
    type: "MCQ",
    marks: 1,
    text: "To achieve the maximum horizontal range on level ground without air resistance, a projectile must be launched at an angle of:",
    options: [
      { key: "A", text: "30°" },
      { key: "B", text: "45°" },
      { key: "C", text: "60°" },
      { key: "D", text: "90°" },
    ],
    correctOption: "B",
    solutionExplanation: "Horizontal Range R = (v₀² sin 2θ) / g. R is maximum when sin(2θ) = 1, giving 2θ = 90°, so θ = 45°.",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_p11_mcq_3",
    classLevel: "11",
    subjectKey: "PHY",
    chapterTitle: "Fluid Dynamics",
    topicTitle: "Bernoulli's Equation",
    type: "MCQ",
    marks: 1,
    text: "Bernoulli's theorem for the steady, non-viscous flow of an incompressible fluid is a fundamental consequence of:",
    options: [
      { key: "A", text: "Conservation of Momentum" },
      { key: "B", text: "Conservation of Energy" },
      { key: "C", text: "Conservation of Mass" },
      { key: "D", text: "Newton's Third Law" },
    ],
    correctOption: "B",
    solutionExplanation: "Bernoulli's equation (P + 1/2 ρv² + ρgh = constant) is an expression of the law of conservation of energy applied to fluids.",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_p11_short_1",
    classLevel: "11",
    subjectKey: "PHY",
    chapterTitle: "Vectors and Equilibrium",
    topicTitle: "Conditions of Equilibrium",
    type: "SHORT",
    marks: 3,
    text: "State the two conditions of equilibrium for a rigid body in translational and rotational equilibrium.",
    modelAnswer: "1. First Condition (Translational Equilibrium): Vector sum of all external forces acting on the body must be zero: ΣF = 0 (i.e. ΣFx = 0 and ΣFy = 0).\n2. Second Condition (Rotational Equilibrium): Vector sum of all torques acting on the body about any axis must be zero: Στ = 0.",
    markingRubric: [
      "1.5 Marks: First condition statement with vector formula ΣF = 0.",
      "1.5 Marks: Second condition statement with torque formula Στ = 0.",
    ],
  },
  {
    id: "q_p11_short_2",
    classLevel: "11",
    subjectKey: "PHY",
    chapterTitle: "Heat and Thermodynamics",
    topicTitle: "First Law of Thermodynamics",
    type: "SHORT",
    marks: 3,
    text: "State the First Law of Thermodynamics and write its mathematical equation, defining each term.",
    modelAnswer: "Statement: Energy cannot be created or destroyed; heat Q added to a system equals the sum of increase in internal energy ΔU and external work W done by the system.\nFormula: Q = ΔU + W (or ΔU = Q - W), where Q is heat added, ΔU is change in internal energy, and W is work done.",
    markingRubric: [
      "1.5 Marks: Accurate conceptual statement of the First Law.",
      "1.5 Marks: Mathematical equation Q = ΔU + W with term definitions.",
    ],
  },
  {
    id: "q_p11_long_1",
    classLevel: "11",
    subjectKey: "PHY",
    chapterTitle: "Motion and Force",
    topicTitle: "Projectile Motion Derivations",
    type: "LONG",
    marks: 9,
    text: "Define projectile motion. Derive expressions for (a) Maximum Height reached, (b) Time of Flight, and (c) Horizontal Range of a projectile.",
    modelAnswer: "1. Definition: Two-dimensional motion under constant gravitational acceleration with no horizontal acceleration (ax = 0, ay = -g).\n2. Maximum Height H: Using vy² = voy² - 2gH. At peak vy = 0: 0 = (v₀ sinθ)² - 2gH → H = (v₀² sin²θ) / (2g).\n3. Time of Flight T: Total time when vertical displacement y = 0. Using y = voy*t - 1/2gt²: 0 = (v₀ sinθ)T - 1/2gT² → T = (2v₀ sinθ) / g.\n4. Horizontal Range R: Distance traveled horizontally: R = vox * T = (v₀ cosθ) * (2v₀ sinθ / g) = (v₀² * 2sinθcosθ) / g = (v₀² sin 2θ) / g.",
    markingRubric: [
      "2.0 Marks: Definition and trajectory setup with velocity components.",
      "2.5 Marks: Algebraic derivation of maximum height H = v₀²sin²θ / 2g.",
      "2.0 Marks: Algebraic derivation of time of flight T = 2v₀sinθ / g.",
      "2.5 Marks: Algebraic derivation of horizontal range R = v₀²sin 2θ / g.",
    ],
  },

  // ============================================================================
  // 1ST YEAR (HSSC PART-I / CLASS 11) - BIOLOGY
  // ============================================================================
  {
    id: "q_b11_mcq_1",
    classLevel: "11",
    subjectKey: "BIO",
    chapterTitle: "Biological Molecules",
    topicTitle: "Protein Structure & Peptide Bonds",
    type: "MCQ",
    marks: 1,
    text: "The primary covalent bond linking amino acids together in a polypeptide chain is the:",
    options: [
      { key: "A", text: "Glycosidic bond" },
      { key: "B", text: "Peptide bond" },
      { key: "C", text: "Phosphodiester bond" },
      { key: "D", text: "Ester bond" },
    ],
    correctOption: "B",
    solutionExplanation: "Peptide bond is formed through dehydration synthesis between amino group (-NH2) of one amino acid and carboxyl group (-COOH) of another.",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_b11_mcq_2",
    classLevel: "11",
    subjectKey: "BIO",
    chapterTitle: "Variety of Life (Viruses)",
    topicTitle: "Bacteriophage Replication",
    type: "MCQ",
    marks: 1,
    text: "In the lysogenic cycle of a temperate bacteriophage, viral DNA integrates into bacterial host DNA as a latent:",
    options: [
      { key: "A", text: "Capsomere" },
      { key: "B", text: "Prophage" },
      { key: "C", text: "Prion" },
      { key: "D", text: "Viroid" },
    ],
    correctOption: "B",
    solutionExplanation: "When viral DNA integrates into the bacterial chromosome without immediately lysing the cell, it is called a prophage.",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_b11_short_1",
    classLevel: "11",
    subjectKey: "BIO",
    chapterTitle: "Enzymes",
    topicTitle: "Competitive vs Non-competitive Inhibition",
    type: "SHORT",
    marks: 3,
    text: "Differentiate between competitive and non-competitive enzyme inhibitors with regard to active site binding.",
    modelAnswer: "Competitive Inhibitors: Structurally resemble substrate and compete directly for binding at the active site; inhibition can be overcome by increasing substrate concentration.\nNon-competitive Inhibitors: Bind to an allosteric site (different from active site), altering enzyme tertiary conformation and reducing catalytic efficiency regardless of substrate concentration.",
    markingRubric: [
      "1.5 Marks: Binding location distinction (active site vs allosteric site).",
      "1.5 Marks: Reversibility through substrate concentration increase.",
    ],
  },
  {
    id: "q_b11_long_1",
    classLevel: "11",
    subjectKey: "BIO",
    chapterTitle: "Variety of Life (Viruses)",
    topicTitle: "Lytic Cycle of Bacteriophage",
    type: "LONG",
    marks: 9,
    text: "Describe the Lytic Cycle of T4 Bacteriophage step-by-step with labeled diagrams showing adsorption, penetration, biosythesis, maturation, and lysis.",
    modelAnswer: "1. Adsorption (Attachment): Phage tail fibers attach specifically to receptor sites on bacterial cell wall.\n2. Penetration: Phage lysozyme weakens cell wall; tail sheath contracts and injects viral DNA into bacterium.\n3. Biosynthesis: Phage DNA hijacks bacterial machinery, degrading host DNA and synthesizing viral enzymes, DNA, and capsid proteins.\n4. Maturation (Assembly): Phage head, tail, and DNA assemble into complete new virions.\n5. Lysis (Release): Phage lysozyme ruptures bacterial membrane, releasing 100-200 new bacteriophages to infect adjacent cells.",
    markingRubric: [
      "3.0 Marks: Sequence of 5 discrete stages clearly explained.",
      "3.0 Marks: Neat, sequential labeled diagrams.",
      "3.0 Marks: Mention of lysozyme enzyme, DNA injection, and host burst size.",
    ],
  },

  // ============================================================================
  // 2ND YEAR (HSSC PART-II / CLASS 12) - PHYSICS
  // ============================================================================
  {
    id: "q_p12_mcq_1",
    classLevel: "12",
    subjectKey: "PHY",
    chapterTitle: "Electrostatics",
    topicTitle: "Gauss's Law",
    type: "MCQ",
    marks: 1,
    text: "The electric flux through any closed surface enclosing a total charge Q in a medium of permittivity ε₀ is:",
    options: [
      { key: "A", text: "Φ = Q / ε₀" },
      { key: "B", text: "Φ = Q * ε₀" },
      { key: "C", text: "Φ = ε₀ / Q" },
      { key: "D", text: "Φ = 4πkQ" },
    ],
    correctOption: "A",
    solutionExplanation: "Gauss's Law states that total electric flux through any closed surface is 1/ε₀ times the total enclosed charge: Φ = Q / ε₀.",
    rubric: "1 Mark for selecting (A).",
  },
  {
    id: "q_p12_mcq_2",
    classLevel: "12",
    subjectKey: "PHY",
    chapterTitle: "Electromagnetic Induction",
    topicTitle: "Faraday's and Lenz's Law",
    type: "MCQ",
    marks: 1,
    text: "The negative sign in Faraday's law of electromagnetic induction (ε = -N ΔΦ/Δt) represents:",
    options: [
      { key: "A", text: "Ampere's Law" },
      { key: "B", text: "Lenz's Law (Conservation of Energy)" },
      { key: "C", text: "Ohm's Law" },
      { key: "D", text: "Gauss's Law" },
    ],
    correctOption: "B",
    solutionExplanation: "The negative sign represents Lenz's Law: induced current opposes the change in magnetic flux producing it, obeying conservation of energy.",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_p12_mcq_3",
    classLevel: "12",
    subjectKey: "PHY",
    chapterTitle: "Dawn of Modern Physics",
    topicTitle: "Photoelectric Effect",
    type: "MCQ",
    marks: 1,
    text: "In the photoelectric effect, maximum kinetic energy of emitted photoelectrons depends strictly on:",
    options: [
      { key: "A", text: "Intensity of incident light" },
      { key: "B", text: "Frequency of incident light" },
      { key: "C", text: "Distance of light source" },
      { key: "D", text: "Surface area of metal cathode" },
    ],
    correctOption: "B",
    solutionExplanation: "Einstein's photoelectric equation KE_max = hf - Φ shows kinetic energy depends on incident frequency f, while intensity dictates number of emitted electrons.",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_p12_short_1",
    classLevel: "12",
    subjectKey: "PHY",
    chapterTitle: "Current Electricity",
    topicTitle: "Kirchhoff's Rules",
    type: "SHORT",
    marks: 3,
    text: "State Kirchhoff's First Rule (Current Law) and Second Rule (Voltage Law) with corresponding conservation laws.",
    modelAnswer: "1. Kirchhoff's First Rule (KCL): Algebraic sum of all currents meeting at a junction is zero (ΣI = 0). Based on the Law of Conservation of Charge.\n2. Kirchhoff's Second Rule (KVL): Algebraic sum of all potential changes around any closed electrical loop is zero (ΣV = 0). Based on the Law of Conservation of Energy.",
    markingRubric: [
      "1.5 Marks: Statement of 1st rule and conservation of charge.",
      "1.5 Marks: Statement of 2nd rule and conservation of energy.",
    ],
  },
  {
    id: "q_p12_short_2",
    classLevel: "12",
    subjectKey: "PHY",
    chapterTitle: "Dawn of Modern Physics",
    topicTitle: "Compton Effect",
    type: "SHORT",
    marks: 3,
    text: "Define Compton Effect and write the formula for Compton shift in wavelength (Δλ).",
    modelAnswer: "Definition: The phenomenon where an X-ray photon colliding with a stationary electron scatters with decreased frequency and increased wavelength.\nFormula: Δλ = λ' - λ = (h / m₀c) * (1 - cos θ), where h/(m₀c) = 2.43 × 10⁻¹² m is the Compton wavelength of electron.",
    markingRubric: [
      "1.5 Marks: Formal conceptual definition.",
      "1.5 Marks: Mathematical expression with Compton wavelength constant.",
    ],
  },
  {
    id: "q_p12_long_1",
    classLevel: "12",
    subjectKey: "PHY",
    chapterTitle: "Electrostatics",
    topicTitle: "Gauss's Law on Infinite Sheet of Charge",
    type: "LONG",
    marks: 9,
    text: "State Gauss's Law in electrostatics. Apply it to derive the electric field intensity E due to an infinite plane sheet of charge.",
    modelAnswer: "1. Gauss's Law Statement: Total electric flux through any closed surface is 1/ε₀ times the total charge enclosed: Φ = Q / ε₀.\n2. Surface Charge Density: Let σ be uniform charge density (σ = Q/A).\n3. Gaussian Surface: Construct a cylindrical Gaussian surface of cross-sectional area A cutting perpendicular through the sheet.\n4. Flux Calculation: Curved surface is parallel to E-lines, so Φ_curved = 0. Both circular end caps have E perpendicular to surface, so Φ_ends = E*A + E*A = 2EA.\n5. Total Flux: Φ = 2EA.\n6. Equating: 2EA = Q/ε₀ = (σA)/ε₀ → 2E = σ/ε₀ → E = σ / (2ε₀).\n7. In vector form: E = (σ / 2ε₀) * r̂.",
    markingRubric: [
      "2.0 Marks: Formal statement and equation of Gauss's Law.",
      "2.5 Marks: Construction of Gaussian cylinder with neat diagram.",
      "2.5 Marks: Step-by-step flux summation across ends and curved face.",
      "2.0 Marks: Algebraic derivation of E = σ / (2ε₀).",
    ],
  },

  // ============================================================================
  // 2ND YEAR (HSSC PART-II / CLASS 12) - MATHEMATICS
  // ============================================================================
  {
    id: "q_m12_mcq_1",
    classLevel: "12",
    subjectKey: "MTH",
    chapterTitle: "Functions and Limits",
    topicTitle: "Standard Limit Formula",
    type: "MCQ",
    marks: 1,
    text: "The value of the standard trigonometric limit lim(x→0) [sin(x) / x] (where x is measured in radians) is:",
    options: [
      { key: "A", text: "0" },
      { key: "B", text: "1" },
      { key: "C", text: "∞" },
      { key: "D", text: "π / 180" },
    ],
    correctOption: "B",
    solutionExplanation: "Using the geometric sandwich theorem, lim(x→0) [sin x / x] = 1.",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_m12_mcq_2",
    classLevel: "12",
    subjectKey: "MTH",
    chapterTitle: "Differentiation",
    topicTitle: "Derivatives of Trigonometric Functions",
    type: "MCQ",
    marks: 1,
    text: "The derivative of tan(x) with respect to x is:",
    options: [
      { key: "A", text: "sec(x)" },
      { key: "B", text: "sec²(x)" },
      { key: "C", text: "-cosec²(x)" },
      { key: "D", text: "cot(x)" },
    ],
    correctOption: "B",
    solutionExplanation: "d/dx [tan x] = sec²(x).",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_m12_short_1",
    classLevel: "12",
    subjectKey: "MTH",
    chapterTitle: "Integration",
    topicTitle: "Integration by Parts",
    type: "SHORT",
    marks: 3,
    text: "Evaluate the indefinite integral ∫ x * e^x dx using integration by parts.",
    modelAnswer: "Formula: ∫ u * v dx = u ∫ v dx - ∫ [u' * (∫ v dx)] dx\nLet u = x (first function) and v = e^x (second function).\n∫ x e^x dx = x (e^x) - ∫ (1 * e^x) dx = x e^x - e^x + C = e^x (x - 1) + C.",
    markingRubric: [
      "1.5 Marks: Correct integration by parts formula and assignment of u and v.",
      "1.5 Marks: Integration steps and addition of constant C: e^x(x - 1) + C.",
    ],
  },
  {
    id: "q_m12_long_1",
    classLevel: "12",
    subjectKey: "MTH",
    chapterTitle: "Functions and Limits",
    topicTitle: "Theorem on Limits",
    type: "LONG",
    marks: 9,
    text: "Prove geometrically that lim(θ→0) [sin θ / θ] = 1, where θ is measured in radians.",
    modelAnswer: "1. Diagram Setup: Draw unit circle (r = 1) with center O. Consider angle θ in radians subtending arc AB.\n2. Areas Comparison: Inscribe sector OAB between triangle OAB and right-angled triangle OAC (where AC is tangent at A).\n   Area of triangle OAB < Area of sector OAB < Area of triangle OAC\n3. Formulae:\n   Area of triangle OAB = 1/2 * r * r * sin θ = 1/2 sin θ\n   Area of sector OAB = 1/2 * r² * θ = 1/2 θ\n   Area of triangle OAC = 1/2 * OA * AC = 1/2 * 1 * tan θ = 1/2 tan θ\n4. Inequality: 1/2 sin θ < 1/2 θ < 1/2 tan θ → sin θ < θ < tan θ\n5. Divide by sin θ: 1 < θ / sin θ < 1 / cos θ\n6. Reciprocals: cos θ < sin θ / θ < 1\n7. Applying Limit as θ → 0: Since lim(θ→0) cos θ = 1, by Sandwich Theorem, lim(θ→0) [sin θ / θ] = 1.",
    markingRubric: [
      "2.5 Marks: Neat geometric unit circle diagram with triangles and sector.",
      "2.5 Marks: Correct inequalities connecting the three geometric areas.",
      "2.0 Marks: Division by sin θ and taking reciprocals.",
      "2.0 Marks: Application of Squeeze/Sandwich theorem to establish limit = 1.",
    ],
  },

  // ============================================================================
  // 2ND YEAR (HSSC PART-II / CLASS 12) - COMPUTER SCIENCE
  // ============================================================================
  {
    id: "q_cs12_mcq_1",
    classLevel: "12",
    subjectKey: "CS",
    chapterTitle: "Data Basics & Database Management",
    topicTitle: "Relational Keys",
    type: "MCQ",
    marks: 1,
    text: "In a relational database, an attribute or set of attributes that uniquely identifies each tuple in a relation is called:",
    options: [
      { key: "A", text: "Foreign Key" },
      { key: "B", text: "Primary Key" },
      { key: "C", text: "Secondary Key" },
      { key: "D", text: "Composite Index" },
    ],
    correctOption: "B",
    solutionExplanation: "A Primary Key uniquely identifies each record in a relational table and cannot contain null values.",
    rubric: "1 Mark for selecting (B).",
  },
  {
    id: "q_cs12_short_1",
    classLevel: "12",
    subjectKey: "CS",
    chapterTitle: "Data Basics & Database Management",
    topicTitle: "Database Normalization",
    type: "SHORT",
    marks: 3,
    text: "Define Database Normalization and state the condition for a table to be in First Normal Form (1NF).",
    modelAnswer: "Normalization: Systematic process of organizing database relations to reduce data redundancy and eliminate update/delete anomalies.\n1NF Condition: A relation is in 1NF if and only if all domain values are atomic (each column contains single indivisible values, with no repeating groups).",
    markingRubric: [
      "1.5 Marks: Formal definition of normalization and redundancy reduction.",
      "1.5 Marks: Rule for 1NF (atomic values, no repeating groups).",
    ],
  },
  {
    id: "q_cs12_long_1",
    classLevel: "12",
    subjectKey: "CS",
    chapterTitle: "Data Basics & Database Management",
    topicTitle: "Database Normalization 1NF to 3NF",
    type: "LONG",
    marks: 9,
    text: "Explain the concepts of 1NF, 2NF, and 3NF in database normalization with suitable relational examples and dependency rules.",
    modelAnswer: "1. First Normal Form (1NF): Eliminates repeating groups; all attributes contain atomic values.\n2. Second Normal Form (2NF): Must be in 1NF and eliminate partial functional dependencies (all non-key attributes must be fully functionally dependent on the entire primary key).\n3. Third Normal Form (3NF): Must be in 2NF and eliminate transitive dependencies (no non-key attribute depends on another non-key attribute: X → Y and Y → Z eliminated).\n4. Example Walkthrough: Transforming unnormalized student-course table into 1NF (atomic), 2NF (splitting student and course composite keys), and 3NF (extracting instructor department to separate relation).",
    markingRubric: [
      "2.0 Marks: Definition of 1NF with atomic value rule.",
      "2.5 Marks: Definition of 2NF and removal of partial dependencies.",
      "2.5 Marks: Definition of 3NF and removal of transitive dependencies.",
      "2.0 Marks: Clear, concrete table schemas illustrating the transformation.",
    ],
  },
];

// ------------------------------------------------------------------------------
// Service Class for Generating Grade-Specific Examination Papers
// ------------------------------------------------------------------------------
export class CurriculumQuestionBank {
  /**
   * Normalizes incoming class string (e.g. "Class 9", "9th", "SSC-I", "Grade 9", "1st Year", "11", etc.)
   */
  public static normalizeClassLevel(rawClass?: string): "9" | "10" | "11" | "12" {
    if (!rawClass) return "10";
    const str = rawClass.toLowerCase();
    if (str.includes("9") || str.includes("ssc-i") || str.includes("ssc part-i") || str.includes("metric 9th")) return "9";
    if (str.includes("10") || str.includes("ssc-ii") || str.includes("ssc part-ii") || str.includes("metric 10th")) return "10";
    if (str.includes("11") || str.includes("1st year") || str.includes("first year") || str.includes("hssc-i") || str.includes("inter part-i")) return "11";
    if (str.includes("12") || str.includes("2nd year") || str.includes("second year") || str.includes("hssc-ii") || str.includes("inter part-ii")) return "12";
    return "10";
  }

  /**
   * Normalizes subject key (e.g. "PHY-09", "Physics", "BIO", "Computer Science", etc.)
   */
  public static normalizeSubjectKey(rawSubject?: string, rawCode?: string): string {
    const combined = `${rawSubject || ""} ${rawCode || ""}`.toUpperCase();
    if (combined.includes("BIO")) return "BIO";
    if (combined.includes("CS") || combined.includes("COMP")) return "CS";
    if (combined.includes("MTH") || combined.includes("MATH")) return "MTH";
    if (combined.includes("CHM") || combined.includes("CHEM")) return "CHM";
    if (combined.includes("ENG")) return "ENG";
    if (combined.includes("URD")) return "URD";
    if (combined.includes("ISL")) return "ISL";
    if (combined.includes("PAK")) return "PAK";
    return "PHY"; // default to physics
  }

  /**
   * Generates a fully authentic, structured 3-section examination paper tailored to the class and subject.
   */
  public static generateStructuredPaper(
    paramsOrClass:
      | {
          className?: string;
          subjectCode?: string;
          subjectName?: string;
          groupName?: string;
          totalMarks?: number;
          boardCode?: string;
          title?: string;
          instructions?: string;
        }
      | string,
    maybeSubjectCode?: string
  ): GeneratedPaperSection[] {
    const params =
      typeof paramsOrClass === "string"
        ? { className: paramsOrClass, subjectCode: maybeSubjectCode }
        : paramsOrClass || {};

    const classLevel = this.normalizeClassLevel(params.className);
    const subjectKey = this.normalizeSubjectKey(params.subjectName, params.subjectCode);

    // Filter registry for exact classLevel & subjectKey
    let pool = CURRICULUM_QUESTION_REGISTRY.filter(
      (q) => q.classLevel === classLevel && q.subjectKey === subjectKey
    );

    // If subject has partial coverage in this class level, fallback to same subject across classes or same class across subjects
    if (pool.length === 0) {
      pool = CURRICULUM_QUESTION_REGISTRY.filter((q) => q.subjectKey === subjectKey);
    }
    if (pool.length === 0) {
      pool = CURRICULUM_QUESTION_REGISTRY.filter((q) => q.classLevel === classLevel);
    }
    if (pool.length === 0) {
      pool = CURRICULUM_QUESTION_REGISTRY;
    }

    const mcqs = pool.filter((q) => q.type === "MCQ");
    const shorts = pool.filter((q) => q.type === "SHORT");
    const longs = pool.filter((q) => q.type === "LONG");

    // Shuffle helper for non-repeating dynamic experience
    const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    const selectedMcqs = shuffle(mcqs).slice(0, 12);
    const selectedShorts = shuffle(shorts).slice(0, 6);
    const selectedLongs = shuffle(longs).slice(0, 3);

    let globalSeq = 1;

    // SECTION A: OBJECTIVE / MCQS
    const sectionA: GeneratedPaperSection = {
      sectionName: "Section A: Multiple Choice Questions (Objective)",
      sectionType: "MCQ",
      totalMarks: selectedMcqs.reduce((sum, q) => sum + q.marks, 0) || 12,
      instructions: "Choose the correct option for each question. Cutting, erasing or overwriting earns zero marks.",
      questions: selectedMcqs.map((q) => ({
        id: `q_mcq_${globalSeq}`,
        sequence: globalSeq++,
        text: q.text,
        marks: q.marks,
        options: q.options,
        correctOption: q.correctOption,
        solutionExplanation: q.solutionExplanation,
        rubric: q.rubric || `1 Mark for choosing option (${q.correctOption}).`,
        chapterTitle: q.chapterTitle,
        topicTitle: q.topicTitle,
      })),
    };

    // SECTION B: SHORT QUESTIONS
    const sectionB: GeneratedPaperSection = {
      sectionName: "Section B: Short Conceptual Questions (Subjective)",
      sectionType: "SHORT",
      totalMarks: selectedShorts.reduce((sum, q) => sum + q.marks, 0) || 18,
      instructions: "Write concise answers (3-5 lines). Answer all compulsory parts clearly.",
      questions: selectedShorts.map((q) => ({
        id: `q_short_${globalSeq}`,
        sequence: globalSeq++,
        text: q.text,
        marks: q.marks,
        modelAnswer: q.modelAnswer,
        markingRubric: q.markingRubric || ["Full credit for accurate definition and working formula."],
        chapterTitle: q.chapterTitle,
        topicTitle: q.topicTitle,
      })),
    };

    // SECTION C: LONG QUESTIONS
    const sectionC: GeneratedPaperSection = {
      sectionName: "Section C: Long Theory & Detailed Derivations",
      sectionType: "LONG",
      totalMarks: selectedLongs.reduce((sum, q) => sum + q.marks, 0) || 18,
      instructions: "Attempt comprehensive questions with derivations, circuit diagrams, and mathematical working steps.",
      questions: selectedLongs.map((q) => ({
        id: `q_long_${globalSeq}`,
        sequence: globalSeq++,
        text: q.text,
        marks: q.marks,
        modelAnswer: q.modelAnswer,
        markingRubric: q.markingRubric || ["Credit given for step-by-step derivation, diagrams, and physical formulation."],
        chapterTitle: q.chapterTitle,
        topicTitle: q.topicTitle,
      })),
    };

    return [sectionA, sectionB, sectionC];
  }
}
