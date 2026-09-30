// How each buddy grows. Every buddy is a single cell that divides each time it
// eats. Rods (Mona, Vi) separate after dividing. Cocci are round cells whose
// daughters stick together: in chains for Streptococcus (divides in one
// plane) or grape-like clusters for Staphylococcus (divides in several).
//
// `antibiotics` are the three disks placed in each buddy's dish: drugs
// commonly used against that species, labeled with their standard disk codes.
export const SPECIES = {
  mona: {
    kind: 'rod',
    antibiotics: [
      { code: 'CIP', name: 'ciprofloxacin' },
      { code: 'GM', name: 'gentamicin' },
      { code: 'CAZ', name: 'ceftazidime' },
    ],
  },
  vi: {
    kind: 'rod',
    antibiotics: [
      { code: 'TE', name: 'tetracycline' },
      { code: 'CIP', name: 'ciprofloxacin' },
      { code: 'AZM', name: 'azithromycin' },
    ],
  },
  // A spirochete: a long corkscrew-shaped cell that divides in two like a rod.
  elia: {
    kind: 'rod',
    antibiotics: [
      { code: 'DO', name: 'doxycycline' },
      { code: 'AMX', name: 'amoxicillin' },
      { code: 'CXM', name: 'cefuroxime' },
    ],
  },
  // A coccobacillus: a short, plump rod with no flagellum. Divides in two like a rod.
  coco: {
    kind: 'rod',
    antibiotics: [
      { code: 'CRO', name: 'ceftriaxone' },
      { code: 'AMC', name: 'amoxicillin-clavulanate' },
      { code: 'AZM', name: 'azithromycin' },
    ],
  },
  scarlett: {
    kind: 'coccus',
    layout: 'chain',
    colors: { fill: '#fca5a5', stroke: '#b91c1c', highlight: '#fee2e2', dark: '#7f1d1d' },
    antibiotics: [
      { code: 'P', name: 'penicillin' },
      { code: 'E', name: 'erythromycin' },
      { code: 'CC', name: 'clindamycin' },
    ],
  },
  goldie: {
    kind: 'coccus',
    layout: 'cluster',
    colors: { fill: '#fde68a', stroke: '#b45309', highlight: '#fef3c7', dark: '#78350f' },
    antibiotics: [
      { code: 'OX', name: 'oxacillin' },
      { code: 'VA', name: 'vancomycin' },
      { code: 'SXT', name: 'trimethoprim-sulfamethoxazole' },
    ],
  },
};

export const GAME = {
  TARGET_CELLS: 16, // grow the population to this many cells to win
  GROUP_CAP: 8, // chains and clusters stop growing at this many cells
  // A new coccus joins a chain or cluster if the player is within this
  // distance of where it would attach (a fraction of the dish radius).
  SNAP_REACH: 0.3,
  NUTRIENTS_PER_DIVISION: 1, // nutrients the player eats before dividing
  SPEED: 0.8, // player speed, as a fraction of the dish radius per second
  BURST_SPEED: 0.9, // how hard a new group pushes away when it splits off
  SETTLE_RATE: 4, // how quickly a new group slows to a stop (higher = sooner)
  SETTLE_MS: 1500, // after this long, offspring stay put for good
  PICKUP_REACH: 0.6, // how close a rod's middle must get to a nutrient
  DIVIDE_MS: 600,
  // The antibiotic disks: their radius, how far from the center they can go,
  // and how far apart they must be, center to center (all as fractions of the
  // dish radius). They never sit on the starting spot.
  DISK_RADIUS: 0.07,
  DISK_MIN_DISTANCE: 0.4,
  DISK_MAX_DISTANCE: 0.65,
  DISK_MIN_GAP: 0.4,
};
