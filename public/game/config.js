// How each buddy grows. Every buddy is a single cell that divides each time it
// eats. Rods (Mona, Vi) separate after dividing. Cocci are round cells whose
// daughters stick together: in chains for Streptococcus (divides in one
// plane) or grape-like clusters for Staphylococcus (divides in several).
//
// `antibiotic` is the disk placed in each buddy's dish: a drug commonly used
// against that species, labeled with its standard disk code.
export const SPECIES = {
  mona: { kind: 'rod', antibiotic: { code: 'CIP', name: 'ciprofloxacin' } },
  vi: { kind: 'rod', antibiotic: { code: 'TE', name: 'tetracycline' } },
  // A spirochete: a long corkscrew-shaped cell that divides in two like a rod.
  elia: { kind: 'rod', antibiotic: { code: 'DO', name: 'doxycycline' } },
  // A coccobacillus: a short, plump rod with no flagellum. Divides in two like a rod.
  coco: { kind: 'rod', antibiotic: { code: 'CRO', name: 'ceftriaxone' } },
  scarlett: {
    kind: 'coccus',
    layout: 'chain',
    colors: { fill: '#fca5a5', stroke: '#b91c1c', highlight: '#fee2e2', dark: '#7f1d1d' },
    antibiotic: { code: 'P', name: 'penicillin' },
  },
  goldie: {
    kind: 'coccus',
    layout: 'cluster',
    colors: { fill: '#fde68a', stroke: '#b45309', highlight: '#fef3c7', dark: '#78350f' },
    antibiotic: { code: 'OX', name: 'oxacillin' },
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
  // The antibiotic disk: its radius, and how far from the center it can go
  // (all as fractions of the dish radius). It never sits on the starting spot.
  DISK_RADIUS: 0.07,
  DISK_MIN_DISTANCE: 0.4,
  DISK_MAX_DISTANCE: 0.65,
};
