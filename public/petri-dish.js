const params = new URLSearchParams(window.location.search);
const choice = params.get('buddy');
const buddy = document.querySelector(`.dish-buddy[data-buddy="${choice}"]`);

// How each buddy grows. Every buddy is a single cell that divides each time it
// eats. Rods (Mona, Vi) separate after dividing. Cocci are round cells whose
// daughters stick together: in chains for Streptococcus (divides in one
// plane) or grape-like clusters for Staphylococcus (divides in several).
const SPECIES = {
  mona: { kind: 'rod' },
  vi: { kind: 'rod' },
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

const GAME = {
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

if (buddy) {
  buddy.removeAttribute('hidden');
  document.title = `PetriPals | ${buddy.dataset.name}`;
  const nutrients = scatterNutrients();
  playGame(buddy, SPECIES[buddy.dataset.buddy], nutrients);
} else {
  // No buddy (or an unknown one) in the URL: send them back to choose.
  window.location.replace('./buddy-picker.html');
}

function playGame(buddyEl, species, nutrients) {
  const agar = document.querySelector('.agar');
  const counter = document.querySelector('.cell-count');
  const dishRadius = () => agar.clientWidth / 2;

  // Every living group in the dish. The first is the one the player steers.
  const playerMover = document.querySelector('.buddy-mover');
  playerMover.classList.add('player');
  const makeGroup = species.kind === 'rod' ? rodGroup : coccusGroup;
  const player = makeGroup({ mover: playerMover, svg: buddyEl, species, isPlayer: true });
  const groups = [player];

  let pending = 0; // nutrients eaten toward the next division
  let sinceDivision = Infinity; // ms since the last division
  let finished = false;
  let lastTime = null;

  const directions = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
  };
  const held = new Set();

  window.addEventListener('keydown', (event) => {
    if (!(event.key in directions)) return;
    event.preventDefault(); // stop arrow keys from scrolling the page
    if (!finished) held.add(event.key);
  });
  window.addEventListener('keyup', (event) => held.delete(event.key));
  // Don't keep moving if the window loses focus while a key is down.
  window.addEventListener('blur', () => held.clear());

  document.querySelector('.play-again').addEventListener('click', () => {
    window.location.reload();
  });

  const totalCells = () => groups.reduce((sum, g) => sum + g.cellCount(), 0);

  function updateCounter() {
    const shown = Math.min(totalCells(), GAME.TARGET_CELLS);
    counter.textContent = `${shown} / ${GAME.TARGET_CELLS} cells`;
  }

  // Binary fission: the player's cell divides and the daughter stays behind.
  // A rod's daughter slides off on its own; a coccus's daughter joins a nearby
  // chain or cluster, or starts a new one. Offspring never divide themselves.
  function dividePlayer() {
    pending -= GAME.NUTRIENTS_PER_DIVISION;
    sinceDivision = 0;
    const offspring = player.divide(groups.filter((g) => g !== player), dishRadius());
    if (offspring) groups.push(offspring);
    updateCounter();
  }

  function step(time) {
    const seconds = lastTime === null ? 0 : Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    const radius = dishRadius();

    // Steer the player's group.
    if (!finished) {
      let dx = 0;
      let dy = 0;
      for (const key of held) {
        dx += directions[key][0];
        dy += directions[key][1];
      }
      if (dx !== 0 || dy !== 0) {
        const length = Math.hypot(dx, dy); // same speed on diagonals
        player.x += (dx / length) * GAME.SPEED * radius * seconds;
        player.y += (dy / length) * GAME.SPEED * radius * seconds;
        if (dx !== 0) player.facing = Math.sign(dx);
      }
    }

    sinceDivision += seconds * 1000;

    for (const group of groups) {
      if (group !== player) group.coast(seconds);
      group.update(seconds);
    }
    // Measure every group once, after all the size changes, instead of
    // measuring between writes (which makes the browser re-lay-out each time).
    for (const group of groups) group.size = group.reach();
    pushApart(groups, player);
    for (const group of groups) {
      [group.x, group.y] = keepInDish(agar, group.x, group.y, group.size, group);
      group.place();
    }

    if (!finished) {
      let ate = 0;
      for (const [px, py, reach] of player.mouths()) {
        ate += nutrients.eatNear(px / radius, py / radius, reach / radius);
      }
      pending += ate;

      const won = totalCells() >= GAME.TARGET_CELLS;
      if (won && sinceDivision > GAME.DIVIDE_MS + 300) {
        finished = true;
        held.clear();
        nutrients.stop();
        setTimeout(showWin, 300);
      } else if (!won && pending >= GAME.NUTRIENTS_PER_DIVISION &&
                 sinceDivision > GAME.DIVIDE_MS) {
        dividePlayer();
      }
    }

    requestAnimationFrame(step);
  }

  function showWin() {
    const banner = document.querySelector('.win-banner');
    banner.querySelector('.win-message').textContent =
      `${buddyEl.dataset.name} grew a colony of ${GAME.TARGET_CELLS} cells!`;
    banner.removeAttribute('hidden');
    banner.querySelector('.play-again').focus();
  }

  updateCounter();
  requestAnimationFrame(step);
}

// Keep a group whose farthest edge is `reach` px from its center fully inside
// the dish, sliding along the rim. Offspring still sliding bounce off it.
function keepInDish(agar, px, py, reach, group) {
  const maxDistance = Math.max(0, agar.clientWidth / 2 - reach);
  const fromCenter = Math.hypot(px, py);
  if (fromCenter <= maxDistance) return [px, py];
  const nx = px / fromCenter;
  const ny = py / fromCenter;
  if (group && !group.isPlayer) {
    const outward = group.vx * nx + group.vy * ny;
    if (outward > 0) {
      group.vx -= 2 * outward * nx;
      group.vy -= 2 * outward * ny;
    }
  }
  return [nx * maxDistance, ny * maxDistance];
}

// While offspring are still settling, nudge them off each other so they
// don't land in a pile. The player swims over everything, and offspring that
// have settled stay exactly where they are.
function pushApart(groups, player) {
  const settling = (g) => g !== player && g.age * 1000 < GAME.SETTLE_MS;
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const a = groups[i];
      const b = groups[j];
      if (a === player || b === player) continue;
      const aMoves = settling(a);
      const bMoves = settling(b);
      if (!aMoves && !bMoves) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy) || 0.01;
      const overlap = (a.size + b.size) * 0.75 - distance;
      if (overlap <= 0) continue;
      const nx = dx / distance;
      const ny = dy / distance;
      const aShare = aMoves && bMoves ? 0.5 : aMoves ? 1 : 0;
      const push = Math.min(overlap, 3);
      a.x -= nx * push * aShare;
      a.y -= ny * push * aShare;
      b.x += nx * push * (1 - aShare);
      b.y += ny * push * (1 - aShare);
    }
  }
}

