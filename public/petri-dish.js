const params = new URLSearchParams(window.location.search);
const choice = params.get('buddy');
const buddy = document.querySelector(`.dish-buddy[data-buddy="${choice}"]`);

// How each buddy grows. Rods are a single cell that gets longer and then
// splits in two. Cocci are round cells that each divide; the daughters stay
// stuck together, building a chain (Streptococcus divides in one plane) or a
// grape-like cluster (Staphylococcus divides in several planes).
const GROWTH_STYLE = {
  mona: 'rod',
  vi: 'rod',
  scarlett: 'chain',
  goldie: 'cluster',
};

// Cell colors for the cocci, which are drawn by this script as they divide.
const COCCUS_COLORS = {
  scarlett: { fill: '#fca5a5', stroke: '#b91c1c', highlight: '#fee2e2', dark: '#7f1d1d' },
  goldie: { fill: '#fde68a', stroke: '#b45309', highlight: '#fef3c7', dark: '#78350f' },
};

if (buddy) {
  buddy.removeAttribute('hidden');
  document.title = `PetriPals | ${buddy.dataset.name}`;
  const nutrients = scatterNutrients();
  playGame(buddy, nutrients);
} else {
  // No buddy (or an unknown one) in the URL: send them back to choose.
  window.location.replace('./buddy-picker.html');
}

function playGame(buddyEl, nutrients) {
  const agar = document.querySelector('.agar');
  const mover = document.querySelector('.buddy-mover');

  // How far the buddy travels per second, as a fraction of the dish radius.
  const SPEED = 0.8;

  const style = GROWTH_STYLE[buddyEl.dataset.buddy];
  const body =
    style === 'rod'
      ? rodBody(buddyEl, mover)
      : coccusBody(buddyEl, mover, style, COCCUS_COLORS[buddyEl.dataset.buddy]);

  const directions = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
  };
  const held = new Set();

  // Position is the buddy's offset from the center of the dish, in pixels.
  let x = 0;
  let y = 0;
  let facing = 1; // 1 = right, -1 = left
  let finished = false;
  let lastTime = null;

  window.addEventListener('keydown', (event) => {
    if (!(event.key in directions)) return;
    event.preventDefault(); // stop arrow keys from scrolling the page
    if (!finished) held.add(event.key);
  });

  window.addEventListener('keyup', (event) => {
    held.delete(event.key);
  });

  // Don't keep moving if the window loses focus while a key is down.
  window.addEventListener('blur', () => held.clear());

  document.querySelector('.play-again').addEventListener('click', () => {
    window.location.reload();
  });

  function step(time) {
    const seconds = lastTime === null ? 0 : (time - lastTime) / 1000;
    lastTime = time;
    const dishRadius = agar.clientWidth / 2;

    if (!finished) {
      let dx = 0;
      let dy = 0;
      for (const key of held) {
        dx += directions[key][0];
        dy += directions[key][1];
      }
      if (dx !== 0 || dy !== 0) {
        // Same speed on diagonals as straight lines.
        const length = Math.hypot(dx, dy);
        const distance = SPEED * dishRadius * seconds;
        x += (dx / length) * distance;
        y += (dy / length) * distance;
        if (dx !== 0) facing = Math.sign(dx);
      }
    }

    body.update(seconds);
    [x, y] = keepInDish(agar, x, y, body.reachOfDish());
    body.place(x, y, facing);

    if (!finished) {
      let ate = 0;
      // Each spot on the buddy that can pick up nutrients, in pixels from the
      // dish center, with how close a fleck has to be.
      for (const [px, py, reach] of body.mouths(x, y, facing)) {
        ate += nutrients.eatNear(px / dishRadius, py / dishRadius, reach / dishRadius);
      }
      if (ate > 0) body.feed(ate);

      if (body.isReadyToWin()) {
        finished = true;
        held.clear();
        nutrients.stop();
        body.finish(x, y, facing, () => setTimeout(showWin, 400));
      }
    }

    requestAnimationFrame(step);
  }

  function showWin() {
    const banner = document.querySelector('.win-banner');
    banner.querySelector('.win-message').textContent = body.winMessage(buddyEl.dataset.name);
    banner.removeAttribute('hidden');
    banner.querySelector('.play-again').focus();
  }

  requestAnimationFrame(step);
}

// Keep something whose farthest edge is `radius` px from its center fully
// inside the dish, sliding along the rim instead of leaving it.
function keepInDish(agar, px, py, radius) {
  const maxDistance = Math.max(0, agar.clientWidth / 2 - radius);
  const fromCenter = Math.hypot(px, py);
  if (fromCenter <= maxDistance) return [px, py];
  return [(px / fromCenter) * maxDistance, (py / fromCenter) * maxDistance];
}

