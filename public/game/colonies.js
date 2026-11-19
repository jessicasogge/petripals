// On the Plate: what each pal's colonies look like on agar, for her profile
// (see profile.js): first on the plate she's best known on, then on the
// three plates every pal can be tried on, to compare. A colony is the pile of millions of cells that grows from
// one cell on a plate, and labs often know a bacterium by its colonies before
// ever looking at a cell: their color, shape and shine, and what they do to
// the agar around them.
//
// Each plate is streaked the way a lab spreads bacteria to get single
// colonies: thick, merged growth along the first streak lines, crowded
// colonies along the next, then fewer, and single colonies at the end. The
// drawing is made from a few settings per pal, the same every time, so her
// page doesn't change from one visit to the next.

// The agar, by the plate she's best known on: [middle, edge] colors.
const AGARS = {
  nutrient: ['#f6e7b8', '#e9d08c'], // plain agar, pale amber
  blood: ['#a3202a', '#6e0f17'], // sheep blood agar, deep red
  chocolate: ['#8a5a3c', '#5e3a24'], // heated blood agar, brown
  tcbs: ['#5aa58a', '#2f7a63'], // TCBS, a green plate for vibrios
  xld: ['#e46a6a', '#b8414b'], // XLD, a red plate for Salmonella
  emb: ['#7b4f8c', '#4f2d5e'], // EMB, a purple plate
  tellurite: ['#b98b63', '#8a6143'], // tellurite agar, tan
  esculin: ['#d8c39a', '#b39b6c'], // bile esculin agar, tan
  bg11: ['#eef2e6', '#d6dfc8'], // BG-11, clear agar with no sugar
  mona: ['#bfe3cf', '#7fc0a6'], // Mona's own blue-green pigment, soaked in
  macconkey: ['#e98fae', '#c45d86'], // MacConkey, a pink plate
  sp4: ['#f2d3a0', '#e0b06f'], // SP4, a rich agar made for mycoplasmas
  iron: ['#e3c29a', '#c4955f'], // agar with iron for her to pass electrons to
};

// What each plate is called on her profile's buttons.
export const AGAR_NAMES = {
  nutrient: 'Plain agar',
  mona: 'Plain agar',
  blood: 'Blood agar',
  chocolate: 'Chocolate agar',
  macconkey: 'MacConkey',
  tcbs: 'TCBS',
  xld: 'XLD',
  emb: 'EMB',
  tellurite: 'Tellurite',
  esculin: 'Bile esculin',
  bg11: 'BG-11',
  sp4: 'SP4 agar',
  iron: 'Iron agar',
};

// What colonies do to the agar around them: a color, how strongly, and
// `spill` for a change that spreads out into the agar in irregular patches
// (Vera's blackening) rather than a neat ring. Each kind is drawn as one
// flat, soft-edged, see-through layer, so overlapping rings don't pile up.
const RINGS = {
  clear: { color: '#f5c9a2', opacity: 0.72 }, // red blood cells broken open: clear
  partial: { color: '#dc7270', opacity: 0.55 }, // only partly broken: hazy
  green: { color: '#7d8a3c', opacity: 0.65 }, // blood turned greenish
  black: { color: '#231b14', opacity: 0.78, spill: true }, // the agar turns black
  brown: { color: '#6b4423', opacity: 0.5 }, // a brown halo
  pink: { color: '#b0124f', opacity: 0.35 }, // a pink haze, from fermenting lactose
};

