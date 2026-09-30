const params = new URLSearchParams(window.location.search);
const choice = params.get('buddy');
const buddy = document.querySelector(`.dish-buddy[data-buddy="${choice}"]`);

if (buddy) {
  buddy.removeAttribute('hidden');
  document.title = `PetriPals | ${buddy.dataset.name}`;
  const nutrients = scatterNutrients();
  setUpMovement(buddy, nutrients);
} else {
  // No buddy (or an unknown one) in the URL: send them back to choose.
  window.location.replace('./buddy-picker.html');
}

function setUpMovement(buddyEl, nutrients) {
  const agar = document.querySelector('.agar');
  const mover = document.querySelector('.buddy-mover');

  // How far the buddy travels per second, as a fraction of the dish radius.
  const SPEED = 0.8;

  // How close a nutrient has to be to get picked up, as a fraction of the
  // buddy's half-width (less than 1 so it has to swim over it, not just near).
  const PICKUP_REACH = 0.6;

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
  let lastTime = null;

  window.addEventListener('keydown', (event) => {
    if (!(event.key in directions)) return;
    event.preventDefault(); // stop arrow keys from scrolling the page
    held.add(event.key);
  });

  window.addEventListener('keyup', (event) => {
    held.delete(event.key);
  });

  // Don't keep moving if the window loses focus while a key is down.
  window.addEventListener('blur', () => held.clear());

  function step(time) {
    const seconds = lastTime === null ? 0 : (time - lastTime) / 1000;
    lastTime = time;

    let dx = 0;
    let dy = 0;
    for (const key of held) {
      dx += directions[key][0];
      dy += directions[key][1];
    }

    // Keep the buddy fully inside the dish: its center can go as far as the
    // dish radius minus the buddy's own radius.
    const dishRadius = agar.clientWidth / 2;
    const buddyRadius = buddyEl.getBoundingClientRect().width / 2;
    const maxDistance = Math.max(0, dishRadius - buddyRadius);

    if (dx !== 0 || dy !== 0) {
      // Same speed on diagonals as straight lines.
      const length = Math.hypot(dx, dy);
      const distance = SPEED * dishRadius * seconds;
      x += (dx / length) * distance;
      y += (dy / length) * distance;
      if (dx !== 0) facing = Math.sign(dx);
    }

    // Slide along the rim instead of leaving the dish.
    const fromCenter = Math.hypot(x, y);
    if (fromCenter > maxDistance) {
      x = (x / fromCenter) * maxDistance;
      y = (y / fromCenter) * maxDistance;
    }

    mover.style.transform = `translate(${x}px, ${y}px) scaleX(${facing})`;
    nutrients.eatNear(x / dishRadius, y / dishRadius, (buddyRadius * PICKUP_REACH) / dishRadius);
    requestAnimationFrame(step);
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
    // are fractions of the dish radius).
    eatNear(bx, by, reach) {
      for (let i = flecks.length - 1; i >= 0; i--) {
        const fleck = flecks[i];
        if (Math.hypot(fleck.fx - bx, fleck.fy - by) > reach) continue;
        flecks.splice(i, 1);
        fleck.el.classList.add('eaten');
        fleck.el.addEventListener('transitionend', () => fleck.el.remove(), { once: true });
        setTimeout(() => addFleck(bx, by), RESPAWN_MS);
      }
    },
    count: () => flecks.length,
  };
}
