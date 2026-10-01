// Add a new group's mover to the dish, holding a copy of the pal art.
export function newMover(svg) {
  const mover = document.createElement('div');
  mover.className = 'pal-mover offspring';
  svg.removeAttribute('role');
  svg.removeAttribute('aria-label');
  svg.setAttribute('aria-hidden', 'true');
  mover.appendChild(svg);
  document.querySelector('.agar').appendChild(mover);
  return mover;
}

// The player's pal has an idle animation (bob, wobble, squish or slither)
// that moves its drawing around a little. This returns a function that moves
// a circle [x, y, r], in px from the mover's center (before it's flipped to
// face left), to where the animation has the drawing right now, so touches
// match what's on screen.
export function idlePose(svg) {
  const style = getComputedStyle(svg);
  if (!style.transform || style.transform === 'none' || typeof DOMMatrixReadOnly === 'undefined') {
    return (x, y, r) => [x, y, r];
  }
  const m = new DOMMatrixReadOnly(style.transform);
  const box = svg.parentElement;
  const [ox, oy] = style.transformOrigin.split(' ').map(parseFloat);
  // The animation's pivot, relative to the drawing's center.
  const px = ox - box.offsetWidth / 2;
  const py = oy - box.offsetHeight / 2;
  // A squish stretches one way more than the other; use the bigger stretch.
  const scale = Math.max(Math.hypot(m.a, m.b), Math.hypot(m.c, m.d));
  return (x, y, r) => {
    const dx = x - px;
    const dy = y - py;
    return [px + m.a * dx + m.c * dy + m.e, py + m.b * dx + m.d * dy + m.f, r * scale];
  };
}