// Each pal's plate:
// - agar: which plate (AGARS)
// - look: 'round' (domed and shiny), 'flat' (flat, spreading, wavy edged),
//   'rhizoid' (curling, rootlike branches), 'film' (a thin film over the
//   plate), 'chalky' (dry and crumbly) or 'none' (doesn't grow on agar)
// - size: [smallest, biggest] colony radius, in the drawing's own units
//   (the plate is 200 across), not a real colony's size in millimeters
// - fill and edge: the colonies' colors
// - ring: what she does to the agar around her (RINGS), outermost first,
//   and how far each reaches, as a multiple of the colony's drawn radius:
//   how it looks, not a measured zone
// - center: a dot in the middle of each colony (Sallie's black centers)
// - sheen: a metallic sheen across each colony (Colette, Mona)
// - spread: a few big colonies spread out over the plate, not a streak
// - caption: what to notice, shown next to her plate (hyphenated words are
//   fine, but no dashes between phrases, like her fun facts)
export const COLONIES = {
  mona: { agar: 'mona', look: 'flat', size: [6, 9.5], fill: '#97ae9c', sheen: '#adc0b2',
    caption: 'Flat, spreading colonies with a metallic sheen; her blue-green pigment diffuses into the agar.' },
  vi: { agar: 'tcbs', look: 'round', size: [2.6, 4], fill: '#f2cf3c', edge: '#b38f12',
    caption: 'On TCBS, a green agar made for vibrios, her colonies turn yellow as she ferments sucrose.' },
  elia: { agar: 'nutrient', look: 'none',
    caption: "Elia won't grow on an ordinary plate. Labs grow her slowly in a special liquid broth instead." },
  coco: { agar: 'chocolate', look: 'round', size: [1.8, 2.8], fill: '#c9c4ba', edge: '#8f897d', see: true,
    caption: 'Small, gray, almost clear colonies on chocolate agar, made with heated blood that releases nutrients.' },
  ana: { agar: 'nutrient', look: 'round', size: [1.8, 2.8], fill: '#f4f1ea', edge: '#bdb6a5',
    caption: 'Small, smooth, white colonies, grown in a jar with no oxygen at all.' },
  penny: { agar: 'blood', look: 'round', size: [1.8, 2.6], fill: '#e6e3da', edge: '#9a9587', ring: [['green', 3]], center: '#c2bdaf',
    caption: 'Small colonies on blood agar, often with a greenish ring; older ones may dip in the middle.' },
  scarlett: { agar: 'blood', look: 'round', size: [1.3, 2], fill: '#f1eee7', edge: '#a39c8c', ring: [['clear', 3.3]],
    caption: 'Tiny colonies on blood agar, each in a clear ring where she broke open red blood cells.' },
  goldie: { agar: 'nutrient', look: 'round', size: [3.2, 5], fill: '#f2b71f', edge: '#b7790a',
    caption: 'Shiny, round, golden colonies. Her name comes from that gold.' },
  ceres: { agar: 'nutrient', look: 'flat', size: [6, 9], fill: '#e3ded0', edge: '#b4ad98', sheen: '#efebe0',
    caption: 'Big, flat, dull colonies with wavy edges that look like frosted glass.' },
  sallie: { agar: 'xld', look: 'round', size: [3, 4.4], fill: '#e78a8f', edge: '#8f2f39', center: '#1f1a1a',
    caption: 'On XLD agar, her colonies are red, often with black centers from hydrogen sulfide production.' },
  terra: { agar: 'blood', look: 'film', fill: '#e7dfd0', ring: [['clear', 1]],
    caption: 'She swarms across the plate in a thin, almost clear film, so single colonies are hard to find.' },
  lissie: { agar: 'blood', look: 'round', size: [1.8, 2.6], fill: '#efece4', edge: '#a39c8c', ring: [['clear', 2]],
    caption: 'Small, smooth colonies on blood agar, each with a narrow clear ring.' },
  sara: { agar: 'nutrient', look: 'round', size: [3, 4.6], fill: '#d8263a', edge: '#8f1022',
    caption: 'Bright red colonies: she makes a red pigment when she grows at room temperature.' },
  ivy: { agar: 'nutrient', look: 'rhizoid', size: [20, 24], fill: '#fbf8ee', spread: true,
    caption: 'Her colonies spread out in curling, rootlike branches that all spiral the same way.' },
  astrid: { agar: 'nutrient', look: 'round', size: [1.2, 1.9], fill: '#f1ede2', edge: '#bdb6a5',
    caption: 'Tiny, pale colonies that take days to show up, on a plate with very little food.' },
  kiki: { agar: 'nutrient', look: 'round', size: [3, 4.4], fill: '#f5d90f', edge: '#a8930a',
    caption: 'Bright yellow colonies when she grows at room temperature.' },
  electra: { agar: 'iron', look: 'round', size: [1.8, 2.8], fill: '#c8543f', edge: '#8a2f22',
    caption: 'Reddish colonies, colored by cytochromes: iron-containing proteins that transfer electrons.' },
  diffany: { agar: 'nutrient', look: 'flat', size: [4, 6.5], fill: '#ddd5b5', edge: '#a99f7c', sheen: '#ece6cf',
    caption: 'Flat colonies that look like ground glass, and glow yellow-green under UV light.' },
  nova: { agar: 'nutrient', look: 'chalky', size: [3, 4.6], fill: '#f3f1ec', edge: '#c3bdae',
    caption: 'Dry, chalky white colonies that stick to the agar and smell like soil.' },
  pearl: { agar: 'nutrient', look: 'round', size: [4.4, 6.4], fill: '#f5f2ea', edge: '#bfb8a6',
    caption: 'Big, wet, shiny colonies. Touch one with a loop and it can stretch into a string.' },
  frannie: { agar: 'chocolate', look: 'round', size: [1.2, 1.8], fill: '#d3cfc6', edge: '#8f897d',
    caption: 'Tiny gray colonies that take days to grow, on a plate with extra cysteine she needs.' },
  colette: { agar: 'emb', look: 'round', size: [2.8, 4], fill: '#2e2433', edge: '#1a141d', sheen: '#7fd36b',
    caption: 'On EMB agar her colonies turn dark, with a green metallic sheen.' },
  ari: { agar: 'bg11', look: 'flat', size: [3, 5], fill: '#3f9e86', edge: '#2a6f5d',
    caption: 'Blue-green colonies on a plate with no sugar at all: she makes her own food from light.' },
  dina: { agar: 'nutrient', look: 'round', size: [2.8, 4], fill: '#e9727e', edge: '#a8404d',
    caption: 'Pinkish-red colonies, colored by pigments that help protect her from UV radiation.' },
  marina: { agar: 'nutrient', look: 'round', size: [2.2, 3.4], fill: '#f0c43a', edge: '#a8820f', rough: true,
    caption: 'Slow colonies that start out cream and turn yellow after time in the light.' },
  bree: { agar: 'nutrient', look: 'round', size: [1.6, 2.4], fill: '#e9c27a', edge: '#a8843d', see: true,
    caption: 'Small, smooth, honey-colored colonies that take a few days to appear.' },
  nessa: { agar: 'chocolate', look: 'round', size: [2.2, 3.2], fill: '#cfcbc3', edge: '#878175',
    caption: 'Gray, shiny colonies on chocolate agar, grown with a little extra carbon dioxide.' },
  hallie: { agar: 'blood', look: 'round', size: [1, 1.6], fill: '#dcd8cf', edge: '#8f8878', see: true,
    caption: 'Tiny, almost clear colonies that take days to show up, in a jar with little oxygen.' },
  cora: { agar: 'tellurite', look: 'round', size: [2.2, 3.2], fill: '#2a2624', edge: '#100e0d', ring: [['brown', 2.2]],
    caption: 'On tellurite agar her colonies turn black, which helps labs spot her.' },
  myra: { agar: 'sp4', look: 'round', size: [0.5, 0.8], fill: '#efe9da', edge: '#c4bba5', spread: true, many: true,
    caption: 'Her colonies are so tiny that labs use magnification to spot them.' },
  cleo: { agar: 'blood', look: 'round', size: [2.2, 3.2], fill: '#ece7da', edge: '#9a9278', ring: [['partial', 3.8], ['clear', 2.3]],
    caption: 'On blood agar: a clear inner ring and a hazier outer ring, her double zone.' },
  vera: { agar: 'esculin', look: 'round', size: [2, 3], fill: '#ebe6d9', edge: '#b0a893', ring: [['black', 4]],
    caption: 'On bile esculin agar, the agar turns black around her colonies.' },
};

