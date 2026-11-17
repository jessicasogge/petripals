// On the Plate: what each pal's colonies look like on agar, for her profile
// (see profile.js). A colony is the pile of millions of cells that grows from
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
};

// The rings around colonies, by what they do to the agar: [color, opacity].
const RINGS = {
  clear: ['#efc38f', 0.9], // red blood cells broken open: clear
  partial: ['#c4474f', 0.6], // only partly broken: hazy
  green: ['#6d7a35', 0.75], // blood turned greenish
  black: ['#2a2118', 0.8], // the agar turns black
  brown: ['#6b4423', 0.55], // a brown halo
};

// Each pal's plate:
// - agar: which plate (AGARS)
// - look: 'round' (domed and shiny), 'flat' (flat, spreading, wavy edged),
//   'rhizoid' (curling, rootlike branches), 'film' (a thin film over the
//   plate), 'chalky' (dry and crumbly) or 'none' (doesn't grow on agar)
// - size: [smallest, biggest] colony radius, in the plate's 200 units
// - fill and edge: the colonies' colors
// - ring: rings around each colony, inside out (RINGS), and how far each
//   reaches, in colony radii
// - center: a dot in the middle of each colony (Sallie's black centers)
// - sheen: a metallic sheen across each colony (Colette, Mona)
// - spread: a few big colonies spread out over the plate, not a streak
// - caption: what to notice, shown next to her plate (no dashes)
export const COLONIES = {
  mona: { agar: 'mona', look: 'flat', size: [4.5, 7.5], fill: '#93ab98', edge: '#7a9482', sheen: '#b3c5b8',
    caption: 'Flat, spreading colonies with a metallic sheen, and her blue green pigment soaks into the agar.' },
  vi: { agar: 'tcbs', look: 'round', size: [2.6, 4], fill: '#f2cf3c', edge: '#b38f12',
    caption: 'On TCBS, a green plate made for vibrios, her colonies turn yellow from the sugar she eats.' },
  elia: { agar: 'nutrient', look: 'none',
    caption: "Elia won't grow on an ordinary plate. Labs grow her slowly in a special liquid broth instead." },
  coco: { agar: 'chocolate', look: 'round', size: [1.8, 2.8], fill: '#c9c4ba', edge: '#8f897d', see: true,
    caption: 'Small, gray, almost clear colonies on chocolate agar, made with heated blood that feeds her.' },
  ana: { agar: 'nutrient', look: 'round', size: [1.8, 2.8], fill: '#f4f1ea', edge: '#bdb6a5',
    caption: 'Small, smooth, white colonies, grown in a jar with no oxygen at all.' },
  penny: { agar: 'blood', look: 'round', size: [1.6, 2.4], fill: '#d9d6cc', edge: '#8e897b', ring: [['green', 2.6]], center: '#b9b4a6',
    caption: 'Small colonies on blood agar in greenish rings, often with a dip in the middle like a checker piece.' },
  scarlett: { agar: 'blood', look: 'round', size: [1.3, 2], fill: '#e4e0d6', edge: '#8f8878', ring: [['clear', 3.2]],
    caption: 'Tiny colonies on blood agar, each in a clear ring where she broke open red blood cells.' },
  goldie: { agar: 'nutrient', look: 'round', size: [3.2, 5], fill: '#f2b71f', edge: '#b7790a',
    caption: 'Shiny, round, golden colonies. Her name comes from that gold.' },
  ceres: { agar: 'nutrient', look: 'flat', size: [6, 9], fill: '#e3ded0', edge: '#b4ad98', sheen: '#efebe0',
    caption: 'Big, flat, dull colonies with wavy edges that look like frosted glass.' },
  sallie: { agar: 'xld', look: 'round', size: [3, 4.4], fill: '#e78a8f', edge: '#8f2f39', center: '#1f1a1a',
    caption: 'On XLD agar her colonies are red, often with black centers from a smelly gas she makes.' },
  terra: { agar: 'blood', look: 'film', fill: '#e7dfd0', ring: [['clear', 1]],
    caption: 'She swarms across the plate in a thin, almost clear film, so single colonies are hard to find.' },
  lissie: { agar: 'blood', look: 'round', size: [1.8, 2.6], fill: '#e2ded4', edge: '#8f8878', ring: [['clear', 1.7]],
    caption: 'Small, smooth colonies on blood agar, each with a narrow clear ring.' },
  sara: { agar: 'nutrient', look: 'round', size: [3, 4.6], fill: '#d8263a', edge: '#8f1022',
    caption: 'Bright red colonies: she makes a red pigment when she grows at room temperature.' },
  ivy: { agar: 'nutrient', look: 'rhizoid', size: [20, 24], fill: '#fbf8ee', spread: true,
    caption: 'Her colonies spread out in curling, rootlike branches that all spiral the same way.' },
  astrid: { agar: 'nutrient', look: 'round', size: [1.2, 1.9], fill: '#f1ede2', edge: '#bdb6a5',
    caption: 'Tiny, pale colonies that take days to show up, on a plate with very little food.' },
  kiki: { agar: 'nutrient', look: 'round', size: [3, 4.4], fill: '#f5d90f', edge: '#a8930a',
    caption: 'Bright yellow colonies when she grows at room temperature.' },
  electra: { agar: 'nutrient', look: 'round', size: [1.8, 2.8], fill: '#c8543f', edge: '#8a2f22',
    caption: 'Reddish colonies, colored by the iron holding proteins she passes electrons along.' },
  diffany: { agar: 'nutrient', look: 'flat', size: [4, 6.5], fill: '#ddd5b5', edge: '#a99f7c', sheen: '#ece6cf',
    caption: 'Flat colonies that look like ground glass, and glow yellow green under UV light.' },
  nova: { agar: 'nutrient', look: 'chalky', size: [3, 4.6], fill: '#f3f1ec', edge: '#c3bdae',
    caption: 'Dry, chalky white colonies that stick to the agar and smell like soil.' },
  pearl: { agar: 'nutrient', look: 'round', size: [4.4, 6.4], fill: '#f5f2ea', edge: '#bfb8a6',
    caption: 'Big, wet, shiny colonies. Touch one with a loop and it can stretch into a string.' },
  frannie: { agar: 'chocolate', look: 'round', size: [1.2, 1.8], fill: '#d3cfc6', edge: '#8f897d',
    caption: 'Tiny gray colonies that take days to grow, on a plate with extra cysteine she needs.' },
  colette: { agar: 'emb', look: 'round', size: [2.8, 4], fill: '#2e2433', edge: '#1a141d', sheen: '#7fd36b',
    caption: 'On EMB agar her colonies turn dark, with a green metallic sheen.' },
  ari: { agar: 'bg11', look: 'flat', size: [3, 5], fill: '#3f9e86', edge: '#2a6f5d',
    caption: 'Blue green colonies on a plate with no sugar at all: she makes her own food from light.' },
  dina: { agar: 'nutrient', look: 'round', size: [2.8, 4], fill: '#e9727e', edge: '#a8404d',
    caption: 'Pinkish red colonies, colored by pigments that help protect her from radiation.' },
  marina: { agar: 'nutrient', look: 'round', size: [2.2, 3.4], fill: '#f0c43a', edge: '#a8820f', rough: true,
    caption: 'Slow colonies that start out cream and turn yellow after time in the light.' },
  bree: { agar: 'nutrient', look: 'round', size: [1.6, 2.4], fill: '#e9c27a', edge: '#a8843d', see: true,
    caption: 'Small, smooth, honey colored colonies that take a few days to appear.' },
  nessa: { agar: 'chocolate', look: 'round', size: [2.2, 3.2], fill: '#cfcbc3', edge: '#878175',
    caption: 'Gray, shiny colonies on chocolate agar, grown with a little extra carbon dioxide.' },
  hallie: { agar: 'blood', look: 'round', size: [1, 1.6], fill: '#dcd8cf', edge: '#8f8878', see: true,
    caption: 'Tiny, almost clear colonies that take days to show up, in a jar with little oxygen.' },
  cora: { agar: 'tellurite', look: 'round', size: [2.2, 3.2], fill: '#2a2624', edge: '#100e0d', ring: [['brown', 2.2]],
    caption: 'On tellurite agar her colonies turn black, which helps labs spot her.' },
  myra: { agar: 'nutrient', look: 'round', size: [0.5, 0.8], fill: '#efe9da', edge: '#c4bba5', spread: true, many: true,
    caption: 'Her colonies are so tiny that labs look at them under a microscope.' },
  cleo: { agar: 'blood', look: 'round', size: [2.2, 3.2], fill: '#d8d2c2', edge: '#7d755c', ring: [['partial', 3.4], ['clear', 2]],
    caption: 'On blood agar: a clear inner ring and a hazier outer ring, her double zone.' },
  vera: { agar: 'esculin', look: 'round', size: [2, 3], fill: '#d9d3c3', edge: '#8a8270', ring: [['black', 2.6]],
    caption: 'On bile esculin agar, the plate turns black around her colonies.' },
};

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
// and colonies scattered along it, thinning out from the first to the last.
function streaks(random) {
  const lines = [];
  const spots = [];
  const QUADRANTS = [
    { cx: 66, cy: 66, angle: -0.75, colonies: 0, jitter: 0 }, // merged growth, drawn as one band
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
    for (let i = 0; i < q.colonies; i++) {
      const [x, y] = at(random());
      spots.push({ x: x + (random() - 0.5) * q.jitter * 2, y: y + (random() - 0.5) * q.jitter * 2, zone });
    }
  });
  return { lines, spots };
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

