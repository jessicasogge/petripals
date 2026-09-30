// Add a new group's mover to the dish, holding a copy of the buddy art.
export function newMover(svg) {
  const mover = document.createElement('div');
  mover.className = 'buddy-mover offspring';
  svg.removeAttribute('role');
  svg.removeAttribute('aria-label');
  svg.setAttribute('aria-hidden', 'true');
  mover.appendChild(svg);
  document.querySelector('.agar').appendChild(mover);
  return mover;
}