// Offspring on agar don't wander: a new group slides a little way from where
// it split off, slows down, and stays put, the way cells on a plate stay
// where they land and grow into colonies.
function coaster(group) {
  group.age = 0;
  return (seconds) => {
    group.age += seconds;
    const slowdown = Math.exp(-GAME.SETTLE_RATE * seconds);
    group.vx *= slowdown;
    group.vy *= slowdown;
    if (Math.hypot(group.vx, group.vy) < 1) {
      group.vx = 0;
      group.vy = 0;
    }
    group.x += group.vx * seconds;
    group.y += group.vy * seconds;
  };
}

// Add a new group's mover to the dish, holding a copy of the buddy art.
function newMover(svg) {
  const mover = document.createElement('div');
  mover.className = 'buddy-mover offspring';
  svg.removeAttribute('role');
  svg.removeAttribute('aria-label');
  svg.setAttribute('aria-hidden', 'true');
  mover.appendChild(svg);
  document.querySelector('.agar').appendChild(mover);
  return mover;
}

// A rod-shaped cell (Mona, Vi). Each division it splits across the middle
// and the two cells go their separate ways.
function rodGroup({ mover, svg, species, isPlayer }) {
  const ROD_WIDTH = 14; // percent of the dish

  const group = {
    mover,
    svg,
    isPlayer,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    facing: 1,
    cellCount: () => 1,
    halfWidth: () => svg.getBoundingClientRect().width / 2,
    reach: () => group.halfWidth(),
    update() {
      mover.style.width = `${ROD_WIDTH}%`;
    },
    place() {
      mover.style.transform = `translate(${group.x}px, ${group.y}px) scaleX(${group.facing})`;
    },
    mouths: () => [[group.x, group.y, group.halfWidth() * GAME.PICKUP_REACH]],
    // Split into two rods that push apart end to end.
    divide() {
      const copy = svg.cloneNode(true);
      const child = rodGroup({ mover: newMover(copy), svg: copy, species, isPlayer: false });
      child.x = group.x;
      child.y = group.y;
      child.facing = group.facing;
      const burst = GAME.BURST_SPEED * (document.querySelector('.agar').clientWidth / 2);
      child.vx = group.facing * burst;
      child.vy = (Math.random() - 0.5) * burst * 0.4;
      if (!isPlayer) group.vx = -child.vx;
      return child;
    },
    coast: null,
  };
  group.coast = coaster(group);
  return group;
}

