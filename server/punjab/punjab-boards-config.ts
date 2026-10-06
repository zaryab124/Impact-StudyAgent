/**
 * Punjab BISE Boards Configuration & Registry
 * Harmonized under the Punjab Boards Committee of Chairmen (PBCC)
 */

export interface PunjabBoardDefinition {
  id: string;
  code: string;
  name: string;
  division: string;
  portalUrl: string;
  notificationFeedUrl?: string;
  establishedYear: number;
  country: string;
  region: string;
  districts: string[];
  status: "ACTIVE" | "INACTIVE";
  supportedClasses: number[];
  governingBody: string;
}

export const PUNJAB_BOARDS_REGISTRY: PunjabBoardDefinition[] = [
  {
    id: "board-punjab-lhr",
    code: "BISE_LHR",
    name: "Board of Intermediate and Secondary Education, Lahore",
    division: "Lahore",
    portalUrl: "https://www.biselahore.com",
    notificationFeedUrl: "https://www.biselahore.com/notifications",
    establishedYear: 1954,
    country: "Pakistan",
    region: "Punjab",
    districts: ["Lahore", "Kasur", "Nankana Sahib", "Sheikhupura"],
    status: "ACTIVE",
    supportedClasses: [9, 10, 11, 12],
    governingBody: "PBCC",
  },
  {
    id: "board-punjab-rwp",
    code: "BISE_RWP",
    name: "Board of Intermediate and Secondary Education, Rawalpindi",
    division: "Rawalpindi",
    portalUrl: "https://www.biserawalpindi.edu.pk",
    notificationFeedUrl: "https://www.biserawalpindi.edu.pk/notifications",
    establishedYear: 1977,
    country: "Pakistan",
    region: "Punjab",
    districts: ["Rawalpindi", "Attock", "Chakwal", "Jhelum", "Murree", "Talagang"],
    status: "ACTIVE",
    supportedClasses: [9, 10, 11, 12],
    governingBody: "PBCC",
  },
  {
    id: "board-punjab-fsd",
    code: "BISE_FSD",
    name: "Board of Intermediate and Secondary Education, Faisalabad",
    division: "Faisalabad",
    portalUrl: "https://www.bisefsd.edu.pk",
    notificationFeedUrl: "https://www.bisefsd.edu.pk/notifications",
    establishedYear: 1988,
    country: "Pakistan",
    region: "Punjab",
    districts: ["Faisalabad", "Chiniot", "Jhang", "Toba Tek Singh"],
    status: "ACTIVE",
    supportedClasses: [9, 10, 11, 12],
    governingBody: "PBCC",
  },
  {
    id: "board-punjab-grw",
    code: "BISE_GRW",
    name: "Board of Intermediate and Secondary Education, Gujranwala",
    division: "Gujranwala",
    portalUrl: "https://www.bisegrw.edu.pk",
    notificationFeedUrl: "https://www.bisegrw.edu.pk/notifications",
    establishedYear: 1982,
    country: "Pakistan",
    region: "Punjab",
    districts: ["Gujranwala", "Gujrat", "Hafizabad", "Mandi Bahauddin", "Narowal", "Sialkot", "Wazirabad"],
    status: "ACTIVE",
    supportedClasses: [9, 10, 11, 12],
    governingBody: "PBCC",
  },
  {
    id: "board-punjab-mul",
    code: "BISE_MUL",
    name: "Board of Intermediate and Secondary Education, Multan",
    division: "Multan",
    portalUrl: "https://www.bisemultan.edu.pk",
    notificationFeedUrl: "https://www.bisemultan.edu.pk/notifications",
    establishedYear: 1968,
    country: "Pakistan",
    region: "Punjab",
    districts: ["Multan", "Khanewal", "Lodhran", "Vehari"],
    status: "ACTIVE",
    supportedClasses: [9, 10, 11, 12],
    governingBody: "PBCC",
  },
  {
    id: "board-punjab-swl",
    code: "BISE_SWL",
    name: "Board of Intermediate and Secondary Education, Sahiwal",
    division: "Sahiwal",
    portalUrl: "https://www.bisesahiwal.edu.pk",
    notificationFeedUrl: "https://www.bisesahiwal.edu.pk/notifications",
    establishedYear: 2012,
    country: "Pakistan",
    region: "Punjab",
    districts: ["Sahiwal", "Okara", "Pakpattan"],
    status: "ACTIVE",
    supportedClasses: [9, 10, 11, 12],
    governingBody: "PBCC",
  },
  {
    id: "board-punjab-sgd",
    code: "BISE_SGD",
    name: "Board of Intermediate and Secondary Education, Sargodha",
    division: "Sargodha",
    portalUrl: "https://www.bisesargodha.edu.pk",
    notificationFeedUrl: "https://www.bisesargodha.edu.pk/notifications",
    establishedYear: 1968,
    country: "Pakistan",
    region: "Punjab",
    districts: ["Sargodha", "Bhakkar", "Khushab", "Mianwali"],
    status: "ACTIVE",
    supportedClasses: [9, 10, 11, 12],
    governingBody: "PBCC",
  },
  {
    id: "board-punjab-bwp",
    code: "BISE_BWP",
    name: "Board of Intermediate and Secondary Education, Bahawalpur",
    division: "Bahawalpur",
    portalUrl: "https://www.bisebwp.edu.pk",
    notificationFeedUrl: "https://www.bisebwp.edu.pk/notifications",
    establishedYear: 1977,
    country: "Pakistan",
    region: "Punjab",
    districts: ["Bahawalpur", "Bahawalnagar", "Rahim Yar Khan"],
    status: "ACTIVE",
    supportedClasses: [9, 10, 11, 12],
    governingBody: "PBCC",
  },
  {
    id: "board-punjab-dgk",
    code: "BISE_DGK",
    name: "Board of Intermediate and Secondary Education, D.G. Khan",
    division: "Dera Ghazi Khan",
    portalUrl: "https://www.bisedgkhan.edu.pk",
    notificationFeedUrl: "https://www.bisedgkhan.edu.pk/notifications",
    establishedYear: 1989,
    country: "Pakistan",
    region: "Punjab",
    districts: ["Dera Ghazi Khan", "Layyah", "Muzaffargarh", "Rajanpur", "Kot Addu", "Taunsa"],
    status: "ACTIVE",
    supportedClasses: [9, 10, 11, 12],
    governingBody: "PBCC",
  },
];

export const PBCC_APEX_BODY = {
  name: "Punjab Boards Committee of Chairmen (PBCC)",
  portalUrl: "https://pbcc.punjab.gov.pk",
  role: "Harmonizing curriculum, SLO assessment frameworks, pairing schemes, and examination schedules across all Punjab boards.",
  textbookAuthority: "Punjab Curriculum and Textbook Board (PCTB)",
  pctbPortalUrl: "https://pctb.punjab.gov.pk",
  elearnPortalUrl: "https://elearn.punjab.gov.pk",
};

export function getPunjabBoardByCode(code: string): PunjabBoardDefinition | undefined {
  const normalized = code.trim().toUpperCase();
  return PUNJAB_BOARDS_REGISTRY.find(
    (b) => b.code === normalized || b.id === code || b.division.toUpperCase() === normalized
  );
}

export function getAllPunjabBoardCodes(): string[] {
  return PUNJAB_BOARDS_REGISTRY.map((b) => b.code);
}