// Her plate, as SVG markup, 200 units across.
export function plate(id) {
  const c = COLONIES[id];
  // A different but fixed pattern for each pal.
  const random = seeded([...id].reduce((sum, ch) => sum * 31 + ch.charCodeAt(0), 7) % 2147483646 + 1);
  const [middle, edge] = AGARS[c.agar];
  let rings = '';
  let growth = '';

  if (c.look === 'film') {
    // A thin film over most of the plate, thicker where it started and
    // thinning out toward its wavy edge, with the agar it's changed around it.
    const r = AGAR_R - 10;
    for (const [kind] of c.ring ?? []) rings += `<path d="${lumpy(100, 100, r + 4, random, 0.3)}" fill="${RINGS[kind][0]}" opacity="0.45" />`;
    growth += `<path d="${lumpy(100, 100, r, random, 0.3)}" fill="${c.fill}" opacity="0.35" />` +
      `<path d="${lumpy(88, 86, r * 0.55, random, 0.5)}" fill="${c.fill}" opacity="0.3" />`;
  } else if (c.look !== 'none') {
    let spots;
    if (c.spread) {
      spots = spread(random, c.many);
    } else {
      const streak = streaks(random);
      spots = streak.spots;
      // The first streak: one merged band of growth, with its rings.
      const band = (width, paint) => `<path d="${streak.lines[0]}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${paint} />`;
      const width = c.look === 'flat' ? 4.4 : 3.6;
      for (const [kind, reach] of c.ring ?? []) {
        rings += band(width + 2.6 * reach, `stroke="${RINGS[kind][0]}" opacity="${RINGS[kind][1]}"`);
      }
      growth += band(width + 0.8, `stroke="${c.edge}"`) + band(width, `stroke="${c.fill}"`);
    }
    for (const s of spots) {
      const [small, big] = c.size;
      // Crowded colonies are smaller; single ones have room to grow.
      const r = (small + random() * (big - small)) * (s.zone === 1 ? 0.7 : 1);
      const [x, y] = [n1(s.x), n1(s.y)];
      for (const [kind, reach] of c.ring ?? []) {
        rings += `<circle cx="${x}" cy="${y}" r="${n1(r * reach)}" fill="${RINGS[kind][0]}" opacity="${RINGS[kind][1]}" />`;
      }
      if (c.look === 'rhizoid') {
        growth += rhizoid(s.x, s.y, r, c.fill, random);
      } else if (c.look === 'flat') {
        growth += `<path d="${lumpy(s.x, s.y, r, random)}" fill="url(#colony-${id})" stroke="${c.edge}" stroke-width="0.4" opacity="0.85" />`;
      } else if (c.look === 'chalky') {
        // Dry and crumbly: a rough, bumpy top.
        growth += `<path d="${lumpy(s.x, s.y, r, random)}" fill="${c.fill}" stroke="${c.edge}" stroke-width="0.6" />` +
          `<circle cx="${n1(s.x - r * 0.3)}" cy="${n1(s.y - r * 0.2)}" r="${n1(r * 0.3)}" fill="${c.edge}" opacity="0.35" />` +
          `<circle cx="${n1(s.x + r * 0.3)}" cy="${n1(s.y + r * 0.25)}" r="${n1(r * 0.25)}" fill="${c.edge}" opacity="0.35" />`;
      } else {
        growth += `<circle cx="${x}" cy="${y}" r="${n1(r)}" fill="url(#colony-${id})" stroke="${c.edge}" stroke-width="0.5"${c.see ? ' opacity="0.75"' : ''} />`;
        if (c.center) growth += `<circle cx="${x}" cy="${y}" r="${n1(r * 0.4)}" fill="${c.center}" />`;
        // A shine, on colonies big enough to see one.
        if (r > 2 && !c.rough) growth += `<circle cx="${n1(s.x - r * 0.35)}" cy="${n1(s.y - r * 0.35)}" r="${n1(r * 0.25)}" fill="white" opacity="0.7" />`;
      }
    }
  }

  // A sheen across each colony, or a gentle shading from the top left.
  const shade = c.sheen
    ? `<linearGradient id="colony-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.fill}" /><stop offset="0.45" stop-color="${c.sheen}" /><stop offset="0.6" stop-color="${c.fill}" /></linearGradient>`
    : `<radialGradient id="colony-${id}" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="${c.fill}" stop-opacity="0.85" /><stop offset="1" stop-color="${c.fill}" /></radialGradient>`;

  return `<svg class="plate" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
    '<defs>' +
    `<radialGradient id="agar-${id}" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="${middle}" /><stop offset="1" stop-color="${edge}" /></radialGradient>` +
    shade +
    `<clipPath id="dish-${id}"><circle cx="100" cy="100" r="${AGAR_R}" /></clipPath>` +
    '</defs>' +
    // The dish's rim, then the agar, then what grew on it, kept inside the agar.
    '<circle cx="100" cy="100" r="96" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2.5" />' +
    `<circle cx="100" cy="100" r="${AGAR_R}" fill="url(#agar-${id})" />` +
    `<g clip-path="url(#dish-${id})">${rings}${growth}</g>` +
    // A glint on the lid.
    '<path d="M40 46 Q60 22 96 16" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.55" />' +
    '</svg>';
}