// A round cell (Scarlett, Goldie). The player is always a single coccus.
// Offspring are chains or clusters of cocci that grow one cell at a time as
// the player's daughters join them, up to GROUP_CAP cells. A chain grows from
// whichever end is nearer the player; a cluster grows on the side facing the
// player. So Scarlett builds chains along the lines she swims, and Goldie
// builds bunches wherever she lingers.
function coccusGroup({ mover, svg, species, isPlayer }) {
  const CELL_SIZE = 6; // one cell's width, as a percent of the dish
  const R = 10; // cell radius in SVG units
  const SPACING = R * 1.75; // center to center, for cells that touch
  const { layout, colors } = species;

  // A fixed pseudo-random value from -1 to 1, so shapes vary without jitter.
  const wobble = (k, salt) => Math.sin(k * 12.9898 + salt * 78.233);

  const group = {
    mover,
    svg,
    isPlayer,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    facing: 1,
    // Cells in SVG units around the group's origin. For a chain, in order.
    cells: [{ x: 0, y: 0, fromX: 0, fromY: 0, toX: 0, toY: 0, face: isPlayer }],
    moveFor: null, // ms into sliding a new cell into place, or null
    twist: Math.random() * Math.PI * 2, // each cluster packs at its own angle
    cellCount: () => group.cells.length,
  };

  // Half the drawing's width and height in SVG units, centered on (0, 0).
  function extent() {
    let mx = 0;
    let my = 0;
    for (const c of group.cells) {
      mx = Math.max(mx, Math.abs(c.x) + R);
      my = Math.max(my, Math.abs(c.y) + R);
    }
    return [mx + 2, my + 2];
  }

  const pxPerUnit = () => mover.offsetWidth / (2 * extent()[0]);

  // Convert between dish pixels (from the dish center) and this group's units.
  function toLocal(wx, wy) {
    const unit = pxPerUnit();
    return [((wx - group.x) / unit) * group.facing, (wy - group.y) / unit];
  }
  function toWorld(lx, ly) {
    const unit = pxPerUnit();
    return [group.x + lx * unit * group.facing, group.y + ly * unit];
  }

  function cellMarkup(c) {
    let out =
      `<circle cx="${c.x}" cy="${c.y}" r="${R}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1.7" />` +
      `<circle cx="${c.x - 2.7}" cy="${c.y - 3.2}" r="1.5" fill="${colors.highlight}" />`;
    if (c.face) {
      out +=
        `<g transform="translate(${c.x} ${c.y})">` +
        `<circle cx="-3.6" cy="0" r="2" fill="${colors.dark}" />` +
        `<circle cx="3.6" cy="0" r="2" fill="${colors.dark}" />` +
        '<circle cx="-3" cy="-0.6" r="0.75" fill="white" />' +
        '<circle cx="4.2" cy="-0.6" r="0.75" fill="white" />' +
        '<ellipse cx="-6.3" cy="3.8" rx="1.8" ry="1.2" fill="#f9a8d4" opacity="0.9" />' +
        '<ellipse cx="6.3" cy="3.8" rx="1.8" ry="1.2" fill="#f9a8d4" opacity="0.9" />' +
        `<path d="M-2 3.8 Q0 6 2 3.8" stroke="${colors.dark}" stroke-width="1.2" fill="none" stroke-linecap="round" />` +
        '</g>';
    }
    return out;
  }

  function draw() {
    const [mx, my] = extent();
    svg.setAttribute('viewBox', `${-mx} ${-my} ${2 * mx} ${2 * my}`);
    mover.style.width = `${(mx / R) * CELL_SIZE}%`;
    // Cells higher up sit behind lower ones.
    const order = [...group.cells].sort((a, b) => a.y - b.y);
    svg.innerHTML = order.map(cellMarkup).join('');
  }

  // Where a new cell would attach to a chain: past whichever end is nearer
  // (px, py), continuing the chain's direction with a gentle bend.
  function chainSpot(px, py) {
    const cells = group.cells;
    if (cells.length === 1) {
      const dx = px - cells[0].x;
      const dy = py - cells[0].y;
      const d = Math.hypot(dx, dy) || 1;
      return { x: cells[0].x + (dx / d) * SPACING, y: cells[0].y + (dy / d) * SPACING, atStart: false };
    }
    const ends = [
      { tip: cells[0], prev: cells[1], atStart: true },
      { tip: cells[cells.length - 1], prev: cells[cells.length - 2], atStart: false },
    ];
    let best = null;
    ends.forEach((end, i) => {
      const dx = end.tip.x - end.prev.x;
      const dy = end.tip.y - end.prev.y;
      const d = Math.hypot(dx, dy) || 1;
      const bend = wobble(cells.length, i + 1) * 0.35;
      const ux = (dx * Math.cos(bend) - dy * Math.sin(bend)) / d;
      const uy = (dx * Math.sin(bend) + dy * Math.cos(bend)) / d;
      const spot = { x: end.tip.x + ux * SPACING, y: end.tip.y + uy * SPACING, atStart: end.atStart };
      spot.distance = Math.hypot(spot.x - px, spot.y - py);
      if (!best || spot.distance < best.distance) best = spot;
    });
    return best;
  }

  // Where a new cell would attach to a cluster: an open spot touching the
  // cluster, on the side facing (px, py), preferring nooks that touch several
  // cells so the cluster fills out into a bunch instead of a line.
  function clusterSpot(px, py) {
    let best = null;
    group.cells.forEach((c, i) => {
      for (let k = 0; k < 6; k++) {
        const angle = group.twist + (k * Math.PI) / 3 + wobble(k, i) * 0.3;
        const x = c.x + Math.cos(angle) * SPACING * 0.95;
        const y = c.y + Math.sin(angle) * SPACING * 0.95;
        if (group.cells.some((o) => Math.hypot(o.x - x, o.y - y) < R * 1.5)) continue;
        const touching = group.cells.filter((o) => Math.hypot(o.x - x, o.y - y) < SPACING * 1.15).length;
        const distance = Math.hypot(x - px, y - py);
        const score = distance - touching * SPACING * 1.5;
        if (!best || score < best.score) best = { x, y, atStart: false, distance, score };
      }
    });
    return best;
  }

  Object.assign(group, {
    reach() {
      let farthest = 0;
      for (const c of group.cells) farthest = Math.max(farthest, Math.hypot(c.x, c.y) + R);
      return farthest * pxPerUnit();
    },
    update(seconds) {
      if (group.moveFor !== null) {
        group.moveFor += seconds * 1000;
        const t = Math.min(1, group.moveFor / GAME.DIVIDE_MS);
        const ease = 1 - (1 - t) ** 3;
        for (const c of group.cells) {
          c.x = c.fromX + (c.toX - c.fromX) * ease;
          c.y = c.fromY + (c.toY - c.fromY) * ease;
        }
        if (t >= 1) group.moveFor = null;
      }
      draw();
    },
    place() {
      mover.style.transform = `translate(${group.x}px, ${group.y}px) scaleX(${group.facing})`;
    },
    // Every cell can pick up nutrients it swims over.
    mouths() {
      return group.cells.map((c) => {
        const [wx, wy] = toWorld(c.x, c.y);
        return [wx, wy, R * pxPerUnit() * 0.9];
      });
    },
    // Where a new cell would join this group if it came from (wx, wy) in the
    // dish, or null if the group is full.
    attachSpot(wx, wy) {
      if (group.cells.length >= GAME.GROUP_CAP) return null;
      const [px, py] = toLocal(wx, wy);
      const spot = layout === 'chain' ? chainSpot(px, py) : clusterSpot(px, py);
      if (!spot) return null;
      spot.world = toWorld(spot.x, spot.y);
      return spot;
    },
    // Slide a new cell from (wx, wy) in the dish into `spot`.
    addCell(spot, wx, wy) {
      const [fx, fy] = toLocal(wx, wy);
      for (const c of group.cells) {
        c.fromX = c.toX = c.x;
        c.fromY = c.toY = c.y;
      }
      const cell = { x: fx, y: fy, fromX: fx, fromY: fy, toX: spot.x, toY: spot.y, face: false };
      if (spot.atStart) group.cells.unshift(cell);
      else group.cells.push(cell);
      group.moveFor = 0;
    },
    // The player divides: the daughter joins the nearest chain or cluster
    // that has room and is close enough, or else starts a new one here.
    divide(others, dishRadius) {
      let best = null;
      for (const other of others) {
        const spot = other.attachSpot?.(group.x, group.y);
        if (!spot) continue;
        const distance = Math.hypot(spot.world[0] - group.x, spot.world[1] - group.y);
        if (distance > GAME.SNAP_REACH * dishRadius) continue;
        if (!best || distance < best.distance) best = { other, spot, distance };
      }
      if (best) {
        best.other.addCell(best.spot, group.x, group.y);
        return null;
      }
      const copy = svg.cloneNode(false);
      const child = coccusGroup({ mover: newMover(copy), svg: copy, species, isPlayer: false });
      child.x = group.x;
      child.y = group.y;
      const angle = Math.random() * Math.PI * 2;
      const burst = GAME.BURST_SPEED * dishRadius * 0.5;
      child.vx = Math.cos(angle) * burst;
      child.vy = Math.sin(angle) * burst;
      return child;
    },
  });

  group.coast = coaster(group);
  draw();
  return group;
}

