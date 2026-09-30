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
  GROUP_CAP: 8, // chains and clusters break apart once they reach this many
  NUTRIENTS_PER_DIVISION: 1, // nutrients the player eats before dividing
  // Everything is drawn smaller as the population grows so a full dish fits:
  // each doubling of the population multiplies the size by this much.
  SHRINK: 0.86,
  ROD_SHRINK: 0.83, // rods take more room, so they shrink a bit faster
  BREAK_DELAY_MS: 350, // pause at full size before a chain or cluster breaks
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

  let scale = 1; // drawn size; eases toward the size for the current population
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

  // Binary fission for the player's buddy only: every cell in it divides.
  // A rod splits in two and one half swims off; a chain or cluster doubles in
  // place. Offspring that have already split off stay where they settled.
  function dividePlayer() {
    pending -= GAME.NUTRIENTS_PER_DIVISION;
    sinceDivision = 0;
    const offspring = player.divide();
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

    // Draw everything a little smaller as the population grows so it fits.
    const shrink = species.kind === 'rod' ? GAME.ROD_SHRINK : GAME.SHRINK;
    const targetScale = totalCells() ** Math.log2(shrink);
    scale += (targetScale - scale) * Math.min(1, seconds * 3);
    sinceDivision += seconds * 1000;

    for (const group of groups) {
      if (group !== player) group.coast(seconds);
      group.update(seconds, scale);
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
      const full = player.cellCount() >= GAME.GROUP_CAP;

      if (won && sinceDivision > GAME.DIVIDE_MS + 300) {
        finished = true;
        held.clear();
        nutrients.stop();
        setTimeout(showWin, 300);
      } else if (!won && full && player.breakApart &&
                 sinceDivision > GAME.DIVIDE_MS + GAME.BREAK_DELAY_MS) {
        // A full chain or cluster breaks apart; the player keeps one piece.
        groups.push(...player.breakApart());
      } else if (!won && !full && pending >= GAME.NUTRIENTS_PER_DIVISION &&
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
  const ROD_WIDTH = 18; // percent of the dish, before the colony grows

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
    update(seconds, scale) {
      mover.style.width = `${ROD_WIDTH * scale}%`;
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

// A chain or cluster of round cells (Scarlett, Goldie). Each division, every
// cell in the group divides, doubling it in place. Once it reaches GROUP_CAP
// cells it breaks apart: a chain snaps in half, and a cluster crumbles into
// small clumps. The player keeps the piece with the face; the rest slide off
// a little way and settle.
function coccusGroup({ mover, svg, species, isPlayer, cells: startCells }) {
  const CELL_SIZE = 8; // one cell's width, as a percent of the dish, at the start
  const R = 10; // cell radius in SVG units
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
    scale: 1,
    moveFor: null, // ms into rearranging after a division, or null
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

  // A chain breaks somewhere along its length; here, right in the middle.
  function snapInHalf(cells) {
    const inOrder = [...cells].sort((a, b) => a.x - b.x);
    const half = Math.floor(inOrder.length / 2);
    return [inOrder.slice(0, half), inOrder.slice(half)];
  }

  // A cluster crumbles into clumps of 2 to 4 neighboring cells.
  function crumble(cells) {
    const sizes = [];
    let left = cells.length;
    while (left > 0) {
      if (left <= 4) {
        sizes.push(left);
        break;
      }
      let size = 2 + Math.floor(Math.random() * 3);
      if (left - size < 2) size = left - 2; // never leave a lone cell behind
      sizes.push(size);
      left -= size;
    }
    // Take neighboring cells together by going around the cluster's middle.
    const cx = cells.reduce((sum, c) => sum + c.x, 0) / cells.length;
    const cy = cells.reduce((sum, c) => sum + c.y, 0) / cells.length;
    const around = [...cells].sort(
      (a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx),
    );
    const pieces = [];
    let taken = 0;
    for (const size of sizes) {
      pieces.push(around.slice(taken, taken + size));
      taken += size;
    }
    return pieces;
  }

  Object.assign(group, {
    reach() {
      let farthest = 0;
      for (const c of group.cells) farthest = Math.max(farthest, Math.hypot(c.x, c.y) + R);
      return farthest * pxPerUnit();
    },
    update(seconds, scale) {
      group.scale = scale;
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
      return group.cells.map((c) => [
        group.x + c.x * unit * group.facing,
        group.y + c.y * unit,
        R * unit * 0.9,
      ]);
    },
    divide() {
      rearrange(spots(group.cells.length * 2), true);
      return null;
    },
    // Break a full group into pieces. This group becomes the piece with the
    // face; every other piece is returned as a new group of offspring.
    breakApart() {
      const pieces = layout === 'chain' ? snapInHalf(group.cells) : crumble(group.cells);
      const unit = pxPerUnit();
      const agarRadius = document.querySelector('.agar').clientWidth / 2;
      const center = (piece) => [
        piece.reduce((sum, c) => sum + c.x, 0) / piece.length,
        piece.reduce((sum, c) => sum + c.y, 0) / piece.length,
      ];
      // Where a piece's middle is in the dish, and its cells relative to it.
      const place = (piece) => {
        const [cx, cy] = center(piece);
        return {
          x: group.x + cx * unit * group.facing,
          y: group.y + cy * unit,
          cells: piece.map((c) => ({ ...c, x: c.x - cx, y: c.y - cy })),
        };
      };

      const kept = pieces.find((piece) => piece.some((c) => c.face)) || pieces[0];
      const home = place(kept);
      const offspring = [];
      for (const piece of pieces) {
        if (piece === kept) continue;
        const spot = place(piece);
        const copy = svg.cloneNode(false);
        const child = coccusGroup({
          mover: newMover(copy),
          svg: copy,
          species,
          isPlayer: false,
          cells: spot.cells.map((c) => ({ ...c, face: false })),
        });
        child.x = spot.x;
        child.y = spot.y;
        child.facing = group.facing;
        child.scale = group.scale;
        // Push away from the piece the player keeps.
        const dx = spot.x - home.x;
        const dy = spot.y - home.y;
        const distance = Math.hypot(dx, dy) || 1;
        const burst = GAME.BURST_SPEED * agarRadius * 0.6;
        child.vx = (dx / distance) * burst;
        child.vy = (dy / distance) * burst;
        child.settle();
        offspring.push(child);
      }
      group.x = home.x;
      group.y = home.y;
      group.cells = home.cells;
      group.settle();
      return offspring;
    },
    // Slide the cells into the neat layout for however many there are.
    settle() {
      rearrange(spots(group.cells.length), false);
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