// The three plates every pal can be tried on, besides her own, to compare:
// - blood agar: rich, and shows who breaks red blood cells
// - MacConkey: selective, since its bile salts and crystal violet stop
//   Gram-positive bacteria, and differential, since bacteria that ferment its
//   lactose sugar turn pink while the rest stay pale
// - chocolate agar: blood heated until it releases nutrients, so even the
//   fussiest eaters grow
// Each is her caption on that plate, or her look there too: anything not
// given is the same as on her own plate (her look, size and colors), but
// without her own plate's rings, centers or sheen. `look: 'none'` is an empty
// plate. A pal without COMPARE (Elia) has only her own plate.
// An empty plate because she doesn't grow there.
const NO = (caption) => ({ look: 'none', caption });
// An empty plate for a different reason: this isn't a plate labs grow her on,
// so it's not that she can't grow, it's that this isn't how you'd meet her.
// Drawn with a faint veil over the agar, so it doesn't read as "nothing grew".
const NOT_SHOWN = (caption) => ({ look: 'none', veil: true, caption });
const NO_GRAM_POSITIVE = NO('No growth: its bile salts and crystal violet stop most Gram-positive bacteria.');
const NO_FUSSY = NO('No growth: she needs richer food than MacConkey has.');
// A few small colonies: she grows poorly here, not not at all.
const SCANT = { look: 'round', size: [0.8, 1.3], spread: true, many: false };
const PINK = { fill: '#e2457e', edge: '#9c1f50', ring: [['pink', 1.8]] };
const PALE = { fill: '#f4e7ea', edge: '#c7a3ad' };
const GRAY = { fill: '#ddd9d0', edge: '#8f8878' };
const WIDE_CLEAR = [['clear', 2.4]];

