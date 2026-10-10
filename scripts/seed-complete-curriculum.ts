import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function withRetry<T>(fn: () => Promise<T>, retries = 5): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw new Error("Retry exhausted");
}


export const BOARDS = [
  { id: "board-fed-01", code: "FBISE", name: "Federal Board of Intermediate and Secondary Education", country: "Pakistan", region: "Islamabad" },
  { id: "board-punjab-lhr", code: "BISE_LHR", name: "Board of Intermediate and Secondary Education, Lahore", country: "Pakistan", region: "Punjab" },
  { id: "board-punjab-rwp", code: "BISE_RWP", name: "Board of Intermediate and Secondary Education, Rawalpindi", country: "Pakistan", region: "Punjab" },
  { id: "board-punjab-fsd", code: "BISE_FSD", name: "Board of Intermediate and Secondary Education, Faisalabad", country: "Pakistan", region: "Punjab" },
  { id: "board-punjab-grw", code: "BISE_GRW", name: "Board of Intermediate and Secondary Education, Gujranwala", country: "Pakistan", region: "Punjab" },
  { id: "board-punjab-mul", code: "BISE_MUL", name: "Board of Intermediate and Secondary Education, Multan", country: "Pakistan", region: "Punjab" },
  { id: "board-punjab-swl", code: "BISE_SWL", name: "Board of Intermediate and Secondary Education, Sahiwal", country: "Pakistan", region: "Punjab" },
  { id: "board-punjab-sgd", code: "BISE_SGD", name: "Board of Intermediate and Secondary Education, Sargodha", country: "Pakistan", region: "Punjab" },
  { id: "board-punjab-bwp", code: "BISE_BWP", name: "Board of Intermediate and Secondary Education, Bahawalpur", country: "Pakistan", region: "Punjab" },
  { id: "board-punjab-dgk", code: "BISE_DGK", name: "Board of Intermediate and Secondary Education, D.G. Khan", country: "Pakistan", region: "Punjab" },
];

export const CLASSES_CONFIG = [
  { numericLevel: 9, name: "Class 9 (SSC Part-I / Metric 9th)", codePrefix: "09" },
  { numericLevel: 10, name: "Class 10 (SSC Part-II / Metric 10th)", codePrefix: "10" },
  { numericLevel: 11, name: "Class 11 (HSSC Part-I / 1st Year / Inter)", codePrefix: "11" },
  { numericLevel: 12, name: "Class 12 (HSSC Part-II / 2nd Year / Inter)", codePrefix: "12" },
];

