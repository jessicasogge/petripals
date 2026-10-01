// How each pal grows. Every pal is a single cell that divides each time it
// eats. Rods (Mona, Vi) separate after dividing. Cocci are round cells whose
// daughters stick together: in chains for Streptococcus (divides in one
// plane) or grape-like clusters for Staphylococcus (divides in several).
//
// Each antibiotic's `zone` is the zone of inhibition around its disk, as the
// diameter in millimeters a lab would measure for a susceptible strain of
// that species (ballpark figures from standard disk tests; bigger means the
// drug works better). Borrelia can't be grown for disk tests, so Elia's are
// made up from how well each drug works on her. The game scales these down
// to fit the dish (see ZONE_* below).
//
// `antibiotics` are the disks placed in each pal's dish, in order (level 1
// uses the first, level 5 all five, and later levels start over from the
// top): drugs commonly used against that species, labeled with their
// standard disk codes.
//
// `scientific` is the species name shown above the dish, with the pal's name
// in her `color`.
//
// Rod-style pals are drawn `size` percent of the dish wide (12 unless set).
//
// For rod-style pals, `body` traces the drawing's outline as circles
// [x, y, radius], in fractions of the drawing's width from its center. It's
// what counts as touching an antibiotic disk.
export const SPECIES = {
  mona: {
    scientific: 'Pseudomonas aeruginosa',
    color: '#15803d', // for her name above the dish
    kind: 'rod',
    size: 10.5,
    body: [
      // tail (flagellum)
      [-0.443, 0.0, 0.057],
      [-0.386, 0.0, 0.057],
      [-0.33, 0.0, 0.057],
      [-0.159, 0.0, 0.182],
      [-0.008, 0.0, 0.182],
      [0.144, 0.0, 0.182],
      [0.295, 0.0, 0.182],
    ],
    antibiotics: [
      { code: 'CIP', name: 'ciprofloxacin', zone: 32 },
      { code: 'GM', name: 'gentamicin', zone: 18 },
      { code: 'CAZ', name: 'ceftazidime', zone: 25 },
      { code: 'TZP', name: 'piperacillin-tazobactam', zone: 28 },
      { code: 'MEM', name: 'meropenem', zone: 31 },
    ],
  },
  vi: {
    scientific: 'Vibrio cholerae',
    color: '#c2410c', // for her name above the dish
    kind: 'rod',
    size: 10.5,
    body: [
      // tail (flagellum)
      [-0.444, -0.072, 0.056],
      [-0.389, -0.072, 0.056],
      [-0.333, -0.072, 0.056],
      [-0.189, -0.072, 0.161],
      [-0.098, -0.114, 0.161],
      [-0.009, -0.128, 0.161],
      [0.078, -0.114, 0.161],
      [0.162, -0.072, 0.161],
      [0.243, -0.003, 0.161],
      [0.322, 0.094, 0.161],
    ],
    antibiotics: [
      { code: 'TE', name: 'tetracycline', zone: 23 },
      { code: 'CIP', name: 'ciprofloxacin', zone: 35 },
      { code: 'AZM', name: 'azithromycin', zone: 20 },
      { code: 'DO', name: 'doxycycline', zone: 24 },
      { code: 'SXT', name: 'trimethoprim-sulfamethoxazole', zone: 25 },
    ],
  },
  // A spirochete: a long corkscrew-shaped cell that divides in two like a rod.
  elia: {
    scientific: 'Borrelia burgdorferi',
    color: '#7e22ce', // for her name above the dish
    kind: 'rod',
    body: [
      [-0.391, 0.0, 0.104],
      [-0.32, 0.0, 0.104],
      [-0.25, 0.0, 0.104],
      [-0.18, 0.0, 0.104],
      [-0.109, 0.0, 0.104],
      [-0.039, 0.0, 0.104],
      [0.031, 0.0, 0.104],
      [0.102, 0.0, 0.104],
      [0.172, 0.0, 0.104],
      [0.242, 0.0, 0.104],
      [0.312, 0.0, 0.104],
      [0.396, 0.0, 0.083],
    ],
    antibiotics: [
      { code: 'DO', name: 'doxycycline', zone: 33 },
      { code: 'AMX', name: 'amoxicillin', zone: 28 },
      { code: 'CXM', name: 'cefuroxime', zone: 21 },
      { code: 'CRO', name: 'ceftriaxone', zone: 36 },
      { code: 'AZM', name: 'azithromycin', zone: 31 },
    ],
  },
  // A coccobacillus: a short, plump rod with no flagellum. Divides in two like a rod.
  // H. influenzae is one of the smallest bacteria, and her drawing fills
  // more of its box than the other rods', so she's drawn smaller.
  coco: {
    scientific: 'Haemophilus influenzae',
    color: '#7c4a2d', // for her name above the dish
    kind: 'rod',
    size: 8.5,
    body: [
      [-0.142, 0.008, 0.275],
      [0.0, 0.008, 0.275],
      [0.142, 0.008, 0.275],
    ],
    antibiotics: [
      { code: 'CRO', name: 'ceftriaxone', zone: 39 },
      { code: 'AMC', name: 'amoxicillin-clavulanate', zone: 17 },
      { code: 'AZM', name: 'azithromycin', zone: 13 },
      { code: 'LVX', name: 'levofloxacin', zone: 38 },
      { code: 'CTX', name: 'cefotaxime', zone: 37 },
    ],
  },
  scarlett: {
    scientific: 'Streptococcus pyogenes',
    color: '#b91c1c', // for her name above the dish
    kind: 'coccus',
    layout: 'chain',
    colors: { fill: '#fca5a5', stroke: '#b91c1c', highlight: '#fee2e2', dark: '#7f1d1d' },
    antibiotics: [
      { code: 'P', name: 'penicillin', zone: 31 },
      { code: 'E', name: 'erythromycin', zone: 27 },
      { code: 'CC', name: 'clindamycin', zone: 20 },
      { code: 'CRO', name: 'ceftriaxone', zone: 35 },
      { code: 'VA', name: 'vancomycin', zone: 21 },
    ],
  },
  goldie: {
    scientific: 'Staphylococcus aureus',
    color: '#b45309', // for her name above the dish
    kind: 'coccus',
    layout: 'cluster',
    colors: { fill: '#fde68a', stroke: '#b45309', highlight: '#fef3c7', dark: '#78350f' },
    antibiotics: [
      { code: 'OX', name: 'oxacillin', zone: 20 },
      { code: 'VA', name: 'vancomycin', zone: 16 },
      { code: 'SXT', name: 'trimethoprim-sulfamethoxazole', zone: 30 },
      { code: 'CC', name: 'clindamycin', zone: 29 },
      { code: 'DO', name: 'doxycycline', zone: 27 },
    ],
  },
};