export const COMPARE = {
  mona: {
    blood: { caption: 'Flat colonies, often in a clear ring, with her blue-green pigment.', ring: WIDE_CLEAR },
    macconkey: { caption: "Pale colonies: she doesn't ferment lactose.", look: 'round', size: [2.6, 3.8], ...PALE },
    chocolate: 'Grows well, flat and spreading.',
  },
  vi: {
    blood: { caption: 'Gray, shiny colonies.', ...GRAY },
    macconkey: { caption: 'Usually pale colonies: in lab tests she does not ferment lactose.', ...PALE },
    chocolate: { caption: 'Grows well.', ...GRAY },
  },
  coco: {
    blood: NO('No growth: what she needs is locked inside the red blood cells.'),
    macconkey: NO_FUSSY,
  },
  ana: {
    blood: 'Small white colonies, grown in a jar with no oxygen.',
    macconkey: NO_GRAM_POSITIVE,
    chocolate: 'Small white colonies, grown in a jar with no oxygen.',
  },
  penny: {
    macconkey: NO_GRAM_POSITIVE,
    chocolate: 'Grows, with a little extra carbon dioxide.',
  },
  scarlett: {
    macconkey: NO_GRAM_POSITIVE,
    chocolate: 'Grows, but no clear rings show: its blood cells were already broken by heating.',
  },
  goldie: {
    blood: { caption: 'Creamy golden colonies, often in a clear ring of broken blood cells.', ring: [['clear', 1.8]] },
    macconkey: NO_GRAM_POSITIVE,
    chocolate: 'Grows well, golden and shiny.',
  },
  ceres: {
    blood: { caption: 'Big, flat, frosted colonies, each in a wide clear ring.', ring: [['clear', 1.6]] },
    macconkey: NO_GRAM_POSITIVE,
    chocolate: 'Grows well, big and flat.',
  },
  sallie: {
    blood: { caption: 'Gray colonies.', ...GRAY },
    macconkey: { caption: "Pale colonies: she doesn't ferment lactose, so she stays colorless.", ...PALE },
    chocolate: { caption: 'Grows well.', ...GRAY },
  },
  terra: {
    macconkey: NO_GRAM_POSITIVE,
    chocolate: 'Swarms across it in a thin film, grown in a jar with no oxygen.',
  },
  lissie: {
    macconkey: NO_GRAM_POSITIVE,
    chocolate: 'Small, smooth colonies, with no clear rings: its blood cells were already broken.',
  },
  sara: {
    blood: 'Grows well; her red pigment may show at room temperature.',
    macconkey: { caption: 'Pale colonies, though her red pigment can still show.', fill: '#e9a2a8', edge: '#b0525c' },
    chocolate: 'Grows well; her red pigment may show at room temperature.',
  },
  ivy: {
    blood: 'Still spreads in curling, rootlike branches.',
    macconkey: NO_GRAM_POSITIVE,
    chocolate: 'Still spreads in curling, rootlike branches.',
  },
  astrid: {
    blood: NOT_SHOWN('Not shown: labs grow her on plates with very little food instead.'),
    macconkey: NOT_SHOWN('Not shown: labs grow her on plates with very little food instead.'),
    chocolate: NOT_SHOWN('Not shown: labs grow her on plates with very little food instead.'),
  },
  kiki: {
    blood: { caption: 'Grows well, often a little yellow.', fill: '#efe2a0', edge: '#a8930a' },
    macconkey: { caption: 'Pink or pale colonies: only some of her strains ferment lactose.', ...PINK },
    chocolate: { caption: 'Grows well, often a little yellow.', fill: '#efe2a0', edge: '#a8930a' },
  },
  electra: {
    blood: NOT_SHOWN('Not shown: she needs special food and no oxygen, which this plate is not set up for.'),
    macconkey: NOT_SHOWN('Not shown: she needs special food and no oxygen, which this plate is not set up for.'),
    chocolate: NOT_SHOWN('Not shown: she needs special food and no oxygen, which this plate is not set up for.'),
  },
  diffany: {
    blood: 'Gray colonies, grown with no oxygen. Labs say she smells like a horse barn.',
    macconkey: NO_GRAM_POSITIVE,
    chocolate: 'Grows in a jar with no oxygen.',
  },
  nova: {
    blood: 'Dry, chalky colonies, after a few days.',
    macconkey: NO_GRAM_POSITIVE,
    chocolate: 'Dry, chalky colonies, after a few days.',
  },
  pearl: {
    blood: 'Big, wet, shiny colonies.',
    macconkey: { caption: 'Big, wet, pink colonies: she ferments lactose.', ...PINK },
    chocolate: 'Big, wet, shiny colonies.',
  },
  frannie: {
    blood: { caption: 'Little or no growth: she needs a plate enriched with cysteine.', ...SCANT },
    macconkey: NO_FUSSY,
  },
  colette: {
    blood: { caption: 'Gray, shiny colonies.', ...GRAY },
    // The haze around her is bile the plate drops out where she's most acid,
    // not her own color spreading.
    macconkey: { caption: 'Bright pink colonies with a cloudy halo: she ferments the lactose sugar in it.', ...PINK },
    chocolate: { caption: 'Grows well.', ...GRAY },
  },
  ari: {
    blood: NOT_SHOWN('Not shown: labs grow her on plain mineral agar in the light instead.'),
    macconkey: NOT_SHOWN('Not shown: labs grow her on plain mineral agar in the light instead.'),
    chocolate: NOT_SHOWN('Not shown: labs grow her on plain mineral agar in the light instead.'),
  },
  dina: {
    blood: 'Pinkish-red colonies.',
    macconkey: NO_GRAM_POSITIVE,
    chocolate: 'Pinkish-red colonies.',
  },
  marina: {
    blood: 'Slow colonies, after a week or more; she likes cooler temperatures.',
    macconkey: NO('No growth: its bile salts and crystal violet stop her.'),
    chocolate: 'Slow colonies, after a week or more; she likes cooler temperatures.',
  },
  bree: {
    blood: 'Small, smooth colonies, after a few days.',
    macconkey: NO_FUSSY,
    chocolate: 'Small, smooth colonies, after a few days.',
  },
  nessa: {
    blood: 'Gray, shiny colonies.',
    macconkey: NO_FUSSY,
  },
  hallie: {
    macconkey: NO_FUSSY,
    chocolate: 'Tiny colonies after a few days, in a jar with little oxygen.',
  },
  cora: {
    blood: { caption: 'Small gray colonies.', ...GRAY },
    macconkey: NO_GRAM_POSITIVE,
    chocolate: { caption: 'Small gray colonies.', ...GRAY },
  },
  myra: {
    blood: NO('No growth: she needs a special agar with cholesterol and other extras.'),
    macconkey: NO('No growth: she needs a special agar with cholesterol and other extras.'),
    chocolate: NO('No growth: she needs a special agar with cholesterol and other extras.'),
  },
  cleo: {
    macconkey: NO_GRAM_POSITIVE,
    chocolate: 'Grows with no oxygen, but no rings show: its blood cells were already broken.',
  },
  vera: {
    blood: 'Gray colonies, without clear rings.',
    macconkey: NO('Usually no growth: standard MacConkey agar stops most Gram-positive bacteria.'),
    chocolate: 'Grows well.',
  },
};

