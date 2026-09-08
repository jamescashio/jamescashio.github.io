export const LINEAGE = [
  {
    craft: "X-1 · 1947",
    name: "YEAGER",
    rule: "Fly it to the edge, then write down exactly where the edge was.",
    note: "The X-1 turned an invisible barrier into measured flight data. Yeager's rule is controlled expansion of the envelope, followed by an exact record of where the edge moved. Every public figure here carries that same obligation: evidence, boundary, date.",
  },
  {
    craft: "SKUNK WORKS · SR-71 · 1964",
    name: "K. JOHNSON",
    rule: "Small team, few parts, short runway.",
    note: "Kelly Johnson's team made sustained Mach 3 flight practical through small teams, direct authority, and ruthless control of complexity. Doug Cashio applies the same discipline: shorten the path between the person who sees the problem and the person who can change the machine.",
  },
  {
    craft: "PROTEUS · 1998",
    name: "RUTAN",
    rule: "Question the shape. Prove the answer in flight.",
    note: "Proteus made unconventional geometry practical by keeping structure, payload, and flight test in the same learning loop. Doug Cashio follows that discipline: own the hardware, instrument the route, and let evidence, not familiarity, choose the design.",
  },
  {
    craft: "P-51D · ENERGY MANAGEMENT",
    name: "HOOVER",
    rule: "Precision is a habit, not a stunt.",
    note: "Hoover made energy management visible in the P-51D: every input deliberate, every knot accounted for. Doug Cashio follows the same rule in systems work. Backups, DNS, monitoring, and recovery are practiced with the same precision as the demonstration.",
  },
];

export const LINEAGE_EVIDENCE = [
  {
    src: "/plates/x1-nasa.webp?v=32",
    alt: "Bell X-1 Glamorous Glennis in flight, its bright orange fuselage and shock pattern visible against the dark sky",
    label: "FLIGHT-TEST EVIDENCE · X-1 #46-062",
    credit: "NASA / USAF · LT. ROBERT A. HOOVER",
    sourceUrl: "https://www.nasa.gov/image-article/x-1-shock-wave-pattern-visible-exhaust-plume/",
    dataUrl: "https://www.nasa.gov/aeronautics/first-generation-x-1/",
    facts: [
      ["BARRIER FLIGHT", "10-14-1947"],
      ["SPEED", "MACH 1.06"],
      ["ALTITUDE", "43,000 FT"],
      ["POWER", "4-CHAMBER XLR11"],
    ],
  },
  {
    src: "/plates/sr71-nasa.webp?v=32",
    alt: "NASA Lockheed SR-71A Blackbird climbing after takeoff with landing gear still extended",
    label: "FLIGHT-TEST EVIDENCE · SR-71A #844",
    credit: "NASA · JIM ROSS",
    sourceUrl: "https://www.nasa.gov/image-article/sr-71-blackbird-24/",
    dataUrl: "https://www.nasa.gov/image-article/sr-71-3/",
    facts: [
      ["FIRST FLIGHT", "12-22-1964"],
      ["CRUISE", "MACH 3.2"],
      ["ALTITUDE", "85,000 FT"],
      ["POWER", "2 × J58"],
    ],
  },
  {
    src: "/plates/proteus-nasa.webp?v=32",
    alt: "Scaled Composites Proteus in flight, showing its forward canard, gull main wing, twin booms, and two rear-mounted turbofans",
    label: "FLIGHT-TEST EVIDENCE · MODEL 281",
    credit: "NASA / ESPO",
    sourceUrl: "https://espo.nasa.gov/aircraft/Proteus",
    dataUrl: "https://espo.nasa.gov/aircraft/Proteus",
    facts: [
      ["FIRST FLIGHT", "07-26-1998"],
      ["MAIN SPAN", "77.6 FT"],
      ["POWER", "2 × FJ44-2E"],
      ["CONFIGURATIONS", "35+"],
    ],
  },
  {
    src: "/plates/p51d-usaf.webp?v=32",
    alt: "A polished P-51D Mustang banking in flight, showing its laminar-flow wing and red tail",
    label: "FLIGHT DISCIPLINE · P-51D MUSTANG",
    credit: "USAF / AIR NATIONAL GUARD · TSGT HAMPTON STRAMLER",
    sourceUrl: "https://www.dvidshub.net/image/9595085/p-51-mustang-over-luke-air-force-base",
    dataUrl:
      "https://www.nationalmuseum.af.mil/Visit/Museum-Exhibits/Fact-Sheets/Display/Article/196263/north-american-p-51d-mustang/",
    facts: [
      ["MAX SPEED", "437 MPH"],
      ["RANGE", "1,000 MI"],
      ["CEILING", "41,900 FT"],
      ["POWER", "1,695 HP MERLIN"],
    ],
  },
] as const;