// A rod-shaped cell (Mona, Vi): each nutrient makes it longer, and once it
// has doubled up it splits across the middle into two daughter cells.
function rodBody(buddyEl, mover) {
  const agar = document.querySelector('.agar');
  const NUTRIENTS_TO_DIVIDE = 11;
  const FULL_SIZE = 1.8; // times the starting size
  const GROWTH_PER_NUTRIENT = (FULL_SIZE - 1) / NUTRIENTS_TO_DIVIDE;
  // How close a nutrient has to be, as a fraction of the rod's half-length
  // (less than 1 so it has to swim over it, not just near).
  const PICKUP_REACH = 0.6;

  let eaten = 0;
  let size = 1; // what's drawn right now; eases toward targetSize
  let targetSize = 1;
  let splitting = false;

  // Rods mostly get longer, and only a little wider, as they grow.
  function transform(px, py, s, face) {
    const sy = 1 + (s - 1) * 0.35;
    return `translate(${px}px, ${py}px) scale(${s * face}, ${sy})`;
  }

  const halfWidth = () => buddyEl.getBoundingClientRect().width / 2;

  return {
    update(seconds) {
      if (!splitting) size += (targetSize - size) * Math.min(1, seconds * 6);
    },
    reachOfDish: () => (splitting ? 0 : halfWidth()),
    place(px, py, face) {
      if (!splitting) mover.style.transform = transform(px, py, size, face);
    },
    mouths: (px, py) => [[px, py, halfWidth() * PICKUP_REACH]],
    feed(count) {
      eaten += count;
      targetSize = Math.min(FULL_SIZE, 1 + eaten * GROWTH_PER_NUTRIENT);
    },
    isReadyToWin: () => eaten >= NUTRIENTS_TO_DIVIDE && FULL_SIZE - size < 0.01,

    // Binary fission: the grown rod splits into two normal-sized daughters
    // that slide apart end to end.
    finish(px, py, face, done) {
      splitting = true;
      const daughter = mover.cloneNode(true);
      daughter.querySelector('.dish-buddy:not([hidden])').setAttribute('aria-hidden', 'true');
      mover.after(daughter);

      const startWidth = halfWidth() * 2;
      const daughterWidth = startWidth / FULL_SIZE;
      const spread = daughterWidth * 0.6;
      const DURATION = 900;
      let start = null;

      function animate(time) {
        if (start === null) start = time;
        const t = Math.min(1, (time - start) / DURATION);
        const ease = 1 - (1 - t) ** 3;
        const s = FULL_SIZE + (1 - FULL_SIZE) * ease;
        // Each half starts where it sat inside the parent and slides outward.
        const offset = (startWidth / 4) * (1 - ease) + spread * ease;
        const [ax, ay] = keepInDish(agar, px - offset, py, daughterWidth / 2);
        const [bx, by] = keepInDish(agar, px + offset, py, daughterWidth / 2);
        mover.style.transform = transform(ax, ay, s, face);
        daughter.style.transform = transform(bx, by, s, face);
        if (t < 1) requestAnimationFrame(animate);
        else done();
      }
      requestAnimationFrame(animate);
    },
    winMessage: (name) => `${name} ate enough nutrients to divide into two.`,
  };
}

