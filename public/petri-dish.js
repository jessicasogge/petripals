const params = new URLSearchParams(window.location.search);
const choice = params.get('buddy');
const buddy = document.querySelector(`.dish-buddy[data-buddy="${choice}"]`);

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

  // How close a nutrient has to be to get picked up, as a fraction of the
  // buddy's half-width (less than 1 so it has to swim over it, not just near).
  const PICKUP_REACH = 0.6;

  // Growth: each nutrient adds a bit of size; at FULL_SIZE the buddy divides.
  const NUTRIENTS_TO_DIVIDE = 8;
  const FULL_SIZE = 1.8; // times the starting size
  const GROWTH_PER_NUTRIENT = (FULL_SIZE - 1) / NUTRIENTS_TO_DIVIDE;

  // Rods (Mona, Vi) mostly get longer before they divide; round cocci
  // (Goldie) grow evenly in every direction.
  const isRod = buddyEl.dataset.buddy !== 'goldie';

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
  let eaten = 0;
  let size = 1; // what's drawn right now; eases toward targetSize
  let targetSize = 1;
  let dividing = false;
  let lastTime = null;

  window.addEventListener('keydown', (event) => {
    if (!(event.key in directions)) return;
    event.preventDefault(); // stop arrow keys from scrolling the page
    if (!dividing) held.add(event.key);
  });

  window.addEventListener('keyup', (event) => {
    held.delete(event.key);
  });

  // Don't keep moving if the window loses focus while a key is down.
  window.addEventListener('blur', () => held.clear());

  document.querySelector('.play-again').addEventListener('click', () => {
    window.location.reload();
  });

  // Width and height scale for a given size.
  function stretch(s) {
    return isRod ? [s, 1 + (s - 1) * 0.35] : [s, s];
  }

  function place(el, px, py, s, face) {
    const [sx, sy] = stretch(s);
    el.style.transform = `translate(${px}px, ${py}px) scale(${sx * face}, ${sy})`;
  }

  // Keep a buddy of half-width `radius` fully inside the dish, sliding along
  // the rim instead of leaving it.
  function keepInDish(px, py, radius) {
    const maxDistance = Math.max(0, agar.clientWidth / 2 - radius);
    const fromCenter = Math.hypot(px, py);
    if (fromCenter <= maxDistance) return [px, py];
    return [(px / fromCenter) * maxDistance, (py / fromCenter) * maxDistance];
  }

  function step(time) {
    if (dividing) return;
    const seconds = lastTime === null ? 0 : (time - lastTime) / 1000;
    lastTime = time;

    let dx = 0;
    let dy = 0;
    for (const key of held) {
      dx += directions[key][0];
      dy += directions[key][1];
    }

    const dishRadius = agar.clientWidth / 2;

    if (dx !== 0 || dy !== 0) {
      // Same speed on diagonals as straight lines.
      const length = Math.hypot(dx, dy);
      const distance = SPEED * dishRadius * seconds;
      x += (dx / length) * distance;
      y += (dy / length) * distance;
      if (dx !== 0) facing = Math.sign(dx);
    }

    // Grow smoothly toward the target size instead of jumping.
    size += (targetSize - size) * Math.min(1, seconds * 6);

    place(mover, x, y, size, facing);
    const buddyRadius = buddyEl.getBoundingClientRect().width / 2;
    [x, y] = keepInDish(x, y, buddyRadius);
    place(mover, x, y, size, facing);

    const ate = nutrients.eatNear(
      x / dishRadius,
      y / dishRadius,
      (buddyRadius * PICKUP_REACH) / dishRadius,
    );
    if (ate > 0) {
      eaten += ate;
      targetSize = Math.min(FULL_SIZE, 1 + eaten * GROWTH_PER_NUTRIENT);
    }

    // Divide once the buddy has eaten enough and finished growing into it.
    if (eaten >= NUTRIENTS_TO_DIVIDE && FULL_SIZE - size < 0.01) {
      divide();
      return;
    }

    requestAnimationFrame(step);
  }

  // Binary fission: the grown buddy splits into two normal-sized daughter
  // cells that drift apart, then the player wins.
  function divide() {
    dividing = true;
    held.clear();
    nutrients.stop();

    const daughter = mover.cloneNode(true);
    daughter.querySelector('.dish-buddy:not([hidden])').setAttribute('aria-hidden', 'true');
    mover.after(daughter);

    const startWidth = buddyEl.getBoundingClientRect().width;
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

      const [ax, ay] = keepInDish(x - offset, y, daughterWidth / 2);
      const [bx, by] = keepInDish(x + offset, y, daughterWidth / 2);
      place(mover, ax, ay, s, facing);
      place(daughter, bx, by, s, facing);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(showWin, 400);
      }
    }

    requestAnimationFrame(animate);
  }

  function showWin() {
    const banner = document.querySelector('.win-banner');
    banner.querySelector('.win-name').textContent = buddyEl.dataset.name;
    banner.removeAttribute('hidden');
    banner.querySelector('.play-again').focus();
  }

  requestAnimationFrame(step);
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
    // Pick up every fleck within `reach` of the buddy's position (all values
    // are fractions of the dish radius). Returns how many were picked up.
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