export const SUBJECTS_BY_CLASS: Record<number, Array<{ code: string; name: string; group: string; chapters: string[] }>> = {
  9: [
    {
      code: "PHY-09",
      name: "Physics (Science - Bio & Computer Group)",
      group: "Science",
      chapters: [
        "Physical Quantities and Measurement",
        "Kinematics",
        "Dynamics",
        "Turning Effect of Forces",
        "Gravitation",
        "Work and Energy",
        "Properties of Matter",
        "Thermal Properties of Matter",
        "Transfer of Heat",
      ],
    },
    {
      code: "CHM-09",
      name: "Chemistry (Science - Bio & Computer Group)",
      group: "Science",
      chapters: [
        "Fundamentals of Chemistry",
        "Structure of Atoms",
        "Periodic Table and Periodicity of Properties",
        "Structure of Molecules",
        "Physical States of Matter",
        "Solutions",
        "Electrochemistry",
        "Chemical Reactivity",
      ],
    },
    {
      code: "BIO-09",
      name: "Biology (Science - Bio Group)",
      group: "Science (Biology)",
      chapters: [
        "Introduction to Biology",
        "Solving a Biological Problem",
        "Biodiversity",
        "Cells and Tissues",
        "Cell Cycle (Mitosis & Meiosis)",
        "Enzymes",
        "Bioenergetics",
        "Nutrition",
        "Transport in Plants & Animals",
      ],
    },
    {
      code: "CS-09",
      name: "Computer Science (Science - Computer Group)",
      group: "Science (Computer)",
      chapters: [
        "Problem Solving & Flowcharts",
        "Binary System & Data Representation",
        "Networks & Protocols",
        "Data and Cyber Security",
        "Designing Website (HTML & CSS)",
      ],
    },
    {
      code: "MTH-09",
      name: "Mathematics (Science Group)",
      group: "Science",
      chapters: [
        "Matrices and Determinants",
        "Real and Complex Numbers",
        "Logarithms",
        "Algebraic Expressions and Formulas",
        "Factorization",
        "Algebraic Manipulation (HCF & LCM)",
        "Linear Equations and Inequalities",
        "Linear Graphs and Applications",
        "Introduction to Coordinate Geometry",
        "Congruent Triangles",
        "Parallelograms and Triangles",
        "Line Bisectors and Angle Bisectors",
        "Sides and Angles of a Triangle",
        "Ratio and Proportion",
        "Pythagoras' Theorem",
        "Theorems Related with Area",
        "Practical Geometry - Triangles",
      ],
    },
    {
      code: "ENG-09",
      name: "English Compulsory",
      group: "Compulsory",
      chapters: [
        "The Saviour of Mankind",
        "Patriotism",
        "Media and Its Impact",
        "Hazrat Asma (R.A)",
        "Daffodils (Poem)",
        "The Quaid's Vision and Pakistan",
        "Sultan Ahmad Mosque",
        "Stopping by Woods on a Snowy Evening",
        "All is not Lost",
        "Drug Addiction",
        "Noise in the Environment",
        "Three Days to See",
      ],
    },
    {
      code: "URD-09",
      name: "Urdu Compulsory",
      group: "Compulsory",
      chapters: [
        "Hijrat-e-Nabwi (S.A.W)",
        "Mirza Ghalib ke Aadat-o-Khasail",
        "Kahili",
        "Shaoor-e-Zindagi",
        "Nasoo aur Saleem ki Guftagu",
        "Panchayat",
        "Aram-o-Sakoon",
        "Lahoo aur Qaleen",
      ],
    },
    {
      code: "ISL-09",
      name: "Islamic Studies / Islamiat Compulsory",
      group: "Compulsory",
      chapters: [
        "Surah Al-Anfal (Verses & Translation)",
        "Hadees-e-Mubaraka (Selections 1-10)",
        "Tauheed and Risalat",
        "Quran Majeed: Taruf aur Fazilat",
        "Ilm ki Fazeelat",
        "Zakat aur Infanq fi Sabilillah",
      ],
    },
  ],
  10: [
    {
      code: "PHY-10",
      name: "Physics (Class 10 - Bio & Computer Group)",
      group: "Science",
      chapters: [
        "Simple Harmonic Motion and Waves",
        "Sound",
        "Geometrical Optics",
        "Electrostatics",
        "Current Electricity",
        "Electromagnetism",
        "Basic Electronics",
        "Information and Communication Technology (ICT)",
        "Atomic and Nuclear Physics",
      ],
    },
    {
      code: "CHM-10",
      name: "Chemistry (Class 10 - Bio & Computer Group)",
      group: "Science",
      chapters: [
        "Chemical Equilibrium",
        "Acids, Bases and Salts",
        "Organic Chemistry",
        "Hydrocarbons",
        "Biochemistry",
        "The Atmosphere",
        "Water",
        "Chemical Industries",
      ],
    },
    {
      code: "BIO-10",
      name: "Biology (Class 10 - Bio Group)",
      group: "Science (Biology)",
      chapters: [
        "Gaseous Exchange",
        "Homeostasis",
        "Coordination and Control",
        "Support and Movement",
        "Reproduction",
        "Inheritance",
        "Biotechnology",
        "Pharmacology",
        "Man and His Environment",
      ],
    },
    {
      code: "CS-10",
      name: "Computer Science (Class 10 - Computer Group)",
      group: "Science (Computer)",
      chapters: [
        "Introduction to Programming (C Language / Python)",
        "User Interface and Variables",
        "Conditional Logic (if-else, switch)",
        "Data Structures and Arrays",
        "Functions and Subroutines",
      ],
    },
    {
      code: "MTH-10",
      name: "Mathematics (Class 10 - Science Group)",
      group: "Science",
      chapters: [
        "Quadratic Equations",
        "Theory of Quadratic Equations",
        "Variations (Ratio, Proportion, Joint Variation)",
        "Partial Fractions",
        "Sets and Functions",
        "Basic Statistics",
        "Introduction to Trigonometry",
        "Projection of a Side of a Triangle",
        "Chords of a Circle",
        "Tangent to a Circle",
        "Chords and Arcs",
        "Angle in a Segment of a Circle",
        "Practical Geometry - Circles",
      ],
    },
    {
      code: "ENG-10",
      name: "English (Class 10 Compulsory)",
      group: "Compulsory",
      chapters: [
        "Hazrat Muhammad (S.A.W) An Embodiment of Justice",
        "Chinese New Year",
        "Try Again (Poem)",
        "First Aid",
        "The Rain (Poem)",
        "Television vs. Newspapers",
        "Little by Little One Walks Far",
        "Peace (Poem)",
        "Selecting the Right Career",
        "A World Without Books",
        "Great Expectations",
        "Faithfulness",
      ],
    },
    {
      code: "PAK-10",
      name: "Pakistan Studies (Class 10 Compulsory)",
      group: "Compulsory",
      chapters: [
        "History of Pakistan (Part-II: 1971 to Present)",
        "Foreign Policy of Pakistan",
        "Economic Development of Pakistan",
        "Population, Society and Culture of Pakistan",
      ],
    },
  ],
  11: [
    {
      code: "PHY-11",
      name: "Physics (1st Year - Pre-Medical, Pre-Engineering, ICS)",
      group: "Science / ICS",
      chapters: [
        "Measurements",
        "Vectors and Equilibrium",
        "Motion and Force",
        "Work and Energy",
        "Circular Motion",
        "Fluid Dynamics",
        "Oscillations",
        "Waves",
        "Physical Optics",
        "Optical Instruments",
        "Heat and Thermodynamics",
      ],
    },
    {
      code: "CHM-11",
      name: "Chemistry (1st Year - Pre-Medical & Pre-Engineering)",
      group: "FSc (Pre-Med / Pre-Eng)",
      chapters: [
        "Basic Concepts",
        "Experimental Techniques in Chemistry",
        "Gases",
        "Liquids and Solids",
        "Atomic Structure",
        "Chemical Bonding",
        "Thermochemistry",
        "Chemical Equilibrium",
        "Solutions",
        "Electrochemistry",
        "Reaction Kinetics",
      ],
    },
    {
      code: "BIO-11",
      name: "Biology (1st Year - FSc Pre-Medical)",
      group: "FSc Pre-Medical",
      chapters: [
        "Introduction to Biology",
        "Biological Molecules",
        "Enzymes",
        "The Cell",
        "Variety of Life (Viruses)",
        "Kingdom Prokaryotae (Bacteria)",
        "Kingdom Protista",
        "Fungi",
        "Kingdom Plantae",
        "Kingdom Animalia",
        "Bioenergetics",
        "Nutrition",
        "Gaseous Exchange",
        "Transport",
      ],
    },
    {
      code: "MTH-11",
      name: "Mathematics (1st Year - Pre-Engineering & ICS)",
      group: "Pre-Eng / ICS",
      chapters: [
        "Number Systems",
        "Sets, Functions and Groups",
        "Matrices and Determinants",
        "Quadratic Equations",
        "Partial Fractions",
        "Sequences and Series",
        "Permutation, Combination and Probability",
        "Mathematical Induction and Binomial Theorem",
        "Fundamentals of Trigonometry",
        "Trigonometric Identities and Sum/Difference Angles",
        "Trigonometric Functions and Their Graphs",
        "Application of Trigonometry",
        "Inverse Trigonometric Functions",
        "Solutions of Trigonometric Equations",
      ],
    },
    {
      code: "CS-11",
      name: "Computer Science (1st Year - ICS)",
      group: "ICS",
      chapters: [
        "Basics of Information Technology",
        "Information Networks",
        "Data Communications",
        "Applications and Uses of Computers",
        "Computer Architecture and CPU",
        "Security, Copyright and the Law",
        "Windows Operating System",
        "Word Processing",
        "Spreadsheet Software",
        "Fundamentals of the Internet",
      ],
    },
    {
      code: "STAT-11",
      name: "Statistics (1st Year - ICS Stats Group)",
      group: "ICS (Statistics)",
      chapters: [
        "Introduction to Statistics",
        "Representation of Data",
        "Measures of Central Tendency",
        "Measures of Dispersion",
        "Index Numbers",
        "Probability Theory",
        "Random Variables",
      ],
    },
    {
      code: "ENG-11",
      name: "English Compulsory (1st Year)",
      group: "Compulsory",
      chapters: [
        "Button, Button",
        "Clearing in the Sky",
        "Dark they were, and Golden-Eyed",
        "Thank You, M'am",
        "The Piece of String",
        "The Reward",
        "The Use of Force",
        "The Gulistan of Sa'di",
        "The Foolish Quack",
        "A Mild Attack of Locusts",
        "Plays (Heat Lightning, A Visit to a Small Planet, The Oyster and the Pearl)",
        "Poems (The Rain, Night Mail, Loveliest of Trees, O Where are you Going)",
      ],
    },
    {
      code: "URD-11",
      name: "Urdu Compulsory (1st Year)",
      group: "Compulsory",
      chapters: [
        "Uswa-e-Hasna (S.A.W)",
        "Apni Madad Aap",
        "Sir Syed Ahmad Khan ke Akhlaq-o-Khasail",
        "Adabi Khidmat",
        "Qissa Chahar Darwesh",
        "Ghazliat (Mir Taqi Mir, Khwaja Mir Dard, Ghalib, Iqbal)",
      ],
    },
    {
      code: "ISL-11",
      name: "Islamic Education (1st Year Compulsory)",
      group: "Compulsory",
      chapters: [
        "Bunyaadi Aqaid (Tauheed, Risalat, Akhirat)",
        "Ibaadaat (Namaz, Roza, Zakat, Hajj)",
        "Uswa-e-Rasool (S.A.W) Aur Huqooq-ul-Ibaad",
        "Quran Majeed Ka Taaruf Aur Hifazat",
      ],
    },
  ],
  12: [
    {
      code: "PHY-12",
      name: "Physics (2nd Year - Pre-Medical, Pre-Engineering, ICS)",
      group: "Science / ICS",
      chapters: [
        "Electrostatics",
        "Current Electricity",
        "Electromagnetism",
        "Electromagnetic Induction",
        "Alternating Current",
        "Physics of Solids",
        "Electronics",
        "Dawn of Modern Physics",
        "Atomic Spectra",
        "Nuclear Physics",
      ],
    },
    {
      code: "CHM-12",
      name: "Chemistry (2nd Year - Pre-Medical & Pre-Engineering)",
      group: "FSc (Pre-Med / Pre-Eng)",
      chapters: [
        "Periodic Classification of Elements and Periodicity",
        "s-Block Elements",
        "Group IIIA and Group IVA Elements",
        "Group VA and Group VIA Elements",
        "The Halogens and the Noble Gases",
        "Transition Elements",
        "Fundamental Principles of Organic Chemistry",
        "Aliphatic Hydrocarbons",
        "Aromatic Hydrocarbons",
        "Alkyl Halides",
        "Alcohols, Phenols and Ethers",
        "Aldehydes and Ketones",
        "Carboxylic Acids",
        "Macromolecules",
        "Common Chemical Industries in Pakistan",
        "Environmental Chemistry",
      ],
    },
    {
      code: "BIO-12",
      name: "Biology (2nd Year - FSc Pre-Medical)",
      group: "FSc Pre-Medical",
      chapters: [
        "Homeostasis",
        "Support and Movements",
        "Coordination and Control",
        "Reproduction",
        "Growth and Development",
        "Chromosomes and DNA",
        "Cell Cycle",
        "Variation and Genetics",
        "Biotechnology",
        "Evolution",
        "Ecosystem",
        "Some Major Ecosystems",
        "Man and His Environment",
      ],
    },
    {
      code: "MTH-12",
      name: "Mathematics (2nd Year - Pre-Engineering & ICS)",
      group: "Pre-Eng / ICS",
      chapters: [
        "Functions and Limits",
        "Differentiation (Derivatives & Applications)",
        "Integration (Definite & Indefinite Integrals)",
        "Introduction to Analytic Geometry (Straight Lines)",
        "Linear Inequalities and Linear Programming",
        "Conic Sections (Circle, Parabola, Ellipse, Hyperbola)",
        "Vectors",
      ],
    },
    {
      code: "CS-12",
      name: "Computer Science (2nd Year - ICS)",
      group: "ICS",
      chapters: [
        "Data Basics and Databases",
        "Basic Concepts and Terminology of Databases",
        "Database Design Process (ERD & Normalization)",
        "Data Integrity and Normalization",
        "Introduction to Microsoft Access",
        "Getting Started with C Language",
        "Elements of C",
        "Input and Output",
        "Decision Constructs (if, switch)",
        "Loop Constructs (for, while, do-while)",
        "Functions in C",
        "Pointers and File Handling in C",
      ],
    },
    {
      code: "STAT-12",
      name: "Statistics (2nd Year - ICS Stats Group)",
      group: "ICS (Statistics)",
      chapters: [
        "Normal Distribution",
        "Sampling and Sampling Distributions",
        "Estimation",
        "Hypothesis Testing",
        "Simple Linear Regression and Correlation",
        "Association of Attributes",
        "Analysis of Time Series",
      ],
    },
    {
      code: "ENG-12",
      name: "English Compulsory (2nd Year)",
      group: "Compulsory",
      chapters: [
        "The Dying Sun",
        "Using the Scientific Method",
        "Why Boys Fail in College",
        "End of Term",
        "On Destroying Books",
        "The Man Who Was a Hospital",
        "My Financial Career",
        "China's Way to Progress",
        "Hunger and Population Explosion",
        "The Jewel of the World",
        "Heroes (First Year at Harrow, Hitch-Hiking across Sahara, Sir Alexander Fleming, Louis Pasteur, Mustafa Kamal)",
        "Novel (Goodbye, Mr. Chips - Chapters 1 to 18)",
      ],
    },
    {
      code: "PAK-12",
      name: "Pakistan Studies (2nd Year Compulsory)",
      group: "Compulsory",
      chapters: [
        "Islam and Pakistan (Ideology & Two-Nation Theory)",
        "Political and Constitutional Development in Pakistan",
        "Administrative Setup and Good Governance",
        "Geographical Environment of Pakistan",
        "Economic Planning and Development",
        "Cultural Heritage of Pakistan",
        "Foreign Relations and International Standing",
      ],
    },
  ],
};

