// A home-page easter egg: tap (or click) a pal and she divides in two, the
// way bacteria do (binary fission). She stretches, pinches apart into two
// smaller daughters that drift away from each other, then they come back
// together and she's one pal again.
//
// It happens inside her drawing, so her idle bob or wiggle on the <svg> keeps
// going: her whole drawing goes in a <g>, and a copy of that <g> is the second
// daughter.

const SVG = 'http://www.w3.org/2000/svg';
export const SPLIT_MS = 1600;
// How small each daughter is while split, and how far she drifts from the
// middle as a share of the pal's width: just enough that the two don't
// overlap (a long pal like Elia drifts further than a round one like Coco).
const SHRINK = 0.62;
const DRIFT = 0.34;
// Her width in the drawing's units (200 across) if it can't be measured.
const DEFAULT_WIDTH = 140;

// Keyframes for one daughter; `side` is -1 (left) or 1 (right), and `width`
// is the pal's width in her drawing's units.
export function splitKeyframes(side, width = DEFAULT_WIDTH) {
  const apart = `translate(${(side * DRIFT * width).toFixed(1)}px, 0) scale(${SHRINK})`;
  return [
    { transform: 'translate(0, 0) scale(1)', offset: 0 },
    // Stretch out, like a cell getting ready to divide...
    { transform: 'translate(0, 0) scale(1.12, 0.92)', offset: 0.2 },
    // ...pinch apart into two...
    { transform: apart, offset: 0.42 },
    // ...stay split for a moment...
    { transform: apart, offset: 0.7 },
    // ...and come back together.
    { transform: 'translate(0, 0) scale(1)', offset: 1 },
  ];
}

// Split `svg` (a pal's drawing) now, unless she's already mid-split.
// Returns true if she split.
export function split(svg) {
  if (svg.dataset.splitting || typeof svg.animate !== 'function') return false;
  svg.dataset.splitting = 'true';

  // Her whole drawing, in one group that can move.
  let cell = svg.querySelector(':scope > g.cell');
  if (!cell) {
    cell = document.createElementNS(SVG, 'g');
    cell.setAttribute('class', 'cell');
    cell.append(...svg.childNodes);
    svg.append(cell);
  }
  const daughter = cell.cloneNode(true);
  daughter.setAttribute('class', 'cell daughter');
  svg.append(daughter);

  const width = measure(cell);
  const timing = { duration: SPLIT_MS, easing: 'ease-in-out' };
  cell.animate(splitKeyframes(-1, width), timing);
  const drift = daughter.animate(splitKeyframes(1, width), timing);
  const done = () => {
    daughter.remove();
    delete svg.dataset.splitting;
  };
  drift.onfinish = done;
  drift.oncancel = done;
  return true;
}

// How wide her drawing is, in its own units.
function measure(cell) {
  try {
    return cell.getBBox().width || DEFAULT_WIDTH;
  } catch {
    return DEFAULT_WIDTH; // e.g. not on screen yet
  }
}

// Make every pal in `row` split when tapped. Skipped for people who've asked
// their device for less motion.
export function splitOnTap(row, win = window) {
  if (!row || win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
  row.classList.add('splittable');
  row.addEventListener('click', (event) => {
    const svg = event.target.closest?.('svg.pal');
    if (svg && row.contains(svg)) split(svg);
  });
}
