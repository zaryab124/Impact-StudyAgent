// ==============================================================================
// Pakistan Educational Boards - Official Curriculum & Chapter Registry
// PBCC (Punjab Boards: Lahore, Rawalpindi, Faisalabad, Multan, Gujranwala,
// Sahiwal, Sargodha, Bahawalpur, D.G. Khan) and FBISE (Federal Board Islamabad)
// Classes: 9th, 10th, 11th (1st Year), 12th (2nd Year)
// ==============================================================================

export interface OfficialChapter {
  chapterNumber: number;
  title: string;
  urduTitle?: string;
  keyTopics: string[];
}

export interface SubjectCurriculum {
  classLevel: "9" | "10" | "11" | "12";
  subjectKey: string; // "PHY", "CHM", "BIO", "MTH", "CS", "ENG", "URD", "ISL", "PAK"
  subjectName: string;
  totalMarksBoard: number; // e.g. 60 (Science with practicals) or 75 (Math) or 85 (Inter Science) or 100
  timeAllowedMinutes: number;
  chapters: OfficialChapter[];
}

export const PAKISTAN_CURRICULUM_REGISTRY: SubjectCurriculum[] = [
  // ============================================================================
  // CLASS 9 (SSC PART-I)
  // ============================================================================
  {
    classLevel: "9",
    subjectKey: "PHY",
    subjectName: "Physics",
    totalMarksBoard: 60,
    timeAllowedMinutes: 120,
    chapters: [
      {
        chapterNumber: 1,
        title: "Physical Quantities and Measurement",
        urduTitle: "طبعی مقداریں اور پیمائش",
        keyTopics: ["Base and Derived Quantities", "SI Units", "Prefixes & Scientific Notation", "Vernier Callipers & Screw Gauge", "Significant Figures"],
      },
      {
        chapterNumber: 2,
        title: "Kinematics",
        urduTitle: "حرکیات (کائنی میٹکس)",
        keyTopics: ["Rest and Motion", "Scalars and Vectors", "Speed, Velocity, Acceleration", "Equations of Motion", "Freely Falling Bodies (g = 10 m/s²)"],
      },
      {
        chapterNumber: 3,
        title: "Dynamics",
        urduTitle: "ڈائنامکس",
        keyTopics: ["Force, Inertia, Momentum", "Newton's Laws of Motion (F=ma)", "Mass and Weight", "Law of Conservation of Momentum", "Friction", "Centripetal Force"],
      },
      {
        chapterNumber: 4,
        title: "Turning Effect of Forces",
        urduTitle: "فورسز کے گھماؤ کا اثر",
        keyTopics: ["Like and Unlike Parallel Forces", "Resolution of Forces", "Torque and Principle of Moments", "Centre of Mass & Gravity", "Conditions & States of Equilibrium"],
      },
      {
        chapterNumber: 5,
        title: "Gravitation",
        urduTitle: "گریوی ٹیشن",
        keyTopics: ["Law of Universal Gravitation", "Mass of the Earth (6.0 x 10²⁴ kg)", "Variation of g with Altitude", "Artificial Satellites & Orbital Velocity"],
      },
      {
        chapterNumber: 6,
        title: "Work and Energy",
        urduTitle: "ورک اور انرجی",
        keyTopics: ["Work (W=Fd)", "Kinetic and Potential Energy", "Interconversion of Energy", "Major Sources of Energy", "Efficiency and Power (P=W/t)"],
      },
      {
        chapterNumber: 7,
        title: "Properties of Matter",
        urduTitle: "مادے کی خصوصیات",
        keyTopics: ["Kinetic Molecular Model", "Density and Pressure", "Pascal's Law and Hydraulic Lift", "Archimedes Principle and Upthrust", "Hooke's Law and Young's Modulus"],
      },
      {
        chapterNumber: 8,
        title: "Thermal Properties of Matter",
        urduTitle: "مادے کی حرارتی خصوصیات",
        keyTopics: ["Temperature and Heat", "Specific Heat Capacity (Q=mcΔT)", "Latent Heat of Fusion and Vaporization", "Evaporation", "Thermal Expansion of Solids"],
      },
      {
        chapterNumber: 9,
        title: "Transfer of Heat",
        urduTitle: "حرارت کا انتقال",
        keyTopics: ["Conduction and Thermal Conductivity", "Convection and Convection Currents", "Radiation and Leslie's Cube", "Greenhouse Effect"],
      },
    ],
  },
  {
    classLevel: "9",
    subjectKey: "CHM",
    subjectName: "Chemistry",
    totalMarksBoard: 60,
    timeAllowedMinutes: 120,
    chapters: [
      {
        chapterNumber: 1,
        title: "Fundamentals of Chemistry",
        urduTitle: "کیمسٹری کے بنیادی اصول",
        keyTopics: ["Branches of Chemistry", "Elements, Compounds & Mixtures", "Atomic Number & Mass Number", "Chemical Formula & Valency", "Avogadro's Number and Mole"],
      },
      {
        chapterNumber: 2,
        title: "Structure of Atoms",
        urduTitle: "ایٹم کی ساخت",
        keyTopics: ["Rutherford's Atomic Model", "Bohr's Atomic Theory", "Electronic Configuration (s, p, d, f)", "Isotopes and Their Applications"],
      },
      {
        chapterNumber: 3,
        title: "Periodic Table and Periodicity of Properties",
        urduTitle: "پیریڈک ٹیبل اور خصوصیات کی پیریوڈیسٹی",
        keyTopics: ["Periods and Groups", "Periodic Trends: Atomic Radius, Shielding Effect", "Ionization Energy", "Electron Affinity", "Electronegativity"],
      },
      {
        chapterNumber: 4,
        title: "Structure of Molecules",
        urduTitle: "مالیکیولز کی ساخت",
        keyTopics: ["Octet Rule and Chemical Bonds", "Ionic Bond", "Covalent Bond (Single, Double, Triple)", "Coordinate Covalent Bond", "Hydrogen Bonding & Intermolecular Forces"],
      },
      {
        chapterNumber: 5,
        title: "Physical States of Matter",
        urduTitle: "مادے کی طبعی حالتیں",
        keyTopics: ["Gaseous State: Diffusion, Effusion, Pressure", "Boyle's Law & Charles's Law", "Liquid State: Evaporation, Vapour Pressure, Boiling Point", "Solids and Allotropy"],
      },
      {
        chapterNumber: 6,
        title: "Solutions",
        urduTitle: "سلوشنز",
        keyTopics: ["Solute and Solvent", "Saturated, Unsaturated & Supersaturated Solutions", "Molarity and Percentage Concentration", "Solubility and Like-Dissolves-Like", "Colloids and Suspensions"],
      },
      {
        chapterNumber: 7,
        title: "Electrochemistry",
        urduTitle: "الیکٹرو کیمسٹری",
        keyTopics: ["Oxidation and Reduction", "Rules for Assigning Oxidation Numbers", "Electrolytic and Galvanic Cells", "Manufacture of Sodium (Down's Cell)", "Corrosion, Rusting & Electroplating"],
      },
      {
        chapterNumber: 8,
        title: "Chemical Reactivity",
        urduTitle: "کیمیکل ری ایکٹیویٹی",
        keyTopics: ["Metals and Electropositivity", "Alkali vs Alkaline Earth Metals", "Inertness of Noble Metals", "Non-Metals and Halogens Reactivity"],
      },
    ],
  },
  {
    classLevel: "9",
    subjectKey: "BIO",
    subjectName: "Biology",
    totalMarksBoard: 60,
    timeAllowedMinutes: 120,
    chapters: [
      {
        chapterNumber: 1,
        title: "Introduction to Biology",
        urduTitle: "حیاتیات کا تعارف",
        keyTopics: ["Divisions and Branches of Biology", "Relationship of Biology with Other Sciences", "Quran and Biology", "Levels of Biological Organization"],
      },
      {
        chapterNumber: 2,
        title: "Solving a Biological Problem",
        urduTitle: "حیاتیاتی مسئلہ کا حل",
        keyTopics: ["Biological Method Steps", "Study of Malaria (Ronald Ross experiments)", "Hypothesis, Deduction and Testing", "Theory, Law and Principle"],
      },
      {
        chapterNumber: 3,
        title: "Biodiversity",
        urduTitle: "حیاتیاتی تنوع (بائیو ڈائیورسٹی)",
        keyTopics: ["Importance of Biodiversity", "Five Kingdom Classification (Whittaker)", "Binomial Nomenclature (Linnaeus)", "Conservation and Endangered Species in Pakistan"],
      },
      {
        chapterNumber: 4,
        title: "Cells and Tissues",
        urduTitle: "سیلز اور ٹشوز",
        keyTopics: ["Light and Electron Microscopy", "Cell Organelles: Nucleus, Mitochondria, Ribosomes, Chloroplasts", "Prokaryotic vs Eukaryotic Cells", "Fluid Mosaic Model", "Animal and Plant Tissues"],
      },
      {
        chapterNumber: 5,
        title: "Cell Cycle",
        urduTitle: "سیل سائیکل",
        keyTopics: ["Interphase (G1, S, G2)", "Mitosis Phases: Prophase, Metaphase, Anaphase, Telophase", "Significance of Mitosis", "Meiosis & Crossing Over", "Apoptosis and Necrosis"],
      },
      {
        chapterNumber: 6,
        title: "Enzymes",
        urduTitle: "انزائمز",
        keyTopics: ["Characteristics of Enzymes", "Activation Energy", "Mechanism of Enzyme Action (Lock & Key vs Induced Fit)", "Factors: Temperature, pH, Substrate Concentration"],
      },
      {
        chapterNumber: 7,
        title: "Bioenergetics",
        urduTitle: "بائیو اینرجیٹکس",
        keyTopics: ["Role of ATP", "Photosynthesis: Light Reactions (Z-scheme) and Dark Reactions (Calvin Cycle)", "Respiration: Glycolysis, Krebs Cycle, Electron Transport Chain", "Aerobic vs Anaerobic (Fermentation)"],
      },
      {
        chapterNumber: 8,
        title: "Nutrition",
        urduTitle: "غذائیت (نیوٹریشن)",
        keyTopics: ["Components of Food (Carbohydrates, Lipids, Proteins, Vitamins)", "Balanced Diet and Malnutrition", "Human Alimentary Canal Digestion", "Liver, Pancreas and Disorders of Gut"],
      },
      {
        chapterNumber: 9,
        title: "Transport",
        urduTitle: "ٹرانسپورٹ",
        keyTopics: ["Transpiration and Factors Affecting It", "Translocation (Pressure-Flow Hypothesis)", "Human Blood, ABO and Rh System", "Heart Structure and Cardiac Cycle", "Blood Vessels and Cardiovascular Disorders"],
      },
    ],
  },
  {
    classLevel: "9",
    subjectKey: "MTH",
    subjectName: "Mathematics",
    totalMarksBoard: 75,
    timeAllowedMinutes: 150,
    chapters: [
      {
        chapterNumber: 1,
        title: "Matrices and Determinants",
        urduTitle: "قالب اور ان کے مقطعات",
        keyTopics: ["Types of Matrices", "Addition, Subtraction and Multiplication of Matrices", "Determinant and Adjoint of 2x2 Matrix", "Matrix Inversion Method", "Cramer's Rule"],
      },
      {
        chapterNumber: 2,
        title: "Real and Complex Numbers",
        urduTitle: "حقیقی اور غیر حقیقی (کمپلیکس) اعداد",
        keyTopics: ["Properties of Real Numbers", "Radicals and Radicands", "Laws of Exponents", "Complex Numbers: a + bi", "Conjugate and Operations"],
      },
      {
        chapterNumber: 3,
        title: "Logarithms",
        urduTitle: "لوگارتھم",
        keyTopics: ["Scientific Notation", "Characteristic and Mantissa", "Laws of Logarithms: log(ab), log(a/b), log(aⁿ)", "Calculations with Log and Antilog Tables"],
      },
      {
        chapterNumber: 4,
        title: "Algebraic Expressions and Formulas",
        urduTitle: "الجبرائی جملے اور کلیے",
        keyTopics: ["Algebraic Identities: (a+b)², (a-b)², (a+b)³", "Value finding: a² + b², a³ + b³", "Surds and Rationalization of Denominators"],
      },
      {
        chapterNumber: 5,
        title: "Factorization",
        urduTitle: "تجزی (فیکٹرائزیشن)",
        keyTopics: ["Factorization Techniques (Taking Common, Grouping, Mid-Term Breaking)", "Remainder Theorem and Factor Theorem", "Factorization of Cubic Polynomials"],
      },
      {
        chapterNumber: 6,
        title: "Algebraic Manipulation",
        urduTitle: "الجبرائی جملوں کے اقلیدسی عمل",
        keyTopics: ["Highest Common Factor (HCF) by Factorization & Division", "Least Common Multiple (LCM)", "Square Root of Algebraic Expressions"],
      },
      {
        chapterNumber: 7,
        title: "Linear Equations and Inequalities",
        urduTitle: "یک درجی مساواتیں اور غیر مساواتیں",
        keyTopics: ["Linear Equations with One Variable", "Equations Involving Absolute Values |x|", "Linear Inequalities and Number Line"],
      },
      {
        chapterNumber: 8,
        title: "Linear Graphs & Their Applications",
        urduTitle: "لینیئر گراف اور ان کے اطلاقات",
        keyTopics: ["Cartesian Plane and Ordered Pairs", "Plotting Linear Graphs (y = mx + c)", "Conversion Graphs (Celsius to Fahrenheit, Miles to Kilometers)"],
      },
      {
        chapterNumber: 9,
        title: "Introduction to Coordinate Geometry",
        urduTitle: "کوآرڈینیٹ جیومیٹری کا تعارف",
        keyTopics: ["Distance Formula: d = √[(x₂-x₁)² + (y₂-y₁)²]", "Collinear Points", "Mid-point Formula: [(x₁+x₂)/2, (y₁+y₂)/2]"],
      },
      {
        chapterNumber: 12,
        title: "Line Bisectors and Angle Bisectors (Theorems)",
        urduTitle: "قطعات خط اور زاویوں کے ناصف (مسئلے)",
        keyTopics: ["Theorem 12.1.1 (Right bisector theorem)", "Theorem 12.1.2 (Converse)", "Theorem 12.1.4 (Angle bisector theorem) - Compulsory Board Theorems"],
      },
    ],
  },
  {
    classLevel: "9",
    subjectKey: "CS",
    subjectName: "Computer Science",
    totalMarksBoard: 50,
    timeAllowedMinutes: 120,
    chapters: [
      {
        chapterNumber: 1,
        title: "Problem Solving",
        urduTitle: "مسئلہ کا حل (پرابلم سالونگ)",
        keyTopics: ["Problem Solving Steps", "Flowcharts: Symbols & Construction", "Algorithms and Efficiency", "Verification vs Validation", "Trace Tables"],
      },
      {
        chapterNumber: 2,
        title: "Binary System",
        urduTitle: "بائنری سسٹم",
        keyTopics: ["Number Systems (Binary, Decimal, Hexadecimal)", "Conversions Between Systems", "Memory and Data Storage (Bit, Byte, KB, MB, GB)", "Boolean Logic and Truth Tables (AND, OR, NOT)"],
      },
      {
        chapterNumber: 3,
        title: "Networks",
        urduTitle: "کمپیوٹر نیٹ ورکس",
        keyTopics: ["Need for Computer Networks", "Network Topologies (Star, Bus, Ring, Mesh)", "TCP/IP 5-Layer Protocol Suite", "IP Addressing (IPv4 vs IPv6)", "Routers and Client-Server Architecture"],
      },
      {
        chapterNumber: 4,
        title: "Data and Cyber Security",
        urduTitle: "ڈیٹا اور سائبر سیکیورٹی",
        keyTopics: ["Confidentiality, Integrity, Availability (CIA)", "Cyber Crimes: Phishing, Hacking, Identity Theft", "Malware, Viruses, Worms", "Encryption and Caesar Cipher"],
      },
      {
        chapterNumber: 5,
        title: "Designing Website (HTML)",
        urduTitle: "ویب سائٹ ڈیزائننگ",
        keyTopics: ["HTML Document Structure (Head, Body)", "Text Formatting Tags (b, i, u, h1-h6)", "Hyperlinks and Images", "Creating HTML Tables and Lists"],
      },
    ],
  },
  {
    classLevel: "9",
    subjectKey: "ENG",
    subjectName: "English Compulsory",
    totalMarksBoard: 75,
    timeAllowedMinutes: 150,
    chapters: [
      { chapterNumber: 1, title: "The Saviour of Mankind (P.B.U.H)", keyTopics: ["Textual Comprehension", "Vocabulary and Synonyms", "Theme of Islam and Guidance"] },
      { chapterNumber: 2, title: "Patriotism", keyTopics: ["Definition of Patriotism", "Quaid-e-Azam's Love for Country", "Modal Verbs"] },
      { chapterNumber: 3, title: "Media and Its Impact", keyTopics: ["Electronic vs Print Media", "Constructive Role of Media", "Pronouns and Antecedents"] },
      { chapterNumber: 4, title: "Hazrat Asma (R.A)", keyTopics: ["Role in Migration (Hijrah)", "Courage, Generosity and Faith", "Abstract Nouns"] },
      { chapterNumber: 5, title: "Daffodils (Poem by William Wordsworth)", keyTopics: ["Poetic Devices (Simile, Metaphor)", "Paraphrasing of Stanzas", "Summary Writing"] },
      { chapterNumber: 6, title: "The Quaid's Vision and Pakistan", keyTopics: ["Golden Principles (Unity, Faith, Discipline)", "National Integration", "Conditional Sentences"] },
      { chapterNumber: 7, title: "Sultan Ahmad Mosque (Blue Mosque)", keyTopics: ["Islamic Architecture", "Historical Significance", "Adjectives and Degrees"] },
      { chapterNumber: 8, title: "Stopping by Woods on a Snowy Evening (Poem)", keyTopics: ["Symbolism and Imagery", "Stanza Explanation", "Summary Writing"] },
      { chapterNumber: 9, title: "All is Not Lost", keyTopics: ["Dedication of Nursing Profession", "Humanitarian Spirit", "Direct and Indirect Speech"] },
      { chapterNumber: 10, title: "Drug Addiction", keyTopics: ["Causes of Drug Abuse", "Rehabilitation and Treatment", "Prepositions and Conjunctions"] },
      { chapterNumber: 11, title: "Noise in the Environment", keyTopics: ["Sources of Noise Pollution", "Effects on Mental and Physical Health", "Active and Passive Voice"] },
      { chapterNumber: 12, title: "Three Days to See (Helen Keller)", keyTopics: ["Value of Senses", "Appreciation of Nature", "Essay and Letter Writing"] },
    ],
  },
  {
    classLevel: "9",
    subjectKey: "URD",
    subjectName: "Urdu Compulsory",
    totalMarksBoard: 75,
    timeAllowedMinutes: 150,
    chapters: [
      { chapterNumber: 1, title: "ہجرتِ نبوی ﷺ (مولانا شبلی نعمانی)", keyTopics: ["سیاق و سباق", "خلاصہ", "کفار کی سازشیں اور سفرِ مدینہ"] },
      { chapterNumber: 2, title: "مرزا غالب کے عادات و خصائل (مولانا الطاف حسین حالی)", keyTopics: ["اخلاق و مروت", "دوستوں سے محبت", "ظرافت و مزاح"] },
      { chapterNumber: 3, title: "کاہلی (سر سید احمد خان)", keyTopics: ["دلی قویٰ کو بیکار چھوڑنا", "قوم کی اصلاح کا پیغام", "خلاصہ"] },
      { chapterNumber: 4, title: "شاعروں کے لطیفے (مولانا محمد حسین آزاد)", keyTopics: ["ادبی لطائف", "شعراء کی بذلہ سنجی", "پیرایۂ بیان"] },
      { chapterNumber: 5, title: "نصوح اور سلیم کی گفتگو (ڈپٹی نذیر احمد)", keyTopics: ["تربیتِ اولاد", "کھیلوں اور لڈو سے کنارہ کشی", "نصیحتیں"] },
      { chapterNumber: 6, title: "پنچایت (منشی پریم چند)", keyTopics: ["الگو چودھری اور جمن شیخ", "انصاف کی بالادستی", "کردار نگاری"] },
      { chapterNumber: 7, title: "آرام و سکون (سید امتیاز علی تاج)", keyTopics: ["ڈراما نگاری", "گھریلو بے سکونی", "طنز و مزاح"] },
      { chapterNumber: 8, title: "حمد اور نعت (اشعار کی تشریح)", keyTopics: ["خواجہ الطاف حسین حالی", "امیر مینائی", "مرکزی خیال اور تشریح"] },
      { chapterNumber: 9, title: "غزلیات (میر تقی میر، آتش، غالب، اقبال)", keyTopics: ["مطلع اور مقطع", "ردیف و قافیہ", "عاشقانہ و فلسفیانہ مضامین"] },
    ],
  },
  {
    classLevel: "9",
    subjectKey: "PAK",
    subjectName: "Pakistan Studies",
    totalMarksBoard: 50,
    timeAllowedMinutes: 120,
    chapters: [
      { chapterNumber: 1, title: "Ideological Basis of Pakistan (نظریاتی اساس)", keyTopics: ["Two-Nation Theory (دو قومی نظریہ)", "Quaid-e-Azam & Allama Iqbal pronouncements", "Islamic values"] },
      { chapterNumber: 2, title: "Making of Pakistan 1857-1947 (تحریکِ پاکستان)", keyTopics: ["Aligarh Movement (Sir Syed)", "Shimla Deputation 1906", "Lahore Resolution 1940", "3rd June 1947 Plan"] },
      { chapterNumber: 3, title: "Land and Environment (زمین اور ماحول)", keyTopics: ["Location and Borders of Pakistan", "Physiography (Mountains, Plateaus, Plains)", "Climate and Natural Resources", "Environmental hazards"] },
      { chapterNumber: 4, title: "History of Pakistan Part-I (1947-1971)", keyTopics: ["Early Problems of Pakistan", "Objective Resolution 1949", "Constitution of 1956 & 1962", "1965 War"] },
    ],
  },

  // ============================================================================
  // CLASS 10 (SSC PART-II)
  // ============================================================================
  {
    classLevel: "10",
    subjectKey: "PHY",
    subjectName: "Physics",
    totalMarksBoard: 60,
    timeAllowedMinutes: 120,
    chapters: [
      {
        chapterNumber: 10,
        title: "Simple Harmonic Motion and Waves",
        urduTitle: "سمپل ہارمونک موشن اور ویوز",
        keyTopics: ["Mass Attached to a Spring", "Simple Pendulum (T = 2π√(l/g))", "Wave Motion: Transverse vs Longitudinal", "Ripple Tank: Reflection, Refraction, Diffraction"],
      },
      {
        chapterNumber: 11,
        title: "Sound",
        urduTitle: "آواز (ساؤنڈ)",
        keyTopics: ["Sound Production and Propagation", "Characteristics: Pitch, Loudness, Quality", "Speed of Sound", "Echo and Reverberation", "Ultrasound and Medical Applications"],
      },
      {
        chapterNumber: 12,
        title: "Geometrical Optics",
        urduTitle: "جیومیٹریکل آپٹکس",
        keyTopics: ["Reflection: Spherical Mirrors (Concave/Convex)", "Mirror Formula: 1/f = 1/p + 1/q", "Snell's Law: n = sin(i)/sin(r)", "Total Internal Reflection & Critical Angle", "Optical Fibres & Lenses"],
      },
      {
        chapterNumber: 13,
        title: "Electrostatics",
        urduTitle: "الیکٹرو سٹیٹکس",
        keyTopics: ["Electric Charges and Induction", "Coulomb's Law: F = k(q₁q₂)/r²", "Electric Field & Electric Potential", "Capacitors & Capacitance (Q = CV)", "Series and Parallel Combination of Capacitors"],
      },
      {
        chapterNumber: 14,
        title: "Current Electricity",
        urduTitle: "کرنٹ الیکٹریسٹی",
        keyTopics: ["Electric Current (I = Q/t)", "Ohm's Law: V = IR", "Resistors in Series and Parallel", "Joule's Law (W = I²Rt)", "Electric Power and Kilowatt-hour", "Safe Use of Electricity (Fuse, Earth wire)"],
      },
      {
        chapterNumber: 15,
        title: "Electromagnetism",
        urduTitle: "الیکٹرو میگنیٹزم",
        keyTopics: ["Magnetic Effect of Current", "Force on Current-Carrying Conductor (F = ILB)", "Turning Effect on Coil and D.C. Motor", "Electromagnetic Induction & Faraday's Law", "Lenz's Law & Transformer (Vs/Vp = Ns/Np)"],
      },
      {
        chapterNumber: 16,
        title: "Basic Electronics",
        urduTitle: "بنیادی الیکٹرانکس",
        keyTopics: ["Thermionic Emission and Cathode Rays", "Analogue and Digital Electronics", "Logic Gates: AND, OR, NOT", "Universal Gates: NAND and NOR Gates with Truth Tables"],
      },
      {
        chapterNumber: 17,
        title: "Information and Communication Technology (ICT)",
        urduTitle: "معلومات اور مواصلاتی ٹیکنالوجی",
        keyTopics: ["Components of ICT", "Transmission of Electrical Signals & Optical Fibres", "Data Storage Devices (Hard disk, Flash drive)", "Internet, Email, Risks of ICT"],
      },
      {
        chapterNumber: 18,
        title: "Atomic and Nuclear Physics",
        urduTitle: "ایٹمی اور نیوکلیائی فزکس",
        keyTopics: ["Atomic Nucleus and Isotopes", "Natural Radioactivity (Alpha, Beta, Gamma)", "Half-Life and Radioactive Decay", "Nuclear Fission and Nuclear Fusion", "Hazards of Radiation and Safety Precautions"],
      },
    ],
  },
  {
    classLevel: "10",
    subjectKey: "CHM",
    subjectName: "Chemistry",
    totalMarksBoard: 60,
    timeAllowedMinutes: 120,
    chapters: [
      { chapterNumber: 9, title: "Chemical Equilibrium", keyTopics: ["Reversible Reactions", "Dynamic Equilibrium", "Law of Mass Action", "Equilibrium Constant Kc"] },
      { chapterNumber: 10, title: "Acids, Bases and Salts", keyTopics: ["Arrhenius, Bronsted-Lowry & Lewis Concepts", "pH Scale and Indicators", "Preparation and Properties of Salts"] },
      { chapterNumber: 11, title: "Organic Chemistry", keyTopics: ["Organic Compounds", "Functional Groups", "Isomerism", "Homologous Series"] },
      { chapterNumber: 12, title: "Hydrocarbons", keyTopics: ["Alkanes (Combustion, Halogenation)", "Alkenes (Hydrogenation, Addition)", "Alkynes (Combustion, Oxidation with KMnO₄)"] },
      { chapterNumber: 13, title: "Biochemistry", keyTopics: ["Carbohydrates (Mono, Di, Polysaccharides)", "Proteins and Amino Acids", "Lipids and Fatty Acids", "Nucleic Acids (DNA & RNA)"] },
      { chapterNumber: 14, title: "The Atmosphere", keyTopics: ["Layers of Atmosphere (Troposphere, Stratosphere)", "Air Pollutants (CO, SO₂, NOx)", "Acid Rain", "Ozone Depletion"] },
      { chapterNumber: 15, title: "Water", keyTopics: ["Properties of Water", "Soft and Hard Water (Temporary vs Permanent Hardness)", "Methods of Removing Hardness", "Waterborne Diseases"] },
      { chapterNumber: 16, title: "Chemical Industries", keyTopics: ["Basic Metallurgical Operations", "Manufacture of Sodium Carbonate (Solvay's Process)", "Manufacture of Urea", "Petroleum Refining"] },
    ],
  },
  {
    classLevel: "10",
    subjectKey: "BIO",
    subjectName: "Biology",
    totalMarksBoard: 60,
    timeAllowedMinutes: 120,
    chapters: [
      { chapterNumber: 10, title: "Gaseous Exchange", keyTopics: ["Gaseous Exchange in Plants (Stomata)", "Human Respiratory System", "Mechanism of Breathing", "Respiratory Disorders (Bronchitis, Emphysema)"] },
      { chapterNumber: 11, title: "Homeostasis", keyTopics: ["Osmoregulation, Thermoregulation, Excretion", "Human Urinary System (Kidney Structure & Nephron)", "Osmoregulatory Function of Kidney", "Kidney Stones & Dialysis"] },
      { chapterNumber: 12, title: "Coordination and Control", keyTopics: ["Nervous vs Chemical Coordination", "Neuron Structure and Reflex Arc", "Human Brain and Spinal Cord", "Endocrine Glands (Pituitary, Thyroid, Pancreas)"] },
      { chapterNumber: 13, title: "Support and Movement", keyTopics: ["Human Skeleton (Axial and Appendicular)", "Bone and Cartilage", "Joints (Ball-and-Socket, Hinge)", "Muscles and Antagonistic Movement (Biceps/Triceps)"] },
      { chapterNumber: 14, title: "Reproduction", keyTopics: ["Asexual Reproduction (Binary Fission, Budding, Vegetative)", "Sexual Reproduction in Plants (Pollination)", "Seed Structure and Germination"] },
      { chapterNumber: 15, title: "Inheritance", keyTopics: ["Chromosomes and Genes (DNA Replication)", "Mendel's Laws of Segregation and Independent Assortment", "Co-dominance and Incomplete Dominance", "Artificial Selection"] },
      { chapterNumber: 16, title: "Man and His Environment", keyTopics: ["Ecosystem Components (Biotic and Abiotic)", "Food Chains and Food Webs", "Symbiosis (Mutualism, Commensalism, Parasitism)", "Biogeochemical Cycles (Carbon, Nitrogen)"] },
      { chapterNumber: 17, title: "Biotechnology", keyTopics: ["Fermentation and Fermenters", "Genetic Engineering Steps and Objectives", "Single Cell Protein (SCP)"] },
      { chapterNumber: 18, title: "Pharmacology", keyTopics: ["Medicinal Drugs and Synthetic Drugs", "Antibiotics and Antibiotic Resistance", "Vaccines and Modes of Action", "Drug Addiction"] },
    ],
  },
  {
    classLevel: "10",
    subjectKey: "MTH",
    subjectName: "Mathematics",
    totalMarksBoard: 75,
    timeAllowedMinutes: 150,
    chapters: [
      { chapterNumber: 1, title: "Quadratic Equations", keyTopics: ["Standard Form ax² + bx + c = 0", "Solving by Factorization", "Completing Square", "Quadratic Formula: x = (-b ± √(b²-4ac))/(2a)"] },
      { chapterNumber: 2, title: "Theory of Quadratic Equations", keyTopics: ["Discriminant (b² - 4ac)", "Nature of Roots", "Cube Roots of Unity (1, ω, ω²)", "Relations Between Roots and Coefficients (Sum & Product)"] },
      { chapterNumber: 3, title: "Variations", keyTopics: ["Direct and Inverse Variation", "Joint Variation", "Theorem on Proportions (Componendo-Dividendo)", "k-Method"] },
      { chapterNumber: 4, title: "Partial Fractions", keyTopics: ["Proper and Improper Fractions", "Resolution into Partial Fractions (Linear non-repeated, Repeated linear, Quadratic factors)"] },
      { chapterNumber: 5, title: "Sets and Functions", keyTopics: ["Operations on Sets (Union, Intersection, Difference)", "De Morgan's Laws: (A∪B)' = A'∩B'", "Binary Relations and Functions (Injective, Surjective, Bijective)"] },
      { chapterNumber: 6, title: "Basic Statistics", keyTopics: ["Frequency Distribution", "Measures of Central Tendency (Arithmetic Mean, Median, Mode)", "Measures of Dispersion (Range, Standard Deviation, Variance)"] },
      { chapterNumber: 7, title: "Introduction to Trigonometry", keyTopics: ["Measurement of Angles (Sexagesimal & Radian)", "Relationship l = rθ", "Trigonometric Ratios (sin, cos, tan)", "Fundamental Identities: sin²θ + cos²θ = 1", "Angle of Elevation and Depression"] },
      { chapterNumber: 9, title: "Chords of a Circle (Theorems)", keyTopics: ["Theorem 9.1: Perpendicular from center to chord bisects it", "Theorem 9.2: Chords equidistant from center are congruent (Compulsory Board Theorem)"] },
    ],
  },
  {
    classLevel: "10",
    subjectKey: "CS",
    subjectName: "Computer Science",
    totalMarksBoard: 50,
    timeAllowedMinutes: 120,
    chapters: [
      { chapterNumber: 1, title: "Introduction to Programming (C)", keyTopics: ["Programming Languages", "Compiler vs Interpreter", "Structure of C Program", "Variables, Data Types (int, float, char)", "Constants"] },
      { chapterNumber: 2, title: "User Interaction", keyTopics: ["Standard Input / Output", "printf() and Format Specifiers (%d, %f, %c)", "Escape Sequences (\\n, \\t)", "scanf() and Address Operator (&)"] },
      { chapterNumber: 3, title: "Conditional Logic", keyTopics: ["Control Structures", "Relational and Logical Operators", "if Statement, if-else Statement", "Nested if and else-if Ladder", "switch Statement"] },
      { chapterNumber: 4, title: "Data and Repetition (Loops)", keyTopics: ["Looping Structures", "for Loop with Counter Variable", "while Loop and do-while Loop", "Nested Loops", "Factorial, Fibonacci and Prime Number Programs"] },
      { chapterNumber: 5, title: "Functions in C", keyTopics: ["Need for Functions", "Built-in Functions vs User-Defined Functions", "Function Definition, Declaration and Call", "Arguments and Return Values"] },
    ],
  },
  {
    classLevel: "10",
    subjectKey: "PAK",
    subjectName: "Pakistan Studies",
    totalMarksBoard: 50,
    timeAllowedMinutes: 120,
    chapters: [
      { chapterNumber: 5, title: "History of Pakistan Part-II (1971 to Present)", keyTopics: ["Zulfiqar Ali Bhutto Era & 1973 Constitution", "Nationalization Policy", "General Zia-ul-Haq Era and Islamization", "Nuclear Program of Pakistan (1998 Chagai Tests)", "Restoration of Democracy & Contemporary Challenges"] },
      { chapterNumber: 6, title: "Pakistan in World Affairs (Foreign Policy)", keyTopics: ["Objectives of Pakistan's Foreign Policy", "Relations with Neighboring Countries (China, India, Afghanistan, Iran)", "Kashmir Dispute and International Community", "Pakistan and the Muslim World (OIC)", "Relations with Major World Powers (USA, Russia, European Union)"] },
      { chapterNumber: 7, title: "Economic Development of Pakistan", keyTopics: ["Economic Sectors: Agriculture, Industry, Services", "Major Mineral and Energy Resources", "International Trade, Major Exports and Imports", "China-Pakistan Economic Corridor (CPEC) and Infrastructure Development"] },
      { chapterNumber: 8, title: "Population, Society and Culture of Pakistan", keyTopics: ["Demographic Characteristics and Literacy in Pakistan", "Cultural Diversity and Regional Heritage", "Urdu as a National Language and National Cohesion", "Social Welfare, Health and Educational Reforms"] },
    ],
  },

  // ============================================================================
  // 1ST YEAR / CLASS 11 (HSSC PART-I)
  // ============================================================================
  {
    classLevel: "11",
    subjectKey: "PHY",
    subjectName: "Physics",
    totalMarksBoard: 85,
    timeAllowedMinutes: 180,
    chapters: [
      { chapterNumber: 1, title: "Measurements", keyTopics: ["Physical Quantities & Dimensions", "Precision and Accuracy", "Assessment of Total Uncertainty in Final Result", "Dimensional Analysis (Homogeneity)"] },
      { chapterNumber: 2, title: "Vectors and Equilibrium", keyTopics: ["Vector Addition by Rectangular Components", "Scalar Product (Dot Product: A·B = AB cos θ)", "Vector Product (Cross Product: A x B = AB sin θ n̂)", "Torque and Equilibrium Conditions"] },
      { chapterNumber: 3, title: "Motion and Force", keyTopics: ["Displacement-Time and Velocity-Time Graphs", "Newton's Laws & Momentum (F = Δp/Δt)", "Elastic Collisions in One Dimension", "Projectile Motion: Height, Time of Flight, Maximum Range (θ = 45°)"] },
      { chapterNumber: 4, title: "Work and Energy", keyTopics: ["Work Done by Constant & Variable Force", "Work Done in Gravitational Field", "Absolute Potential Energy: U = -GMm/r", "Escape Velocity: vesc = √(2gR)", "Interconversion of P.E and K.E"] },
      { chapterNumber: 5, title: "Circular Motion", keyTopics: ["Angular Displacement, Velocity and Acceleration", "Centripetal Force & Centripetal Acceleration (ac = v²/r = rω²)", "Geostationary Satellites & Orbital Radius", "Real and Apparent Weight", "Artificial Gravity"] },
      { chapterNumber: 6, title: "Fluid Dynamics", keyTopics: ["Viscous Drag & Stokes' Law (F = 6πηrv)", "Terminal Velocity: vt = 2gr²ρ/(9η)", "Equation of Continuity (A₁v₁ = A₂v₂)", "Bernoulli's Equation: P + 1/2ρv² + ρgh = constant", "Torricelli's Theorem & Venturi Relation"] },
      { chapterNumber: 7, title: "Oscillations", keyTopics: ["Simple Harmonic Motion & Uniform Circular Motion", "Phase and Angular Frequency", "Horizontal and Vertical Spring-Mass System", "Simple Pendulum", "Energy Conservation in SHM", "Damped Oscillations & Resonance"] },
      { chapterNumber: 8, title: "Waves", keyTopics: ["Progressive Waves (Transverse and Longitudinal)", "Speed of Sound: Newton's Formula & Laplace Correction", "Principle of Superposition & Interference", "Stationary Waves in Stretched Strings & Organ Pipes", "Doppler Effect"] },
      { chapterNumber: 9, title: "Physical Optics", keyTopics: ["Wavefronts & Huygens' Principle", "Young's Double Slit Experiment (Fringe Width)", "Interference in Thin Films & Newton's Rings", "Michelson Interferometer", "Diffraction of Light & Diffraction Grating", "Polarization"] },
      { chapterNumber: 10, title: "Optical Instruments", keyTopics: ["Least Distance of Distinct Vision", "Magnifying Power & Resolving Power", "Simple Microscope & Compound Microscope", "Astronomical Telescope", "Spectrometer and Optical Fibres"] },
      { chapterNumber: 11, title: "Heat and Thermodynamics", keyTopics: ["Kinetic Theory of Gases (P = 2/3 N₀ <1/2 mv²>)", "First Law of Thermodynamics (Q = ΔU + W)", "Molar Specific Heats (Cp - Cv = R)", "Carnot Engine & Carnot Cycle", "Second Law of Thermodynamics & Entropy"] },
    ],
  },
  {
    classLevel: "11",
    subjectKey: "CHM",
    subjectName: "Chemistry",
    totalMarksBoard: 85,
    timeAllowedMinutes: 180,
    chapters: [
      { chapterNumber: 1, title: "Basic Concepts (Stoichiometry)", keyTopics: ["Mole and Molar Volume", "Limiting Reactant", "Theoretical and Actual Yield", "Combustion Analysis", "Stoichiometric Calculations"] },
      { chapterNumber: 3, title: "Gases", keyTopics: ["Gas Laws: Boyle, Charles, Avogadro", "Ideal Gas Equation (PV = nRT)", "Dalton's Law of Partial Pressures", "Graham's Law of Diffusion", "Kinetic Molecular Theory & Real Gas Non-ideality (Van der Waals Equation)"] },
      { chapterNumber: 4, title: "Liquids and Solids", keyTopics: ["Intermolecular Forces (Dipole-Dipole, London Forces, Hydrogen Bonding)", "Evaporation and Vapour Pressure", "Crystal Lattice and Unit Cell", "Types of Solids (Ionic, Covalent, Molecular, Metallic)"] },
      { chapterNumber: 5, title: "Atomic Structure", keyTopics: ["Discovery of Electron, Proton and Neutron", "Planck's Quantum Theory", "Bohr's Model & Hydrogen Spectrum", "De Broglie's Hypothesis & Heisenberg Uncertainty Principle", "Quantum Numbers & Electronic Configuration"] },
      { chapterNumber: 6, title: "Chemical Bonding", keyTopics: ["Valence Bond Theory (VBT) and Hybridization (sp, sp², sp³)", "VSEPR Theory for Molecular Geometry", "Molecular Orbital Theory (MOT) for Homonuclear Diatomic Molecules", "Bond Order and Magnetic Behavior"] },
      { chapterNumber: 7, title: "Thermochemistry", keyTopics: ["System, Surroundings and State Functions", "First Law of Thermodynamics & Enthalpy (ΔH = ΔE + PΔV)", "Hess's Law of Constant Heat Summation", "Born-Haber Cycle for Lattice Energy"] },
      { chapterNumber: 8, title: "Chemical Equilibrium", keyTopics: ["Equilibrium Expressions (Kc, Kp, Kx, Kn)", "Le Chatelier's Principle (Effect of Temp, Pressure, Conc)", "Ionization of Water and pH", "Buffer Solutions and Buffer Capacity", "Solubility Product (Ksp)"] },
      { chapterNumber: 9, title: "Solutions", keyTopics: ["Concentration Units (Molarity, Molality, Mole Fraction, ppm)", "Raoult's Law (Ideal & Non-ideal Solutions)", "Colligative Properties (Boiling Point Elevation, Freezing Point Depression, Osmotic Pressure)"] },
      { chapterNumber: 10, title: "Electrochemistry", keyTopics: ["Electrochemical Cells and Cell Potential (E°cell)", "Standard Hydrogen Electrode (SHE)", "Electrochemical Series and Its Applications", "Fuel Cells and Modern Batteries"] },
      { chapterNumber: 11, title: "Reaction Kinetics", keyTopics: ["Rate of Reaction and Rate Law", "Order of Reaction and Half-Life Method", "Arrhenius Equation for Activation Energy", "Catalysis (Homogeneous and Heterogeneous)"] },
    ],
  },
  {
    classLevel: "11",
    subjectKey: "BIO",
    subjectName: "Biology",
    totalMarksBoard: 85,
    timeAllowedMinutes: 180,
    chapters: [
      { chapterNumber: 1, title: "Introduction", keyTopics: ["Biological Organization", "Integrated Disease Management", "Cloning and Protection of Environment"] },
      { chapterNumber: 2, title: "Biological Molecules", keyTopics: ["Structure of Water & Carbon", "Carbohydrates: Monosaccharides to Polysaccharides", "Proteins and Peptide Bond Formation", "Lipids (Acylglycerols, Phospholipids, Terpenoids)", "Nucleic Acids (DNA Double Helix, RNA Types)"] },
      { chapterNumber: 3, title: "Enzymes", keyTopics: ["Enzyme Structure and Active Site", "Cofactors and Coenzymes", "Lock and Key vs Induced Fit Model", "Competitive and Non-competitive Inhibitors"] },
      { chapterNumber: 4, title: "The Cell", keyTopics: ["Fluid Mosaic Model of Plasma Membrane", "Endoplasmic Reticulum, Golgi Complex, Lysosomes (Autophagy, Storage diseases)", "Peroxisomes, Glyoxysomes, Mitochondria, Chloroplasts", "Prokaryotic vs Eukaryotic Comparison"] },
      { chapterNumber: 5, title: "Variety of Life", keyTopics: ["Acellular Life: Viruses", "Bacteriophage: Lytic Cycle and Lysogenic Cycle", "HIV and AIDS Structure and Infection Cycle", "Hepatitis and Prions"] },
      { chapterNumber: 6, title: "Kingdom Prokaryotae (Monera)", keyTopics: ["Discovery and Structure of Bacteria", "Gram-Positive vs Gram-Negative Cell Wall", "Bacterial Nutrition, Respiration and Reproduction", "Control of Bacteria and Antibiotics"] },
      { chapterNumber: 11, title: "Bioenergetics", keyTopics: ["Chlorophyll and Absorption Spectra", "Light Reactions (Non-cyclic Photophosphorylation / Z-scheme)", "Calvin Cycle (Carbon Fixation, Reduction, Regeneration)", "Glycolysis, Krebs Cycle, Oxidative Phosphorylation"] },
      { chapterNumber: 14, title: "Transport", keyTopics: ["Water Potential and Transpiration Pull", "Phloem Translocation (Pressure Flow Mechanism)", "Human Circulatory System (Cardiac Cycle, ECG)", "Immune System: Humoral and Cell-Mediated Immunity"] },
    ],
  },
  {
    classLevel: "11",
    subjectKey: "MTH",
    subjectName: "Mathematics",
    totalMarksBoard: 100,
    timeAllowedMinutes: 180,
    chapters: [
      { chapterNumber: 1, title: "Number Systems", keyTopics: ["Complex Numbers Properties", "De Moivre's Theorem", "Polar Form of Complex Numbers"] },
      { chapterNumber: 3, title: "Matrices and Determinants", keyTopics: ["Properties of Determinants (Cofactors, Expansions)", "Rank and Echelon Form of Matrix", "System of Linear Equations (Gaussian Elimination, Gauss-Jordan)"] },
      { chapterNumber: 4, title: "Quadratic Equations", keyTopics: ["Synthetic Division", "Cube Roots and Fourth Roots of Unity", "System of Equations with Quadratics"] },
      { chapterNumber: 6, title: "Sequences and Series", keyTopics: ["Arithmetic Progression (AP)", "Geometric Progression (GP) and Infinite Geometric Series", "Harmonic Progression (HP)", "Arithmetic, Geometric and Harmonic Means"] },
      { chapterNumber: 7, title: "Permutation, Combination & Probability", keyTopics: ["Fundamental Principle of Counting", "Permutations (nPr)", "Combinations (nCr)", "Probability Laws: Addition and Multiplication Laws"] },
      { chapterNumber: 8, title: "Mathematical Induction & Binomial Theorem", keyTopics: ["Principle of Mathematical Induction", "Binomial Theorem for Positive Integral Index", "Binomial Theorem for Rational Index"] },
      { chapterNumber: 9, title: "Fundamentals of Trigonometry", keyTopics: ["Radian Measure and Sector Area", "Signs of Trigonometric Functions in Quadrants", "Fundamental Trigonometric Identities"] },
      { chapterNumber: 10, title: "Trigonometric Identities", keyTopics: ["Fundamental Law of Cosine: cos(α-β)", "Deductions: Double Angle, Half Angle, Triple Angle Formulas", "Product to Sum and Sum to Product Formulas"] },
      { chapterNumber: 12, title: "Application of Trigonometry", keyTopics: ["Law of Cosines, Law of Sines, Law of Tangents", "Half Angle Formulas", "Circles Connected with Triangles (Incircle, Circumcircle, Escribed Circles)"] },
    ],
  },
  {
    classLevel: "11",
    subjectKey: "CS",
    subjectName: "Computer Science (ICS)",
    totalMarksBoard: 75,
    timeAllowedMinutes: 180,
    chapters: [
      { chapterNumber: 1, title: "Basics of Information Technology", keyTopics: ["Hardware, Software, Firmware", "Input/Output Devices", "System Units and Memory (RAM, ROM, Cache)"] },
      { chapterNumber: 2, title: "Information Networks", keyTopics: ["Workgroup Computing and Networking", "LAN, WAN, MAN", "Network Standards (Ethernet, Token Ring)", "OSI 7-Layer Reference Model", "Network Topologies and Hubs/Switches"] },
      { chapterNumber: 3, title: "Data Communications", keyTopics: ["Data Transmission Modes (Simplex, Half-Duplex, Full-Duplex)", "Analog and Digital Transmission", "Transmission Media (Guided: Twisted Pair, Coaxial, Fibre; Unguided: Microwave, Satellite)"] },
      { chapterNumber: 5, title: "Computer Architecture", keyTopics: ["CPU Components (ALU, CU, Registers)", "System Bus (Data Bus, Address Bus, Control Bus)", "Instruction Cycle (Fetch, Decode, Execute)", "Interrupts and DMA"] },
      { chapterNumber: 6, title: "Security, Copyright and the Law", keyTopics: ["Security Threats (Virus, Worm, Trojan Horse)", "Antivirus Protection", "Data Privacy and Copyright Infringement Laws"] },
    ],
  },
  {
    classLevel: "11",
    subjectKey: "STAT",
    subjectName: "Statistics",
    totalMarksBoard: 85,
    timeAllowedMinutes: 180,
    chapters: [
      { chapterNumber: 1, title: "Introduction to Statistics", keyTopics: ["Population and Sample", "Parameter and Statistic", "Discrete and Continuous Variables", "Primary and Secondary Data", "Scales of Measurement"] },
      { chapterNumber: 2, title: "Representation of Data", keyTopics: ["Classification and Tabulation", "Frequency Distribution (Class Limits, Class Boundaries)", "Histogram and Frequency Polygon", "Cumulative Frequency Curve (Ogive)", "Pie Chart"] },
      { chapterNumber: 3, title: "Measures of Central Tendency", keyTopics: ["Arithmetic Mean: Direct and Short-cut Methods", "Properties of Arithmetic Mean", "Median for Ungrouped and Grouped Data", "Mode and Empirical Relation (Mean - Mode = 3(Mean - Median))", "Geometric Mean and Harmonic Mean"] },
      { chapterNumber: 4, title: "Measures of Dispersion", keyTopics: ["Range and Coefficient of Range", "Quartile Deviation and Semi-Interquartile Range", "Mean Deviation from Mean and Median", "Variance and Standard Deviation", "Coefficient of Variation (C.V = (S / X̄) * 100%)"] },
      { chapterNumber: 5, title: "Index Numbers", keyTopics: ["Simple and Composite Index Numbers", "Laspeyre's, Paasche's, and Fisher's Ideal Index", "Consumer Price Index (CPI)", "Tests of Consistency"] },
      { chapterNumber: 6, title: "Probability", keyTopics: ["Random Experiment and Sample Space", "Events: Mutually Exclusive, Independent, Exhaustive", "Classical and Relative Frequency Probability", "Addition Law of Probability", "Multiplication Law of Probability"] },
      { chapterNumber: 7, title: "Random Variables", keyTopics: ["Discrete and Continuous Random Variables", "Probability Mass Function P(X = x)", "Expected Value E(X)", "Variance of Random Variable Var(X) = E(X²) - [E(X)]²"] },
      { chapterNumber: 8, title: "Binomial and Hypergeometric Distributions", keyTopics: ["Bernoulli Trials", "Binomial Distribution P(X = x) = ⁿCₓ pˣ qⁿ⁻ˣ", "Mean and Variance of Binomial Distribution (μ = np, σ² = npq)", "Hypergeometric Distribution"] },
    ],
  },

  // ============================================================================
  // 2ND YEAR / CLASS 12 (HSSC PART-II)
  // ============================================================================
  {
    classLevel: "12",
    subjectKey: "PHY",
    subjectName: "Physics",
    totalMarksBoard: 85,
    timeAllowedMinutes: 180,
    chapters: [
      { chapterNumber: 12, title: "Electrostatics", keyTopics: ["Coulomb's Law in Vector Form", "Electric Flux (Φ = E·A)", "Gauss's Law (Φ = Q/ε₀) and Applications (Infinite Sheet, Between Plates)", "Electric Potential (V = kq/r)", "Capacitance of Parallel Plate Capacitor & Dielectrics"] },
      { chapterNumber: 13, title: "Current Electricity", keyTopics: ["Microscopic View of Current & Drift Velocity", "Resistivity and Temperature Dependence (α)", "Kirchhoff's First and Second Rules", "Wheatstone Bridge Principle", "Potentiometer as Potential Divider & Unknown EMF Measurement"] },
      { chapterNumber: 14, title: "Electromagnetism", keyTopics: ["Magnetic Force on Moving Charge (F = q(v x B))", "Magnetic Force on Current Conductor", "Ampere's Circuital Law & Solenoid Field", "Torque on Current Loop", "Galvanometer Conversion to Ammeter and Voltmeter"] },
      { chapterNumber: 15, title: "Electromagnetic Induction", keyTopics: ["Induced EMF and Faraday's Law", "Lenz's Law and Energy Conservation", "Motional EMF (e = -vBL)", "Self-Induction and Mutual Induction", "A.C. Generator Working and Back EMF in Motors"] },
      { chapterNumber: 16, title: "Alternating Current", keyTopics: ["A.C. Voltage and Current (Peak, RMS Values)", "A.C. Through Resistor, Inductor and Capacitor", "Impedance and R-L-C Series Resonance Circuit", "Power in A.C. Circuits (Power Factor)"] },
      { chapterNumber: 17, title: "Physics of Solids", keyTopics: ["Mechanical Properties: Stress, Strain, Moduli of Elasticity", "Strain Energy in Deformed Wire", "Band Theory of Solids (Conductors, Semiconductors, Insulators)", "Superconductors and Magnetic Properties of Solids (Hysteresis Loop)"] },
      { chapterNumber: 18, title: "Electronics", keyTopics: ["p-n Junction Diode and Forward/Reverse Biasing", "Rectification (Half-Wave and Full-Wave Rectifier)", "Transistor Characteristics and CE Configuration", "Operational Amplifier (Inverting, Non-Inverting, Comparator, Night Switch)"] },
      { chapterNumber: 19, title: "Dawn of Modern Physics", keyTopics: ["Special Theory of Relativity Postulates", "Black Body Radiation and Planck's Quantum Theory", "Photoelectric Effect and Einstein's Equation", "Compton Effect (Compton Shift Δλ)", "De Broglie Wavelength & Davisson-Germer Experiment"] },
      { chapterNumber: 20, title: "Atomic Spectra", keyTopics: ["Bohr's Postulates for Hydrogen Atom", "Quantized Radii and Energy Levels: En = -13.6/n² eV", "Hydrogen Emission Spectral Series (Lyman, Balmer, Paschen)", "Production and Properties of X-Rays", "Laser Principles (Stimulated Emission, Population Inversion)"] },
      { chapterNumber: 21, title: "Nuclear Physics", keyTopics: ["Mass Defect and Binding Energy Curve", "Radioactive Decay Law and Half-Life Calculations", "Radiation Detectors (Geiger-Muller Counter, Solid State Detector)", "Nuclear Fission, Chain Reaction and Nuclear Reactors", "Nuclear Fusion in Stars"] },
    ],
  },
  {
    classLevel: "12",
    subjectKey: "CHM",
    subjectName: "Chemistry",
    totalMarksBoard: 85,
    timeAllowedMinutes: 180,
    chapters: [
      { chapterNumber: 1, title: "Periodic Classification of Elements", keyTopics: ["Modern Periodic Table", "Periodic Trends across Periods and Groups", "Hydrides, Halides and Oxides Trends"] },
      { chapterNumber: 7, title: "Fundamental Principles of Organic Chemistry", keyTopics: ["Vital Force Theory & Wöhler's Synthesis", "Classification of Organic Compounds", "Functional Groups and Homologous Series", "Isomerism: Structural and Cis-Trans Geometric Isomerism"] },
      { chapterNumber: 8, title: "Aliphatic Hydrocarbons", keyTopics: ["Alkanes Synthesis and Halogenation Mechanism", "Alkenes: Kolbe's Electrolysis, Markownikoff's Rule", "Alkynes: Preparation and Acidic Nature of Acetylene"] },
      { chapterNumber: 9, title: "Aromatic Hydrocarbons (Benzene)", keyTopics: ["Kekule Structure & Modern Orbital View of Benzene", "Resonance Energy and Stability of Benzene", "Electrophilic Aromatic Substitution (Nitration, Sulphonation, Friedel-Crafts)", "Orientation in Disubstituted Benzenes"] },
      { chapterNumber: 10, title: "Alkyl Halides", keyTopics: ["SN1 vs SN2 Mechanisms", "E1 vs E2 Elimination Reactions", "Grignard Reagent Preparation and Reactions with Aldehydes/Ketones/CO₂"] },
      { chapterNumber: 11, title: "Alcohols, Phenols and Ethers", keyTopics: ["Fermentation for Ethanol", "Distinction of Primary, Secondary, Tertiary Alcohols (Lucas Test)", "Acidity of Phenol vs Alcohol", "Preparation and Reactions of Ethers"] },
      { chapterNumber: 12, title: "Aldehydes and Ketones", keyTopics: ["Nucleophilic Addition Reactions (HCN, NaHSO₃)", "Aldol Condensation and Cannizzaro's Reaction", "Fehling's Solution and Tollens' Test"] },
      { chapterNumber: 13, title: "Carboxylic Acids", keyTopics: ["Acidity and Resonance Stabilization of Carboxylate Ion", "Conversion to Esters, Amides, Acid Chlorides", "Amino Acids and Zwitterion Structure"] },
      { chapterNumber: 15, title: "Common Chemical Industries in Pakistan", keyTopics: ["Fertilizers: Urea, Ammonium Nitrate, Phosphatic Fertilizers", "Portland Cement Manufacture", "Paper and Pulp Manufacturing Process"] },
    ],
  },
  {
    classLevel: "12",
    subjectKey: "BIO",
    subjectName: "Biology",
    totalMarksBoard: 85,
    timeAllowedMinutes: 180,
    chapters: [
      { chapterNumber: 15, title: "Homeostasis", keyTopics: ["Osmoregulation in Plants and Animals", "Excretion in Animals: Nitrogenous Waste Products", "Human Excretory System: Nephron and Counter-Current Multiplier", "Thermoregulation in Mammals"] },
      { chapterNumber: 16, title: "Support and Movement", keyTopics: ["Support in Plants: Turgor Pressure and Collenchyma", "Human Axial and Appendicular Skeleton", "Sliding Filament Model of Muscle Contraction", "Muscle Fatigue and Tetany"] },
      { chapterNumber: 17, title: "Coordination and Control", keyTopics: ["Action Potential Generation and Synaptic Transmission", "Brain Parts and Autonomic Nervous System", "Plant Hormones (Auxins, Gibberellins, Cytokinins, Abscisic acid)", "Endocrine Feedback Mechanisms"] },
      { chapterNumber: 18, title: "Reproduction", keyTopics: ["Photoperiodism and Vernalization in Plants", "Male and Female Reproductive Systems in Humans", "Female Menstrual and Ovarian Cycles", "Sexually Transmitted Diseases"] },
      { chapterNumber: 20, title: "Chromosomes and DNA", keyTopics: ["Structure of Chromosome and Nucleosome", "Meselson-Stahl Experiment for Semiconservative Replication", "Transcription: RNA Polymerase and mRNA Processing", "Genetic Code and Translation at Ribosomes"] },
      { chapterNumber: 22, title: "Variation and Genetics", keyTopics: ["Gene Linkage and Crossing Over", "Sex-Linked Inheritance in Drosophila and Humans (Hemophilia, Color blindness)", "Multiple Alleles and Epistasis", "Continuous and Discontinuous Variations"] },
      { chapterNumber: 23, title: "Biotechnology", keyTopics: ["Recombinant DNA Technology Tools (Restriction Enzymes, Plasmids)", "Polymerase Chain Reaction (PCR) and Gel Electrophoresis", "DNA Fingerprinting and Transgenic Organisms", "Gene Therapy"] },
    ],
  },
  {
    classLevel: "12",
    subjectKey: "MTH",
    subjectName: "Mathematics",
    totalMarksBoard: 100,
    timeAllowedMinutes: 180,
    chapters: [
      { chapterNumber: 1, title: "Functions and Limits", keyTopics: ["Domain and Range of Functions", "Evaluation of Limits at Infinity", "Important Limit: lim(θ→0) (sin θ / θ) = 1", "Continuity of Functions at a Point"] },
      { chapterNumber: 2, title: "Differentiation", keyTopics: ["Derivative by First Principle (ab-initio method)", "Product, Quotient and Chain Rules", "Derivatives of Trigonometric, Exponential and Logarithmic Functions", "Implicit Differentiation", "Maxima and Minima of Functions"] },
      { chapterNumber: 3, title: "Integration", keyTopics: ["Indefinite Integrals and Standard Formulas", "Integration by Substitution", "Integration by Parts: ∫u v dx = u ∫v dx - ∫[u' ∫v dx] dx", "Definite Integrals and Fundamental Theorem of Calculus", "Area Under the Curve"] },
      { chapterNumber: 4, title: "Introduction to Analytic Geometry", keyTopics: ["Slope of a Line: m = (y₂-y₁)/(x₂-x₁)", "Equation of Straight Line (Point-Slope, Two-Point, Slope-Intercept, Intercept forms)", "Perpendicular Distance from Point to Line", "Angle Between Two Lines"] },
      { chapterNumber: 6, title: "Conic Sections", keyTopics: ["Equation of Circle (Standard and General Form)", "Parabola: Vertex, Focus, Directrix, Latus Rectum", "Ellipse: Major/Minor Axes, Eccentricity (e < 1), Foci", "Hyperbola: Asymptotes, Foci (e > 1)"] },
      { chapterNumber: 7, title: "Vectors", keyTopics: ["Vectors in Plane and Space", "Dot Product (A·B) and Cross Product (A x B)", "Scalar Triple Product: a·(b x c) and Volume of Parallelepiped", "Vector Triple Product"] },
    ],
  },
  {
    classLevel: "12",
    subjectKey: "CS",
    subjectName: "Computer Science (ICS)",
    totalMarksBoard: 75,
    timeAllowedMinutes: 180,
    chapters: [
      { chapterNumber: 1, title: "Databases & MS Access Basics", keyTopics: ["Traditional File System vs DBMS", "Relational Database Concepts (Tables, Records, Fields)", "Primary Key, Foreign Key, Composite Key"] },
      { chapterNumber: 2, title: "Data Modeling & Normalization", keyTopics: ["Entity Relationship Diagram (ERD)", "Functional Dependency", "Normalization: 1NF, 2NF, 3NF and Anomalies"] },
      { chapterNumber: 8, title: "Getting Started with C", keyTopics: ["History of C", "C Compiler and Linker", "Structure of C Program", "Header Files and preprocessor directives"] },
      { chapterNumber: 11, title: "Decision Structures in C", keyTopics: ["if, if-else, nested if", "switch-case structure", "Conditional Operator ?:"] },
      { chapterNumber: 12, title: "Loop Structures in C", keyTopics: ["for Loop", "while Loop", "do-while Loop", "break and continue statements"] },
      { chapterNumber: 13, title: "Functions in C", keyTopics: ["User-defined functions", "Call by value vs Call by reference", "Local vs Global variables", "Recursion in C"] },
      { chapterNumber: 14, title: "File Handling in C", keyTopics: ["Streams and File Pointers (FILE*)", "fopen(), fclose(), fprintf(), fscanf()", "Sequential vs Random access files"] },
    ],
  },
  {
    classLevel: "12",
    subjectKey: "PAK",
    subjectName: "Pakistan Studies (Compulsory)",
    totalMarksBoard: 50,
    timeAllowedMinutes: 120,
    chapters: [
      { chapterNumber: 1, title: "Islam and Pakistan (اسلام اور پاکستان)", keyTopics: ["Ideological Basis of Pakistan", "Two-Nation Theory and Islamic Values", "Principles of Democracy and Social Justice in Islam", "Role of Quaid-e-Azam Muhammad Ali Jinnah and Allama Muhammad Iqbal"] },
      { chapterNumber: 2, title: "Political and Constitutional Genesis (سیاسی اور آئینی ارتقاء)", keyTopics: ["Early Problems of Pakistan 1947-1948 (Radcliffe Award, Refugees, Canal Water Dispute)", "Objectives Resolution 1949 and its Historic Importance", "Islamic Provisions of the Constitution of 1973", "Federal Structure, Parliament, and Constitutional Amendments"] },
      { chapterNumber: 3, title: "Geographical Landscape and Environmental Resources of Pakistan (زمین، ماحول اور قدرتی وسائل)", keyTopics: ["Geostrategic and Geopolitical Location of Pakistan", "Physiographic Divisions: Northern Mountains (K2, Nanga Parbat), Plateaus, Indus Plains", "Climate Zones, Monsoon Rainfall Patterns, and River Indus Basin Irrigation", "Environmental Challenges: Deforestation, Water Scarcity, and Conservation"] },
      { chapterNumber: 4, title: "Economic Planning and Resource Development (معاشی منصوبہ بندی اور ترقی)", keyTopics: ["Role of Agriculture in National Economy: Major Cash Crops (Wheat, Cotton, Rice, Sugarcane)", "Industrial Sector: Textiles, Cement, Fertilizer, Sugar", "Energy Crisis and Resources: Hydel (Tarbela, Mangla), Thermal, Nuclear Energy (PAEC, KANUPP, CHASNUPP)", "China-Pakistan Economic Corridor (CPEC), Gwadar Port, Trade Balance"] },
      { chapterNumber: 5, title: "Pakistan in International Affairs and Foreign Policy (خارجہ پالیسی اور بین الاقوامی تعلقات)", keyTopics: ["Guiding Principles and Cardinal Objectives of Pakistan's Foreign Policy", "Relations with Immediate Neighbors: China, Afghanistan, India (Kashmir Issue), Iran", "Pakistan and the Muslim World: Organization of Islamic Cooperation (OIC)", "Pakistan's Constructive Role in the United Nations (UN Peacekeeping Missions)"] },
      { chapterNumber: 6, title: "Culture, Heritage, and Regional Languages of Pakistan (ثقافتی ورثہ اور علاقائی زبانیں)", keyTopics: ["Urdu Language: Origin, Evolution, and Role as Symbol of National Unity", "Regional Languages of Pakistan: Punjabi (Waris Shah), Sindhi (Shah Abdul Latif Bhittai), Pashto (Khushal Khan Khattak), Balochi (Jam Darag)", "Archaeological Heritage: Mohenjo-Daro, Harappa, Gandhara Civilization (Taxila)", "Islamic Architectural Monuments, Folk Arts, and National Festivals"] },
      { chapterNumber: 7, title: "National Integration, Prosperity and Welfare State (قومی یکجہتی اور فلاحی ریاست)", keyTopics: ["Concept of Islamic Welfare State and Good Governance", "Education, Technical Literacy, and Human Capital Formation", "Civic Rights, Minority Protection, and National Integration in Pakistan"] },
    ],
  },
];