// The plates she has on her profile, her own first: each with its kind
// ('home', or the comparison plate's agar), its name and her caption there.
export function platesFor(id) {
  const home = COLONIES[id];
  const plates = [{ kind: 'home', name: AGAR_NAMES[home.agar], caption: home.caption }];
  for (const [agar, entry] of Object.entries(COMPARE[id] ?? {})) {
    plates.push({ kind: agar, name: AGAR_NAMES[agar], caption: typeof entry === 'string' ? entry : entry.caption });
  }
  return plates;
}

// Her look on a plate: her own, or a comparison plate's, built on her own.
function lookOn(id, kind) {
  const home = COLONIES[id];
  if (kind === 'home') return home;
  const entry = COMPARE[id][kind];
  const { look, size, fill, edge, see, rough, spread, many } = home;
  return { look, size, fill, edge, see, rough, spread, many, ...(typeof entry === 'string' ? {} : entry), agar: kind };
}

// The plate: 200 units across, agar out to AGAR_R from the middle.
const AGAR_R = 88;

// Numbers from 0 to 1 that look random but are the same every time.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const n1 = (x) => x.toFixed(1);

// The four streaks, a quadrant each, as zigzag lines: where each line runs,
// the merged band of growth along the first, and colonies scattered along
// the rest, thinning out from the second to the last.
function streaks(random) {
  const lines = [];
  const spots = [];
  const band = [];
  const QUADRANTS = [
    { cx: 66, cy: 66, angle: -0.75, colonies: 0, jitter: 0 }, // merged growth (the band)
    { cx: 138, cy: 66, angle: 0.8, colonies: 70, jitter: 1.2 }, // crowded, touching colonies
    { cx: 138, cy: 136, angle: 2.35, colonies: 22, jitter: 4 },
    { cx: 64, cy: 136, angle: 3.9, colonies: 9, jitter: 14 }, // single colonies
  ];
  QUADRANTS.forEach((q, zone) => {
    const [cos, sin] = [Math.cos(q.angle), Math.sin(q.angle)];
    const at = (t) => {
      const along = (t - 0.5) * 66;
      const across = Math.sin(t * Math.PI * 9) * 22;
      return [q.cx + along * cos - across * sin, q.cy + along * sin + across * cos];
    };
    let d = '';
    for (let k = 0; k <= 80; k++) {
      const [x, y] = at(k / 80);
      d += `${k ? 'L' : 'M'}${n1(x)} ${n1(y)}`;
    }
    lines.push(d);
    if (zone === 0) {
      // Merged growth: overlapping blobs along the first streak, with uneven
      // edges, breaking into separate colonies toward its end.
      for (let k = 0; k <= 200; k++) {
        const t = k / 200;
        if (t > 0.72 && random() < (t - 0.72) * 3.2) continue;
        const [x, y] = at(t);
        band.push({ x: x + (random() - 0.5) * 1.6, y: y + (random() - 0.5) * 1.6, w: 0.75 + random() * 0.55 });
      }
    }
    for (let i = 0; i < q.colonies; i++) {
      const [x, y] = at(random());
      spots.push({ x: x + (random() - 0.5) * q.jitter * 2, y: y + (random() - 0.5) * q.jitter * 2, zone });
    }
  });
  return { lines, spots, band };
}

