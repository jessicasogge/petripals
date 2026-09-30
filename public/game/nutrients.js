// Nutrient flecks: scattered over the agar, picked up when the player's
// pal swims over them, and replaced somewhere else a few seconds later.
// `avoid` lists areas to keep clear, like the antibiotic disks, each as
// { fx, fy, r } in fractions of the dish radius.
export function scatterNutrients({ avoid = [] } = {}) {
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
      const clearOfPal = Math.hypot(fx - avoidX, fy - avoidY) > 0.3;
      const clearOfOthers = flecks.every((f) => Math.hypot(fx - f.fx, fy - f.fy) > MIN_GAP);
      const clearOfHazards = avoid.every((a) => Math.hypot(fx - a.fx, fy - a.fy) > a.r + MIN_GAP);
      if (clearOfPal && clearOfOthers && clearOfHazards) return { fx, fy };
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

  // Pals start in the middle, so the first batch avoids the center.
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