export class PakistanCurriculumService {
  /**
   * Returns all chapters for a given class and subject.
   */
  public static getChapters(classLevel: string, subjectCodeOrName: string): OfficialChapter[] {
    const normClass = this.normalizeClass(classLevel);
    const normSub = this.normalizeSubject(subjectCodeOrName);

    const match = PAKISTAN_CURRICULUM_REGISTRY.find(
      (c) => c.classLevel === normClass && c.subjectKey === normSub
    );

    return match ? match.chapters : [];
  }

  /**
   * Returns subject metadata including total board marks and duration.
   */
  public static getSubjectMetadata(classLevel: string, subjectCodeOrName: string) {
    const normClass = this.normalizeClass(classLevel);
    const normSub = this.normalizeSubject(subjectCodeOrName);

    const match = PAKISTAN_CURRICULUM_REGISTRY.find(
      (c) => c.classLevel === normClass && c.subjectKey === normSub
    );

    if (match) {
      return {
        classLevel: match.classLevel,
        subjectKey: match.subjectKey,
        subjectName: match.subjectName,
        totalMarks: match.totalMarksBoard,
        durationMinutes: match.timeAllowedMinutes,
        totalChapters: match.chapters.length,
      };
    }

    return {
      classLevel: normClass,
      subjectKey: normSub,
      subjectName: subjectCodeOrName,
      totalMarks: 60,
      durationMinutes: 120,
      totalChapters: 9,
    };
  }

