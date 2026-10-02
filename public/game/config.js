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
// `facts` are short fun facts about each pal; one is shown at random in the
// pop-up at the end of every level or race, win or lose (see game/facts.js).
export const SPECIES = {
  mona: {
    facts: [
      "Mona usually swims with one whip-like tail, called a polar flagellum.",
      "Mona's species name, aeruginosa, refers to verdigris: the blue-green patina of copper.",
      "Mona can make pyocyanin, a blue pigment that helps give her cultures a blue-green look.",
      "Mona's cultures smell a little like grapes.",
      "One of Mona's pigments glows under UV light.",
      "Mona loves damp places like sink drains and hot tubs.",
      "Mona builds slimy shields called biofilms to protect herself.",
      "Mona is naturally resistant to many antibiotics.",
      "Mona often infects the lungs of people with cystic fibrosis.",
      "Without oxygen, Mona can use nitrate for anaerobic respiration.",
    ],
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
    facts: [
      "Vi is shaped like a comma.",
      "Vi is an exceptionally fast and agile swimmer, using one polar flagellum.",
      "Vi lives naturally in salty coastal water.",
      "Vi hitches rides on tiny shrimp-like animals called copepods.",
      "Vi's toxin genes were delivered by a virus that infected her.",
      "Depending on conditions, it takes thousands to millions or more Vi to make someone sick.",
      "Vi causes cholera, which John Snow traced to a London water pump in 1854.",
      "In 1854, Filippo Pacini described Vi, the comma-shaped bacterium linked to cholera.",
      "Oral rehydration (clean water, the right salt and sugar) saves most people Vi sickens.",
      "Filtering water through folded sari cloth kept Vi out and cut cholera in Bangladesh.",
    ],
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
    facts: [
      "Elia is a spirochete, shaped like a corkscrew.",
      "Elia's flagella are inside her body, so she swims by twisting.",
      "Elia is spread by Ixodes ticks: blacklegged or \"deer\" ticks in much of the eastern U.S.",
      "Elia causes Lyme disease, named after Lyme, Connecticut.",
      "Elia is named for Willy Burgdorfer, who helped identify the Lyme spirochete in 1982.",
      "Elia's Lyme disease often starts with a spreading rash; many aren't a bull's-eye.",
      "Mice, especially white-footed mice in the eastern U.S., are key reservoir hosts for Elia.",
      "Unlike most bacteria, Elia doesn't need iron and relies heavily on manganese instead.",
      "Elia's chromosome is a straight line instead of a circle.",
      "Elia is difficult to grow in special lab media and can take days to weeks to multiply.",
    ],
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
    facts: [
      "Despite her name, Coco doesn't cause the flu.",
      "During the 1889-90 flu pandemic, Coco was mistakenly thought to cause influenza.",
      "\"Haemophilus\" means blood-loving: Coco needs X and V growth factors that blood provides.",
      "Coco grows best on \"chocolate agar,\" made from heated blood.",
      "On blood agar, Coco can grow near Goldie, borrowing growth factors Goldie releases.",
      "Coco was the first free-living organism to have its whole genome read, in 1995.",
      "HindII, a DNA-cutting restriction enzyme from Coco, helped launch genetic engineering.",
      "Coco can live harmlessly in the nose and throat, especially in children.",
      "Before Hib vaccines, Coco's type b was a top cause of bacterial meningitis in young kids.",
      "The Hib vaccine made Coco's type b disease rare where vaccination coverage is high.",
    ],
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
  // Bifidobacterium bifidum, one of the "good" gut bacteria (a probiotic):
  // a rod that splits into a Y at one end (bifidus means split in two), drawn
  // upright like arms raised in a cheer. She divides like a rod. Her name is
  // a nod to "anaerobe": oxygen is bad for her. Like Borrelia, there are no
  // standard lab disk sizes for her, so her zones are estimates from how well
  // each drug works on bifidobacteria. They're naturally resistant to
  // gentamicin, so that disk has no zone at all.
  ana: {
    facts: [
      "Ana is a common, usually beneficial member of the human gut microbiome.",
      "Ana's name refers to the forked or split-looking shapes these bacteria can make.",
      "Ana was first described in 1899 from the stool of breastfed infants.",
      "Ana can be among the early bacteria that colonize babies' guts.",
      "Some Ana strains can help use breast-milk sugars that babies can't digest on their own.",
      "Ana grows best without oxygen and is very sensitive to it.",
      "Ana makes acids that can help make the gut less welcoming to some harmful microbes.",
      "Ana is included in some probiotics and, occasionally, in fermented dairy foods.",
      "Ana has no flagellum, so she can't swim.",
      "Bifidobacteria like Ana are often most abundant in infancy and less dominant with age.",
    ],
    scientific: 'Bifidobacterium bifidum',
    color: '#be185d', // for her name above the dish: strawberry-yogurt pink's deeper rose
    kind: 'rod',
    size: 9.5,
    body: [
      // stem, bottom to top
      [0.0, 0.305, 0.128],
      [0.0, 0.177, 0.128],
      [0.0, 0.049, 0.128],
      // where the branches meet (her face)
      [0.0, -0.012, 0.134],
      // the two branches, out to their tips
      [-0.07, -0.149, 0.128],
      [-0.121, -0.226, 0.128],
      [-0.183, -0.305, 0.128],
      [0.07, -0.149, 0.128],
      [0.121, -0.226, 0.128],
      [0.183, -0.305, 0.128],
    ],
    antibiotics: [
      { code: 'AMX', name: 'amoxicillin', zone: 34 },
      { code: 'VA', name: 'vancomycin', zone: 22 },
      { code: 'GM', name: 'gentamicin', zone: null }, // resistant: no zone
      { code: 'CC', name: 'clindamycin', zone: 28 },
      { code: 'E', name: 'erythromycin', zone: 25 },
    ],
  },
  // Streptococcus pneumoniae, the pneumococcus: a Streptococcus like
  // Scarlett, but her chains stop at two, so she grows in pairs (a
  // diplococcus). Her glasses are because pneumococcus is the bacterium that
  // showed DNA carries genes (Griffith in 1928; Avery, MacLeod and McCarty in
  // 1944). Labs screen her for penicillin with an oxacillin disk.
  penny: {
    facts: [
      "Penny is often called \"pneumococcus.\"",
      "Penny's cells often come in pairs shaped like tiny pointed ovals, or lancets.",
      "Penny is a major cause of bacterial pneumonia.",
      "Penny also causes many ear infections in kids.",
      "Penny comes in more than 100 capsule, or \"coat,\" types.",
      "Penny makes a greenish halo on blood agar, called alpha-hemolysis.",
      "Penny dissolves in bile, a classic lab test for her.",
      "Penny can pick up loose DNA from her surroundings.",
      "In 1928, Griffith showed harmless Penny cells could be transformed into deadly ones.",
      "In 1944, Avery, MacLeod and McCarty used Penny to show DNA carried the transforming trait.",
    ],
    scientific: 'Streptococcus pneumoniae',
    color: '#4f46e5', // for her name above the dish: bluish purple, next to Elia's purple
    kind: 'coccus',
    layout: 'chain',
    maxCells: 2, // pairs
    glasses: true,
    colors: { fill: '#a5b4fc', stroke: '#4f46e5', highlight: '#e0e7ff', dark: '#312e81' },
    antibiotics: [
      { code: 'OX', name: 'oxacillin', zone: 26 },
      { code: 'E', name: 'erythromycin', zone: 30 },
      { code: 'LVX', name: 'levofloxacin', zone: 22 },
      { code: 'VA', name: 'vancomycin', zone: 19 },
      { code: 'SXT', name: 'trimethoprim-sulfamethoxazole', zone: 24 },
    ],
  },
  scarlett: {
    facts: [
      "\"Strepto\" is Greek for twisted or chain-like, matching how Scarlett's cells often line up.",
      "\"Pyogenes\" in Scarlett's name means pus-making.",
      "Scarlett is the cause of strep throat.",
      "Scarlett also causes scarlet fever, a perfect match for her name.",
      "Doctors call Scarlett \"Group A Strep.\"",
      "Scarlett causes beta-hemolysis, making clear rings on blood agar.",
      "Scarlett can wear a capsule of hyaluronic acid, also found in human connective tissue.",
      "Penicillin still works on Scarlett: confirmed clinical resistance to it hasn't emerged.",
      "Untreated, Scarlett's strep throat can lead to rheumatic fever, which can harm the heart.",
      "Rarely, Scarlett causes necrotizing fasciitis, often called a \"flesh-eating\" infection.",
    ],
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
    facts: [
      "\"Staphylo\" is Greek for a bunch of grapes, how Goldie's cells cluster.",
      "\"Aureus\" means golden, the color of Goldie's colonies.",
      "Goldie's golden pigment helps her fight off the immune system.",
      "Roughly 1 in 4 to 1 in 3 people carry Goldie harmlessly in the nose or on the skin.",
      "Goldie has no flagellum and does not actively swim.",
      "Goldie can persist on dry surfaces for days to weeks, sometimes longer.",
      "Goldie tolerates lots of salt, so labs grow her on salty agar.",
      "Goldie's toxins can cause food poisoning within hours.",
      "MRSA is Goldie resistant to methicillin and related antibiotics, and often to others too.",
      "Penicillin was discovered after Fleming saw mold stop Goldie growing on a culture plate.",
    ],
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
  RIVAL_SPEED: 0.55, // fraction of the dish radius per second (you swim at GAME.SPEED)
  RIVAL_REACT_MS: 500, // how often the rival looks around for a new nutrient
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
  GROUP_CAP: 8, // chains and clusters stop growing at this many cells (unless a pal's maxCells is smaller)
  // A new coccus joins a chain or cluster if the player is within this
  // distance of where it would attach (a fraction of the dish radius).
  SNAP_REACH: 0.3,
  NUTRIENTS_PER_DIVISION: 1, // nutrients the player eats before dividing
  SPEED: 0.8, // player speed, as a fraction of the dish radius per second
  // With touch steering, how close to the finger counts as there (so she
  // settles instead of jittering on the spot), as a fraction of the dish radius.
  ARRIVE: 0.01,
  // How hard a new group pushes away when it splits off. It slides about
  // BURST_SPEED / SETTLE_RATE of the dish radius (half that for cocci) before
  // it stops: far enough to see, short enough not to slide into a zone easily.
  BURST_SPEED: 0.1,
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
  // Zones spread: on a real plate the drug soaks outward from the disk, so
  // the zone starts small and widens. Each zone starts at ZONE_START of its
  // full width and reaches full width after ZONE_SPREAD_SECONDS. (A real
  // zone takes hours to form while the plate incubates; sped up for the game.)
  ZONE_START: 0.2,
  ZONE_SPREAD_SECONDS: 12,
  // Room to swim between two neighboring zones, at least.
  SWIM_ROOM: 0.13,
};