// Nutrient flecks: scattered over the agar, picked up when the player's
// buddy swims over them, and replaced somewhere else a few seconds later.
function scatterNutrients() {
  const agar = document.querySelector('.agar');
  const COUNT = 10; // flecks on the agar at a time
  const RESPAWN_MS = 3000;
  const MIN_GAP = 0.12; // keep flecks from clumping, as a fraction of the radius

  // Positions are stored relative to the dish center, as fractions of the dish
  // radius (-1 to 1), so they stay put when the window is resized.
  const flecks = [];
  let stopped = false;

  function randomSpot(avoidX, avoidY) {
    for (let tries = 0; tries < 50; tries++) {
      // Uniform over the disk, kept away from the rim.
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random()) * 0.82;
      const fx = Math.cos(angle) * distance;
      const fy = Math.sin(angle) * distance;
      const clearOfBuddy = Math.hypot(fx - avoidX, fy - avoidY) > 0.3;
      const clearOfOthers = flecks.every((f) => Math.hypot(fx - f.fx, fy - f.fy) > MIN_GAP);
      if (clearOfBuddy && clearOfOthers) return { fx, fy };
    }
    return null; // dish is crowded; skip this one
  }

  function addFleck(avoidX, avoidY) {
    if (stopped) return;
    const spot = randomSpot(avoidX, avoidY);
    if (!spot) return;
    const el = document.createElement('span');
    el.className = 'nutrient';
    if (Math.random() < 0.4) el.classList.add('small');
    if (Math.random() < 0.5) el.classList.add('pale');
    el.style.left = `${50 + spot.fx * 50}%`;
    el.style.top = `${50 + spot.fy * 50}%`;
    el.setAttribute('aria-hidden', 'true');
    agar.appendChild(el);
    flecks.push({ el, ...spot });
  }

  // Buddies start in the middle, so the first batch avoids the center.
  for (let i = 0; i < COUNT; i++) addFleck(0, 0);

  return {
    // Pick up every fleck within `reach` of the given spot (all values are
    // fractions of the dish radius). Returns how many were picked up.
    eatNear(bx, by, reach) {
      let count = 0;
      for (let i = flecks.length - 1; i >= 0; i--) {
        const fleck = flecks[i];
        if (Math.hypot(fleck.fx - bx, fleck.fy - by) > reach) continue;
        flecks.splice(i, 1);
        fleck.el.classList.add('eaten');
        fleck.el.addEventListener('transitionend', () => fleck.el.remove(), { once: true });
        setTimeout(() => addFleck(bx, by), RESPAWN_MS);
        count++;
      }
      return count;
    },
    // No more new flecks once the game is over.
    stop() {
      stopped = true;
    },
  };
}