// Mixed culture mode: no disks, just you and a rival pal (picked at random,
// steered by the computer) racing to grow a colony of TARGET cells first.
export const MIXED = {
  TARGET: 64,
  NUTRIENTS: 14, // flecks on the agar at a time (two species are eating)
  RIVAL_SPEED: 0.5, // fraction of the dish radius per second (you swim at GAME.SPEED)
  RIVAL_REACT_MS: 550, // how often the rival looks around for a new nutrient
  RIVAL_WANDER: 0.5, // how much the rival weaves off course, in radians
  RIVAL_START_MS: 1000, // the rival waits this long before it starts, so you get a head start
};

// Each level adds an antibiotic disk and doubles the colony you need to grow.
export const LEVELS = [
  { disks: 1, target: 4 },
  { disks: 2, target: 8 },
  { disks: 3, target: 16 },
  { disks: 4, target: 32 },
  { disks: 5, target: 64 },
  { disks: 6, target: 128 },
  { disks: 7, target: 256 },
];

export const GAME = {
  GROUP_CAP: 8, // chains and clusters stop growing at this many cells
  // A new coccus joins a chain or cluster if the player is within this
  // distance of where it would attach (a fraction of the dish radius).
  SNAP_REACH: 0.3,
  NUTRIENTS_PER_DIVISION: 1, // nutrients the player eats before dividing
  SPEED: 0.8, // player speed, as a fraction of the dish radius per second
  // With touch steering, how close to the finger counts as there (so she
  // settles instead of jittering on the spot), as a fraction of the dish radius.
  ARRIVE: 0.01,
  BURST_SPEED: 0.9, // how hard a new group pushes away when it splits off
  SETTLE_RATE: 4, // how quickly a new group slows to a stop (higher = sooner)
  SETTLE_MS: 1500, // after this long, offspring stay put for good
  DIVIDE_MS: 600,
  // The antibiotic disks: their radius, how far from the center they can go,
  // and how far apart they must be, center to center (all as fractions of the
  // dish radius). They never sit on the starting spot.
  DISK_RADIUS: 0.085,
  DISK_MIN_DISTANCE: 0.4,
  DISK_MAX_DISTANCE: 0.65,
  DISK_MIN_GAP: 0.4,
  // The zone of inhibition: the clear ring around each disk where the drug
  // has soaked into the agar. Offspring grow right up to its edge but never
  // into it, and the player touching it is game over. Its width comes from
  // the drug's zone in mm: ZONE_MM_SMALL mm or less is ZONE_MIN_WIDTH wide,
  // ZONE_MM_BIG mm or more is ZONE_MAX_WIDTH, and in between scales evenly
  // (widths are fractions of the dish radius).
  ZONE_MM_SMALL: 13,
  ZONE_MM_BIG: 40,
  ZONE_MIN_WIDTH: 0.02,
  ZONE_MAX_WIDTH: 0.075,
  // Room to swim between two neighboring zones, at least.
  SWIM_ROOM: 0.13,
};
