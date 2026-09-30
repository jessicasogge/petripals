const params = new URLSearchParams(window.location.search);
const choice = params.get('buddy');
const buddy = document.querySelector(`.dish-buddy[data-buddy="${choice}"]`);

// How each buddy grows. Rods (Mona, Vi) are single cells that separate after
// dividing. Cocci are round cells whose daughters stay stuck together: a
// chain for Streptococcus (divides in one plane) or a grape-like cluster for
// Staphylococcus (divides in several planes).
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
  TARGET_CELLS: 64, // grow the population to this many cells to win
  GROUP_CAP: 8, // chains and clusters break in two when they'd pass this
  NUTRIENTS_PER_GENERATION: 2, // nutrients the player eats per round of division
  SHRINK: 0.86, // cocci are drawn a bit smaller each generation so they fit
  ROD_SHRINK: 0.83, // rods take more room, so they shrink a bit faster
  SPEED: 0.8, // player speed, as a fraction of the dish radius per second
  DRIFT_SPEED: 0.1, // how fast offspring wander, same units
  BURST_SPEED: 0.9, // how hard a new group pushes away when it splits off
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

  let generation = 0;
  let scale = 1; // drawn size; eases toward SHRINK ** generation
  let pending = 0; // nutrients eaten toward the next generation
  let swell = 0; // 0..1, how grown the cells are toward dividing (eased)
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
    counter.textContent = `${totalCells()} / ${GAME.TARGET_CELLS} cells`;
  }

  // One round of binary fission: every cell in every group divides at once.
  function divideEverything() {
    generation++;
    pending -= GAME.NUTRIENTS_PER_GENERATION;
    sinceDivision = 0;
    const born = [];
    for (const group of [...groups]) {
      const offspring = group.divide();
      if (offspring) born.push(offspring);
    }
    groups.push(...born);
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

    // Everyone grows together as the player eats, then divides together.
    const targetSwell = Math.min(1, pending / GAME.NUTRIENTS_PER_GENERATION);
    swell += (targetSwell - swell) * Math.min(1, seconds * 6);
    const shrink = species.kind === 'rod' ? GAME.ROD_SHRINK : GAME.SHRINK;
    scale += (shrink ** generation - scale) * Math.min(1, seconds * 3);
    sinceDivision += seconds * 1000;

    for (const group of groups) {
      if (group !== player) group.wander(seconds, radius);
      group.update(seconds, scale, swell);
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

      const ready =
        pending >= GAME.NUTRIENTS_PER_GENERATION &&
        swell > 0.97 &&
        sinceDivision > GAME.DIVIDE_MS &&
        totalCells() < GAME.TARGET_CELLS;
      if (ready) divideEverything();

      if (totalCells() >= GAME.TARGET_CELLS && sinceDivision > GAME.DIVIDE_MS + 300) {
        finished = true;
        held.clear();
        nutrients.stop();
        setTimeout(showWin, 300);
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
// the dish, sliding along the rim. Drifting groups bounce off it.
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

// Nudge overlapping groups apart so the dish doesn't turn into one pile. The
// player is never pushed; offspring get out of the player's way.
function pushApart(groups, player) {
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const a = groups[i];
      const b = groups[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy) || 0.01;
      const overlap = (a.size + b.size) * 0.75 - distance;
      if (overlap <= 0) continue;
      const nx = dx / distance;
      const ny = dy / distance;
      const aShare = a === player ? 0 : b === player ? 1 : 0.5;
      const push = Math.min(overlap, 3);
      a.x -= nx * push * aShare;
      a.y -= ny * push * aShare;
      b.x += nx * push * (1 - aShare);
      b.y += ny * push * (1 - aShare);
    }
  }
}

// Shared wandering for offspring: drift slowly in a slowly-turning direction,
// easing out of any burst from splitting off.
function wanderer(group) {
  let heading = Math.random() * Math.PI * 2;
  return (seconds, dishRadius) => {
    heading += (Math.random() - 0.5) * 2 * seconds;
    const cruise = GAME.DRIFT_SPEED * dishRadius;
    const easing = Math.min(1, seconds * 1.5);
    group.vx += (Math.cos(heading) * cruise - group.vx) * easing;
    group.vy += (Math.sin(heading) * cruise - group.vy) * easing;
    group.x += group.vx * seconds;
    group.y += group.vy * seconds;
    if (Math.abs(group.vx) > 1) group.facing = Math.sign(group.vx);
  };
}

// Add a new group's mover to the dish, holding a copy of the buddy art.
function newMover(svg) {
  const mover = document.createElement('div');
  mover.className = 'buddy-mover drifter';
  svg.removeAttribute('role');
  svg.removeAttribute('aria-label');
  svg.setAttribute('aria-hidden', 'true');
  mover.appendChild(svg);
  document.querySelector('.agar').appendChild(mover);
  return mover;
}

// A rod-shaped cell (Mona, Vi). It gets longer as it grows, then splits
// across the middle; the two cells go their separate ways.
function rodGroup({ mover, svg, species, isPlayer }) {
  const ROD_WIDTH = 18; // percent of the dish, at generation 0
  const FULL_LENGTH = 1.8; // times its normal length right before dividing

  const group = {
    mover,
    svg,
    isPlayer,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    facing: 1,
    length: 1,
    cellCount: () => 1,
    halfWidth: () => svg.getBoundingClientRect().width / 2,
    reach: () => group.halfWidth(),
    update(seconds, scale, swell) {
      mover.style.width = `${ROD_WIDTH * scale}%`;
      const target = 1 + (FULL_LENGTH - 1) * swell;
      group.length += (target - group.length) * Math.min(1, seconds * 8);
    },
    place() {
      const widen = 1 + (group.length - 1) * 0.35; // mostly longer, a bit wider
      mover.style.transform =
        `translate(${group.x}px, ${group.y}px) scale(${group.length * group.facing}, ${widen})`;
    },
    mouths: () => [[group.x, group.y, group.halfWidth() * GAME.PICKUP_REACH]],
    // Split into two rods that push apart end to end.
    divide() {
      const copy = svg.cloneNode(true);
      const child = rodGroup({ mover: newMover(copy), svg: copy, species, isPlayer: false });
      child.x = group.x;
      child.y = group.y;
      child.facing = group.facing;
      child.length = group.length;
      const burst = GAME.BURST_SPEED * (document.querySelector('.agar').clientWidth / 2);
      child.vx = group.facing * burst;
      child.vy = (Math.random() - 0.5) * burst * 0.4;
      if (!isPlayer) group.vx = -child.vx;
      return child;
    },
    wander: null,
  };
  group.wander = wanderer(group);
  return group;
}

// A chain or cluster of round cells (Scarlett, Goldie). Every cell divides
// each generation, doubling the group; once it would pass GROUP_CAP cells it
// breaks in two and the half without the face drifts off on its own.
function coccusGroup({ mover, svg, species, isPlayer, cells: startCells }) {
  const CELL_SIZE = 8; // one cell's width, as a percent of the dish, at generation 0
  const R = 10; // cell radius in SVG units
  const SWELL = 0.22; // how much bigger cells get right before dividing
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  const { layout, colors } = species;

  // A fixed little wobble per cell so clusters look organic without jitter.
  const wobble = (k, salt) => Math.sin(k * 12.9898 + salt * 78.233) * 0.5;

  // Where each of `n` cells sits, centered on (0, 0).
  function spots(n) {
    const out = [];
    if (layout === 'cluster') {
      // Packed outward from the middle: a lumpy grape-like bunch.
      for (let k = 0; k < n; k++) {
        const distance = R * 1.12 * Math.sqrt(k);
        const angle = k * GOLDEN_ANGLE;
        out.push([
          distance * Math.cos(angle) + wobble(k, 1) * R * 0.35,
          distance * Math.sin(angle) + wobble(k, 2) * R * 0.35,
        ]);
      }
      return out;
    }
    // Chain: cells in a row along a gentle curve.
    for (let k = 0; k < n; k++) {
      const offset = (k - (n - 1) / 2) * R * 1.75;
      out.push([offset, 0.004 * offset * offset]);
    }
    const cy = out.reduce((sum, p) => sum + p[1], 0) / n;
    return out.map(([px, py]) => [px, py - cy]);
  }

  const group = {
    mover,
    svg,
    isPlayer,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    facing: 1,
    cells: startCells || [{ x: 0, y: 0, fromX: 0, fromY: 0, toX: 0, toY: 0, face: isPlayer }],
    swell: 0,
    scale: 1,
    moveFor: null, // ms into rearranging after a division, or null
    cellCount: () => group.cells.length,
  };

  // Half the drawing's width and height in SVG units, centered on (0, 0).
  function extent() {
    let mx = 0;
    let my = 0;
    const r = R * (1 + SWELL * group.swell);
    for (const c of group.cells) {
      mx = Math.max(mx, Math.abs(c.x) + r);
      my = Math.max(my, Math.abs(c.y) + r);
    }
    return [mx + 2, my + 2];
  }

  const pxPerUnit = () => mover.offsetWidth / (2 * extent()[0]);

  function cellMarkup(c) {
    const r = R * (1 + SWELL * group.swell);
    const k = r / R;
    let out =
      `<circle cx="${c.x}" cy="${c.y}" r="${r}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="${1.7 * k}" />` +
      `<circle cx="${c.x - 2.7 * k}" cy="${c.y - 3.2 * k}" r="${1.5 * k}" fill="${colors.highlight}" />`;
    if (c.face) {
      out +=
        `<g transform="translate(${c.x} ${c.y}) scale(${k})">` +
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
    mover.style.width = `${(mx / R) * CELL_SIZE * group.scale}%`;
    // Cells higher up sit behind lower ones; the face cell is always in front.
    const order = [...group.cells].sort(
      (a, b) => (a.face ? 1 : 0) - (b.face ? 1 : 0) || a.y - b.y,
    );
    svg.innerHTML = order.map(cellMarkup).join('');
  }

  // Move the cells to new spots. When the group doubles, each parent's two
  // daughters take the two spots nearest it, so cells split in place.
  function rearrange(targets, doubling) {
    const next = [];
    const used = new Array(group.cells.length).fill(0);
    const perParent = doubling ? 2 : 1;
    const order = targets
      .map((t, i) => i)
      .sort((a, b) => Math.hypot(...targets[a]) - Math.hypot(...targets[b]));
    for (const i of order) {
      const [tx, ty] = targets[i];
      let best = -1;
      for (let p = 0; p < group.cells.length; p++) {
        if (used[p] >= perParent) continue;
        const cell = group.cells[p];
        if (best === -1 ||
            Math.hypot(cell.x - tx, cell.y - ty) <
            Math.hypot(group.cells[best].x - tx, group.cells[best].y - ty)) best = p;
      }
      const parent = group.cells[best];
      next.push({
        x: parent.x, y: parent.y, fromX: parent.x, fromY: parent.y, toX: tx, toY: ty,
        face: parent.face && used[best] === 0, // the face stays with one daughter
      });
      used[best]++;
    }
    group.cells = next;
    group.moveFor = 0;
  }

  Object.assign(group, {
    reach() {
      let farthest = 0;
      const r = R * (1 + SWELL * group.swell);
      for (const c of group.cells) farthest = Math.max(farthest, Math.hypot(c.x, c.y) + r);
      return farthest * pxPerUnit();
    },
    update(seconds, scale, swell) {
      group.scale = scale;
      group.swell = swell;
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
      const unit = pxPerUnit();
      const r = R * (1 + SWELL * group.swell);
      return group.cells.map((c) => [
        group.x + c.x * unit * group.facing,
        group.y + c.y * unit,
        r * unit * 0.9,
      ]);
    },
    divide() {
      const n = group.cells.length;
      if (n * 2 <= GAME.GROUP_CAP) {
        rearrange(spots(n * 2), true);
        return null;
      }
      // Too big to hold together: each cell still divides, but the group
      // breaks in two. This group keeps one daughter of every cell (and the
      // face); the other daughters drift off as a new group.
      rearrange(spots(n), false);
      const copy = svg.cloneNode(false);
      const child = coccusGroup({
        mover: newMover(copy),
        svg: copy,
        species,
        isPlayer: false,
        cells: group.cells.map((c) => ({ ...c, face: false })),
      });
      child.x = group.x;
      child.y = group.y;
      child.scale = group.scale;
      const angle = Math.random() * Math.PI * 2;
      const burst = GAME.BURST_SPEED * (document.querySelector('.agar').clientWidth / 2);
      child.vx = Math.cos(angle) * burst;
      child.vy = Math.sin(angle) * burst;
      if (!isPlayer) {
        group.vx = -child.vx;
        group.vy = -child.vy;
      }
      return child;
    },
  });

  group.wander = wanderer(group);
  draw();
  return group;
}

// Nutrient flecks: scattered over the agar, picked up when the player's
// buddy swims over them, and replaced somewhere else a few seconds later.
function scatterNutrients() {
  const agar = document.querySelector('.agar');
  const COUNT = 14;
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
