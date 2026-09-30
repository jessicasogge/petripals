// How each buddy grows. Every buddy is a single cell that divides each time it
// eats. Rods (Mona, Vi) separate after dividing. Cocci are round cells whose
// daughters stick together: in chains for Streptococcus (divides in one
// plane) or grape-like clusters for Staphylococcus (divides in several).
export const SPECIES = {
  mona: { kind: 'rod' },
  vi: { kind: 'rod' },
  // A spirochete: a long corkscrew-shaped cell that divides in two like a rod.
  elia: { kind: 'rod' },
  // A coccobacillus: a short, plump rod with no flagellum. Divides in two like a rod.
  coco: { kind: 'rod' },
  scarlett: {
    kind: 'coccus',
    layout: 'chain',
    colors: { fill: '#fca5a5', stroke: '#b91c1c', highlight: '#fee2e2', dark: '#7f1d1d' },
  },
  goldie: {
    kind: 'coccus',
    layout: 'cluster',
    colors: { fill: '#fde68a', stroke: '#b45309', highlight: '#fef3c7', dark: '#78350f' },
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
};