async function main() {
  console.log("🚀 Starting Complete Educational Hierarchy Seeding...");

  // 1. Seed Boards
  for (const b of BOARDS) {
    await prisma.board.upsert({
      where: { code: b.code },
      update: { name: b.name, country: b.country, region: b.region, status: "ACTIVE" },
      create: { id: b.id, code: b.code, name: b.name, country: b.country, region: b.region, status: "ACTIVE" },
    });
    console.log(`✓ Board ready: ${b.code}`);
  }

  // 2. Academic Session for each Board
  const academicYearMap: Record<string, string> = {};
  for (const b of BOARDS) {
    const ay = await prisma.academicYear.upsert({
      where: { boardId_code: { boardId: b.id, code: "2024-2025" } },
      update: { name: "Academic Session 2024-2025", status: "ACTIVE" },
      create: { boardId: b.id, code: "2024-2025", name: "Academic Session 2024-2025", status: "ACTIVE" },
    });
    academicYearMap[b.id] = ay.id;
  }

  // Use Federal Board session as primary anchor for shared curriculum
  const primaryYearId = academicYearMap["board-fed-01"];

  // 3. Seed Classes 9, 10, 11, 12
  const classMap: Record<number, string> = {};
  for (const cls of CLASSES_CONFIG) {
    const classEntity = await prisma.class.upsert({
      where: {
        academicYearId_numericLevel: {
          academicYearId: primaryYearId,
          numericLevel: cls.numericLevel,
        },
      },
      update: { name: cls.name, status: "ACTIVE" },
      create: {
        academicYearId: primaryYearId,
        name: cls.name,
        numericLevel: cls.numericLevel,
        status: "ACTIVE",
      },
    });
    classMap[cls.numericLevel] = classEntity.id;
    console.log(`✓ Class ready: ${cls.name} (ID: ${classEntity.id})`);
  }

  // 4. Seed Subjects, Books, Chapters and Topics
  for (const cls of CLASSES_CONFIG) {
    const classId = classMap[cls.numericLevel];
    const subjects = SUBJECTS_BY_CLASS[cls.numericLevel] || [];

    for (const subj of subjects) {
      const subjectEntity = await withRetry(() =>
        prisma.subject.upsert({
          where: {
            classId_code: {
              classId,
              code: subj.code,
            },
          },
          update: { name: subj.name, status: "ACTIVE" },
          create: {
            classId,
            code: subj.code,
            name: subj.name,
            status: "ACTIVE",
          },
        })
      );

      // Seed Prescribed Book for Punjab Boards (PCTB)
      const pctbBook = await withRetry(() =>
        prisma.book.upsert({
          where: { id: `book-pctb-${subj.code.toLowerCase()}` },
          update: {
            title: `${cls.numericLevel === 9 ? "Class 9 " : ""}${subj.name} (Punjab Curriculum & Textbook Board)`,
            status: "ACTIVE",
            version: "2024.PCTB",
          },
          create: {
            id: `book-pctb-${subj.code.toLowerCase()}`,
            boardId: "board-punjab-lhr",
            academicYearId: primaryYearId,
            classId,
            subjectId: subjectEntity.id,
            title: `${cls.numericLevel === 9 ? "Class 9 " : ""}${subj.name} (Punjab Curriculum & Textbook Board)`,
            version: "2024.PCTB",
            edition: "2024-2025 Edition",
            publisher: "Punjab Curriculum and Textbook Board, Lahore",
            author: "Curriculum Board Panel",
            status: "ACTIVE",
          },
        })
      );

      // Seed Prescribed Book for Federal Board (NBF)
      const nbfBook = await withRetry(() =>
        prisma.book.upsert({
          where: { id: `book-nbf-${subj.code.toLowerCase()}` },
          update: {
            title: `${cls.numericLevel === 9 ? "Class 9 " : ""}${subj.name} (National Book Foundation / Federal)`,
            status: "ACTIVE",
            version: "2024.NBF",
          },
          create: {
            id: `book-nbf-${subj.code.toLowerCase()}`,
            boardId: "board-fed-01",
            academicYearId: primaryYearId,
            classId,
            subjectId: subjectEntity.id,
            title: `${cls.numericLevel === 9 ? "Class 9 " : ""}${subj.name} (National Book Foundation / Federal)`,
            version: "2024.NBF",
            edition: "2024-2025 National Curriculum Edition",
            publisher: "National Book Foundation, Islamabad",
            author: "National Curriculum Council",
            status: "ACTIVE",
          },
        })
      );

      // Seed Chapters and Topics for both books
      const booksToSeed = [pctbBook, nbfBook];
      for (const book of booksToSeed) {
        for (let i = 0; i < subj.chapters.length; i++) {
          const chapTitle = subj.chapters[i];
          const chapNum = i + 1;
          const chapterId = `chap-${book.id}-${chapNum}`;

          const chapterEntity = await withRetry(() =>
            prisma.chapter.upsert({
              where: { id: chapterId },
              update: {
                title: chapTitle,
                chapterNumber: chapNum,
                orderIndex: chapNum,
                status: "ACTIVE",
              },
              create: {
                id: chapterId,
                bookId: book.id,
                chapterNumber: chapNum,
                title: chapTitle,
                orderIndex: chapNum,
                status: "ACTIVE",
              },
            })
          );

          // Seed default topics for each chapter
          const sampleTopics = [
            `Core Concepts of ${chapTitle}`,
            `Principles & Analytical Laws`,
            `Solved Examples & Model Problems`,
            `Review Exercises & Past Examination Queries`,
          ];

          for (let tIdx = 0; tIdx < sampleTopics.length; tIdx++) {
            const topicId = `top-${chapterEntity.id}-${tIdx + 1}`;
            await withRetry(() =>
              prisma.topic.upsert({
                where: { id: topicId },
                update: {
                  title: sampleTopics[tIdx],
                  orderIndex: tIdx + 1,
                  status: "ACTIVE",
                },
                create: {
                  id: topicId,
                  chapterId: chapterEntity.id,
                  title: sampleTopics[tIdx],
                  orderIndex: tIdx + 1,
                  status: "ACTIVE",
                },
              })
            );
          }
        }
      }


      console.log(`  ✓ Subject & Textbooks seeded: ${subj.code} (${subj.name}) - ${subj.chapters.length} chapters`);
    }
  }

  console.log("🎉 Complete Education Hierarchy Successfully Seeded in Neon PostgreSQL!");
}

main()
  .catch((e) => {
    console.error("Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
