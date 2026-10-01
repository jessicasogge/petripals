import { touchesDisk } from './antibiotic.js';
import { chainSpot, clusterSpot, R } from './attach.js';
import { GAME } from './config.js';
import { newMover } from './mover.js';
import { coaster } from './physics.js';

// A round cell (Scarlett, Goldie). The player is always a single coccus.
// Offspring are chains or clusters of cocci that grow one cell at a time as
// daughters join them (the player's, or their own cells' when they eat), up to GROUP_CAP cells. A chain grows from
// whichever end is nearer the player; a cluster grows on the side facing the
// player. So Scarlett builds chains along the lines she swims, and Goldie
// builds bunches wherever she lingers.
export function coccusGroup({ mover, svg, species, isPlayer }) {
  const CELL_SIZE = 5; // one cell's width, as a percent of the dish
  const { layout, colors } = species;

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
    // Every cell's circle, used to tell whether the group touches the disk.
    body() {
      return group.cells.map((c) => {
        const [wx, wy] = toWorld(c.x, c.y);
        return [wx, wy, R * pxPerUnit()];
      });
    },
    // Where a new cell would join this group if it came from (wx, wy) in the
    // dish, or null if the group is full or every open spot is on a disk.
    attachSpot(wx, wy, disks = [], dishRadius = 0) {
      if (group.cells.length >= GAME.GROUP_CAP) return null;
      const [px, py] = toLocal(wx, wy);
      // Spots on or right next to an antibiotic disk are off-limits.
      const cellRadius = R * pxPerUnit();
      const allowed = (x, y) => {
        const [sx, sy] = toWorld(x, y);
        return !disks.some((disk) =>
          touchesDisk(disk, [[sx, sy, cellRadius]], dishRadius, GAME.DISK_BUFFER));
      };
      const spot = layout === 'chain'
        ? chainSpot(group.cells, px, py, allowed)
        : clusterSpot(group.cells, group.twist, px, py, allowed);
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
    // A cell divides: the daughter joins the nearest chain or cluster that
    // has room and is close enough (and not onto an antibiotic disk), or else
    // starts a new one. `from` is where the dividing cell is in the dish: the
    // player's spot, or the cell in an offspring group that ate a nutrient.
    // Returns the new group, or null if the daughter joined one.
    divide(others, dishRadius, disks = [], from = [group.x, group.y]) {
      const [fx, fy] = from;
      let best = null;
      for (const other of others) {
        const spot = other.attachSpot?.(fx, fy, disks, dishRadius);
        if (!spot) continue;
        const distance = Math.hypot(spot.world[0] - fx, spot.world[1] - fy);
        if (distance > GAME.SNAP_REACH * dishRadius) continue;
        if (!best || distance < best.distance) best = { other, spot, distance };
      }
      if (best) {
        best.other.addCell(best.spot, fx, fy);
        return null;
      }
      const copy = svg.cloneNode(false);
      const child = coccusGroup({ mover: newMover(copy), svg: copy, species, isPlayer: false });
      child.x = fx;
      child.y = fy;
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
