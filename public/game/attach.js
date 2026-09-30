// Where a new coccus attaches to a chain or cluster. Plain math on cell
// positions (in SVG units, relative to the group's origin), with no page
// access, so it can be tested on its own.

export const R = 10; // cell radius in SVG units
export const SPACING = R * 1.75; // center to center, for cells that touch

// A fixed pseudo-random value from -1 to 1, so shapes vary without jitter.
export const wobble = (k, salt) => Math.sin(k * 12.9898 + salt * 78.233);

// Where a new cell would attach to a chain: past whichever end is nearer
// (px, py), continuing the chain's direction with a gentle bend. `cells` are
// in chain order.
export function chainSpot(cells, px, py) {
  if (cells.length === 1) {
    let dx = px - cells[0].x;
    let dy = py - cells[0].y;
    // If the player is exactly on the cell there's no direction toward them;
    // grow sideways instead of stacking the new cell on top of the old one.
    if (dx === 0 && dy === 0) dx = 1;
    const d = Math.hypot(dx, dy);
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
// cells so the cluster fills out into a bunch instead of a line. `twist` is
// the cluster's own packing angle.
export function clusterSpot(cells, twist, px, py) {
  let best = null;
  cells.forEach((c, i) => {
    for (let k = 0; k < 6; k++) {
      const angle = twist + (k * Math.PI) / 3 + wobble(k, i) * 0.3;
      const x = c.x + Math.cos(angle) * SPACING * 0.95;
      const y = c.y + Math.sin(angle) * SPACING * 0.95;
      if (cells.some((o) => Math.hypot(o.x - x, o.y - y) < R * 1.5)) continue;
      const touching = cells.filter((o) => Math.hypot(o.x - x, o.y - y) < SPACING * 1.15).length;
      const distance = Math.hypot(x - px, y - py);
      const score = distance - touching * SPACING * 1.5;
      if (!best || score < best.score) best = { x, y, atStart: false, distance, score };
    }
  });
  return best;
}