// Round cells (Scarlett, Goldie): the buddy starts as one coccus. Nutrients
// make the next cell to divide swell up; it then splits, and the new cell
// stays attached. Build the full chain or cluster to win.
function coccusBody(svg, mover, layout, colors) {
  const TARGET_CELLS = 8;
  const NUTRIENTS_PER_DIVISION = 2;
  const CELL_SIZE = 8; // one cell's width, as a percent of the dish
  const SWELL = 0.22; // how much bigger a cell gets right before dividing
  const DIVIDE_MS = 450;

  // Cell geometry in SVG units: radius 10, neighbors about 1.7 radii apart.
  const R = 10;
  const SPACING = 17;

  // Where the n-th new cell goes (n = 1 for the first division), relative to
  // the original cell with the face at (0, 0).
  function spotFor(n) {
    if (layout === 'chain') {
      // Streptococcus: add to alternating ends so the chain grows both ways,
      // with a gentle curve.
      const index = Math.ceil(n / 2) * (n % 2 ? 1 : -1);
      const cx = index * SPACING;
      return [cx, 0.0022 * cx * cx];
    }
    // Staphylococcus: pile up into an irregular grape-like bunch.
    const CLUSTER = [
      [16, -3], [5, -16], [-11, -12], [21, -18], [-17, 3], [-4, -29], [13, 13],
    ];
    return CLUSTER[(n - 1) % CLUSTER.length];
  }

  // Each cell: current position and scale, plus where it's heading.
  const cells = [{ x: 0, y: 0, s: 1, targetS: 1, face: true }];
  let pending = 0; // nutrients eaten toward the next division
  let divisions = []; // cells currently sliding out of their parent
  let finished = false;

  // The cell that will divide next is the existing cell nearest the next spot.
  function nextParent() {
    const [nx, ny] = spotFor(cells.length);
    let best = cells[0];
    for (const cell of cells) {
      if (Math.hypot(cell.x - nx, cell.y - ny) < Math.hypot(best.x - nx, best.y - ny)) best = cell;
    }
    return best;
  }

  function divide() {
    const parent = nextParent();
    const [tx, ty] = spotFor(cells.length);
    const child = { x: parent.x, y: parent.y, s: parent.s * 0.8, targetS: 1 };
    cells.push(child);
    parent.targetS = 1;
    divisions.push({ child, fromX: parent.x, fromY: parent.y, tx, ty, elapsed: 0 });
  }

  // Half the drawing's width and height in SVG units, centered on the face
  // cell so the buddy doesn't jump around as it grows.
  function extent() {
    let mx = 0;
    let my = 0;
    for (const c of cells) {
      mx = Math.max(mx, Math.abs(c.x) + R * c.s);
      my = Math.max(my, Math.abs(c.y) + R * c.s);
    }
    return [mx + 2, my + 2];
  }

  const pxPerUnit = () => mover.offsetWidth / (2 * extent()[0]);

  function cellMarkup(c) {
    const r = R * c.s;
    let out =
      `<circle cx="${c.x}" cy="${c.y}" r="${r}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1.7" />` +
      `<circle cx="${c.x - 2.7 * c.s}" cy="${c.y - 3.2 * c.s}" r="${1.5 * c.s}" fill="${colors.highlight}" />`;
    if (c.face) {
      out +=
        `<g transform="translate(${c.x} ${c.y}) scale(${c.s})">` +
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
    // Cells higher up sit behind lower ones; the face cell is always in front.
    const order = [...cells].sort((a, b) => (a.face ? 1 : 0) - (b.face ? 1 : 0) || a.y - b.y);
    svg.innerHTML = order.map(cellMarkup).join('');
  }

  draw();

  return {
    update(seconds) {
      for (const c of cells) c.s += (c.targetS - c.s) * Math.min(1, seconds * 8);
      divisions = divisions.filter((d) => {
        d.elapsed += seconds * 1000;
        const t = Math.min(1, d.elapsed / DIVIDE_MS);
        const ease = 1 - (1 - t) ** 3;
        d.child.x = d.fromX + (d.tx - d.fromX) * ease;
        d.child.y = d.fromY + (d.ty - d.fromY) * ease;
        return t < 1;
      });
      draw();
    },
    reachOfDish() {
      let farthest = 0;
      for (const c of cells) farthest = Math.max(farthest, Math.hypot(c.x, c.y) + R * c.s);
      return farthest * pxPerUnit();
    },
    place(px, py, face) {
      mover.style.transform = `translate(${px}px, ${py}px) scaleX(${face})`;
    },
    // Every cell can pick up nutrients it swims over.
    mouths(px, py, face) {
      const unit = pxPerUnit();
      return cells.map((c) => [px + c.x * unit * face, py + c.y * unit, R * c.s * unit * 0.9]);
    },
    feed(count) {
      if (finished) return;
      pending += count;
      while (pending >= NUTRIENTS_PER_DIVISION && cells.length < TARGET_CELLS) {
        pending -= NUTRIENTS_PER_DIVISION;
        divide();
      }
      // The next cell to divide swells as it takes in nutrients.
      if (cells.length < TARGET_CELLS) {
        for (const c of cells) c.targetS = 1;
        nextParent().targetS = 1 + SWELL * (pending / NUTRIENTS_PER_DIVISION);
      }
    },
    isReadyToWin: () => cells.length >= TARGET_CELLS && divisions.length === 0,
    finish(px, py, face, done) {
      finished = true;
      done();
    },
    winMessage: (name) =>
      `${name} grew into a ${layout} of ${TARGET_CELLS} cells!`,
  };
}

// Nutrient flecks: scattered over the agar, picked up when a buddy swims over
// them, and replaced somewhere else a few seconds later.
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