// Colonies spread over the whole plate, not along a streak: Myra's many
// specks scattered anywhere, or Ivy's few big ones laid out so each has room
// to branch.
const ROOMY = [[60, 62], [104, 50], [146, 70], [58, 112], [102, 100], [148, 122], [72, 152], [120, 150]];

function spread(random, many) {
  if (!many) return ROOMY.map(([x, y]) => ({ x: x + (random() - 0.5) * 8, y: y + (random() - 0.5) * 8, zone: 3 }));
  const spots = [];
  for (let i = 0; i < 40; i++) {
    const a = random() * Math.PI * 2;
    const r = Math.sqrt(random()) * (AGAR_R - 12);
    spots.push({ x: 100 + r * Math.cos(a), y: 100 + r * Math.sin(a), zone: 3 });
  }
  return spots;
}

// A smooth, lumpy outline (a flat colony's wavy edge): no spikes. `wobble`
// scales how lumpy it is.
function lumpy(x, y, r, random, wobble = 1) {
  const [p1, p2] = [random() * 6.3, random() * 6.3];
  const n = 24;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 + wobble * (0.22 * Math.sin(2 * a + p1) + 0.12 * Math.sin(3 * a + p2)));
    pts.push([x + rr * Math.cos(a), y + rr * Math.sin(a)]);
  }
  const mid = (p, q) => `${n1((p[0] + q[0]) / 2)} ${n1((p[1] + q[1]) / 2)}`;
  let d = `M${mid(pts[0], pts[1])}`;
  for (let i = 1; i <= n; i++) d += ` Q${n1(pts[i % n][0])} ${n1(pts[i % n][1])} ${mid(pts[i % n], pts[(i + 1) % n])}`;
  return `${d} Z`;
}