  public static normalizeClass(c?: string): "9" | "10" | "11" | "12" {
    if (!c) return "9";
    const s = c.toLowerCase();
    if (s.includes("12") || s.includes("2nd") || s.includes("second") || s.includes("xii")) return "12";
    if (s.includes("11") || s.includes("1st") || s.includes("first") || s.includes("xi")) return "11";
    if (s.includes("10") || s.includes("metric") || s.includes("matric-ii") || s.includes("ssc-ii")) return "10";
    return "9";
  }

  public static normalizeSubject(sub?: string): string {
    if (!sub) return "PHY";
    const s = sub.toUpperCase();
    if (s.includes("PAK") || s.includes("PST") || s.includes("MUTALIA") || s.includes("PAKISTAN")) return "PAK";
    if (s.includes("STAT")) return "STAT";
    if (s.includes("PHY")) return "PHY";
    if (s.includes("CHM") || s.includes("CHEM")) return "CHM";
    if (s.includes("BIO")) return "BIO";
    if (s.includes("MTH") || s.includes("MATH")) return "MTH";
    if (s.includes("CS") || s.includes("COMP")) return "CS";
    if (s.includes("ENG")) return "ENG";
    if (s.includes("URD")) return "URD";
    if (s.includes("ISL")) return "ISL";
    return "PHY";
  }
}