// Curling, rootlike branches from the middle, all turning the same way.
function rhizoid(x, y, r, color, random) {
  let out = `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r * 0.18)}" fill="${color}" />`;
  const ARMS = 7;
  for (let k = 0; k < ARMS; k++) {
    let a = (k / ARMS) * Math.PI * 2 + random() * 0.4;
    let [px, py] = [x, y];
    let d = `M${n1(px)} ${n1(py)}`;
    for (let s = 0; s < 6; s++) {
      a += 0.28;
      const step = r / 6;
      px += step * Math.cos(a);
      py += step * Math.sin(a);
      d += ` L${n1(px)} ${n1(py)}`;
      if (s === 2 || s === 4) {
        const b = a - 0.9;
        out += `<path d="M${n1(px)} ${n1(py)} q${n1(step * Math.cos(b))} ${n1(step * Math.sin(b))} ${n1(step * 1.6 * Math.cos(b + 0.4))} ${n1(step * 1.6 * Math.sin(b + 0.4))}" stroke="${color}" stroke-width="0.9" fill="none" stroke-linecap="round" />`;
      }
    }
    out += `<path d="${d}" stroke="${color}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />`;
  }
  return out;
}

// Her plate, as SVG markup, 200 units across: her own (kind 'home'), or a
// comparison plate ('blood', 'macconkey' or 'chocolate').
export function plate(id, kind = 'home') {
  const c = lookOn(id, kind);
  // Names for the plate's gradients and filters, its own on a page with more.
  const key = kind === 'home' ? id : `${id}-${kind}`;
  // A different but fixed pattern for each pal.
  const random = seeded([...id].reduce((sum, ch) => sum * 31 + ch.charCodeAt(0), 7) % 2147483646 + 1);
  const [middle, edge] = AGARS[c.agar];
  const rings = c.ring ?? [];
  // What each ring kind covers, drawn solid here and made see-through as one
  // layer below, so overlapping rings don't pile up into darker patches.
  const ringShapes = rings.map(() => '');
  const ringAround = (x, y, r) => rings.forEach(([kind, reach], k) => {
    ringShapes[k] += RINGS[kind].spill
      ? `<path d="${lumpy(x, y, r * reach, random, 1.4)}" />`
      : `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r * reach)}" />`;
  });
  let growth = '';

  if (c.look === 'film') {
    // A thin film over most of the plate, thicker where it started and
    // thinning out toward its wavy edge, with the agar it's changed around it.
    const r = AGAR_R - 10;
    rings.forEach((_, k) => { ringShapes[k] += `<path d="${lumpy(100, 100, r + 4, random, 0.3)}" />`; });
    growth += `<path d="${lumpy(100, 100, r, random, 0.3)}" fill="${c.fill}" opacity="0.35" />` +
      `<path d="${lumpy(88, 86, r * 0.55, random, 0.5)}" fill="${c.fill}" opacity="0.3" />`;
  } else if (c.look !== 'none') {
    let spots;
    if (c.spread) {
      spots = spread(random, c.many);
    } else {
      const streak = streaks(random);
      spots = streak.spots;
      // The first streak: overlapping blobs that merge into one uneven band,
      // outlined all around (each blob's outline first, then all their
      // fills over it), with the agar it's changed around it.
      const half = c.look === 'flat' ? 2.4 : 2;
      let outline = '';
      let fill = '';
      for (const b of streak.band) {
        const r = half * b.w;
        ringAround(b.x, b.y, r * 0.75);
        if (c.edge) outline += `<circle cx="${n1(b.x)}" cy="${n1(b.y)}" r="${n1(r + 0.45)}" fill="${c.edge}" />`;
        fill += `<circle cx="${n1(b.x)}" cy="${n1(b.y)}" r="${n1(r)}" fill="${c.fill}" />`;
      }
      growth += `<g class="band"${c.look === 'flat' ? ' opacity="0.8"' : ''}>${outline}${fill}</g>`;
    }
    for (const s of spots) {
      const [small, big] = c.size;
      // Crowded colonies are smaller; single ones have room to grow.
      const r = (small + random() * (big - small)) * (s.zone === 1 ? 0.7 : 1);
      const [x, y] = [n1(s.x), n1(s.y)];
      ringAround(s.x, s.y, r);
      const outline = c.edge ? ` stroke="${c.edge}" stroke-width="0.5"` : '';
      if (c.look === 'rhizoid') {
        growth += rhizoid(s.x, s.y, r, c.fill, random);
      } else if (c.look === 'flat') {
        // Flat and spreading: broad, low and see-through at the edges.
        growth += `<path d="${lumpy(s.x, s.y, r, random)}" fill="url(#colony-${key})"${outline} opacity="0.75" />`;
      } else if (c.look === 'chalky') {
        // Dry and crumbly: a rough, bumpy top.
        growth += `<path d="${lumpy(s.x, s.y, r, random)}" fill="${c.fill}"${outline} />` +
          `<circle cx="${n1(s.x - r * 0.3)}" cy="${n1(s.y - r * 0.2)}" r="${n1(r * 0.3)}" fill="${c.edge}" opacity="0.35" />` +
          `<circle cx="${n1(s.x + r * 0.3)}" cy="${n1(s.y + r * 0.25)}" r="${n1(r * 0.25)}" fill="${c.edge}" opacity="0.35" />`;
      } else {
        // A domed colony: solid, so a ring around it reads as the agar, not
        // as part of her.
        growth += `<circle cx="${x}" cy="${y}" r="${n1(r)}" fill="url(#colony-${key})"${outline}${c.see ? ' opacity="0.75"' : ''} />`;
        if (c.center) growth += `<circle cx="${x}" cy="${y}" r="${n1(r * 0.4)}" fill="${c.center}" />`;
        // A shine, on colonies big enough to see one.
        if (r > 2 && !c.rough) growth += `<circle cx="${n1(s.x - r * 0.35)}" cy="${n1(s.y - r * 0.35)}" r="${n1(r * 0.25)}" fill="white" opacity="0.7" />`;
      }
    }
  }

  // Each ring kind as one see-through layer with soft edges, outermost first.
  const ringLayers = rings.map(([kind], k) => {
    const { color, opacity, spill } = RINGS[kind];
    return `<g class="ring-${kind}" fill="${color}" opacity="${opacity}" filter="url(#${spill ? 'spill' : 'soft'}-${key})">${ringShapes[k]}</g>`;
  }).join('');

  // A sheen across each colony, or a gentle shading from the top left.
  const shade = c.sheen
    ? `<linearGradient id="colony-${key}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.fill}" /><stop offset="0.45" stop-color="${c.sheen}" /><stop offset="0.6" stop-color="${c.fill}" /></linearGradient>`
    : `<radialGradient id="colony-${key}" cx="40%" cy="38%" r="70%"><stop offset="0.6" stop-color="${c.fill}" /><stop offset="1" stop-color="${c.edge ?? c.fill}" /></radialGradient>`;

  return `<svg class="plate" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
    '<defs>' +
    `<radialGradient id="agar-${key}" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="${middle}" /><stop offset="1" stop-color="${edge}" /></radialGradient>` +
    shade +
    `<clipPath id="dish-${key}"><circle cx="100" cy="100" r="${AGAR_R}" /></clipPath>` +
    // Soft edges for rings, softer still for changes that spill into the agar.
    `<filter id="soft-${key}"><feGaussianBlur stdDeviation="0.9" /></filter>` +
    `<filter id="spill-${key}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2" /></filter>` +
    '</defs>' +
    // The dish's rim, then the agar, then what grew on it, kept inside the agar.
    '<circle cx="100" cy="100" r="96" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2.5" />' +
    `<circle cx="100" cy="100" r="${AGAR_R}" fill="url(#agar-${key})" />` +
    `<g clip-path="url(#dish-${key})">${ringLayers}${growth}</g>` +
    // A plate labs don't grow her on: a faint veil, so an empty plate here
    // doesn't read as "nothing grew".
    (c.veil ? `<circle cx="100" cy="100" r="${AGAR_R}" fill="#f8fafc" opacity="0.55" />` : '') +
    // A glint on the lid.
    '<path d="M40 46 Q60 22 96 16" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.55" />' +
    '</svg>';
}
