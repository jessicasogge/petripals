// Touch steering, for phones and tablets: touch and hold anywhere on the dish
// and the pal swims toward your finger at her normal speed, stopping when she
// gets there. Let go and she stops. It works with a mouse too (press and hold).
//
// Also keeps the how-to-play directions right for the device: touch wording
// on a touch screen, arrow-key wording on a computer, switching if someone
// with both (a touchscreen laptop, an iPad with a keyboard) changes which
// one they're using.

// How far to move this frame to head toward (tx, ty) from (x, y), as [dx, dy],
// at most `maxStep`. Stops exactly on the spot instead of overshooting and
// jittering back and forth, and is [0, 0] once she's there (within `arrive`).
export function stepToward(x, y, tx, ty, maxStep, arrive = 0) {
  const dx = tx - x;
  const dy = ty - y;
  const distance = Math.hypot(dx, dy);
  if (distance <= arrive || distance === 0) return [0, 0];
  const step = Math.min(maxStep, distance);
  return [(dx / distance) * step, (dy / distance) * step];
}

// Where a point on the screen is, in px from the middle of `el` (the agar),
// which is how the game measures positions in the dish.
export function fromCenter(el, clientX, clientY) {
  const box = el.getBoundingClientRect();
  return [clientX - (box.left + box.width / 2), clientY - (box.top + box.height / 2)];
}

// Listen for a finger (or mouse button) held down on `agar`. Returns
// { target() } giving where it is now, in px from the dish center, or null
// when nothing is held down; and stop(), to ignore it from now on (after the
// game ends).
export function touchSteering(agar) {
  let pointer = null; // the id of the finger we're following
  let target = null;
  let stopped = false;

  agar.addEventListener('pointerdown', (event) => {
    if (stopped || !event.isPrimary || pointer !== null) return;
    pointer = event.pointerId;
    target = fromCenter(agar, event.clientX, event.clientY);
    // Keep following the finger even if it slides off the dish.
    agar.setPointerCapture?.(event.pointerId);
    event.preventDefault(); // no text selection or long-press menu
  });
  agar.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointer) return;
    target = fromCenter(agar, event.clientX, event.clientY);
  });
  const release = (event) => {
    if (event.pointerId !== pointer) return;
    pointer = null;
    target = null;
  };
  agar.addEventListener('pointerup', release);
  agar.addEventListener('pointercancel', release);
  agar.addEventListener('lostpointercapture', release);

  return {
    target: () => (stopped ? null : target),
    stop() {
      stopped = true;
      pointer = null;
      target = null;
    },
  };
}

// Which directions to show: 'touch' or 'keys'. Starts from what the device
// mainly uses (a finger is a "coarse" pointer), then follows what the player
// actually does.
export function watchInputMode(root = document.documentElement, win = window) {
  const set = (mode) => {
    root.classList.toggle('input-touch', mode === 'touch');
    root.classList.toggle('input-keys', mode === 'keys');
  };
  set(win.matchMedia?.('(pointer: coarse)').matches ? 'touch' : 'keys');
  win.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch' || event.pointerType === 'pen') set('touch');
  });
  win.addEventListener('keydown', (event) => {
    if (event.key.startsWith('Arrow')) set('keys');
  });
}

// Move `group` (the player's pal) for one frame: the arrow keys win if any
// are held ([dx, dy] from keyboard.js); otherwise she swims toward the
// finger, if one is down ([x, y] or null, from touchSteering). The same top
// speed, `maxStep`, either way; `arrive` is how close to the finger counts as
// there. Both game modes use this.
export function steer(group, [dx, dy], finger, maxStep, arrive = 0) {
  if (dx !== 0 || dy !== 0) {
    const length = Math.hypot(dx, dy); // same speed on diagonals
    group.x += (dx / length) * maxStep;
    group.y += (dy / length) * maxStep;
    if (dx !== 0) group.facing = Math.sign(dx);
  } else if (finger) {
    const [mx, my] = stepToward(group.x, group.y, finger[0], finger[1], maxStep, arrive);
    group.x += mx;
    group.y += my;
    // Only turn around when mostly heading sideways, so she doesn't flip
    // back and forth while swimming nearly straight up or down.
    if (Math.abs(mx) > Math.abs(my) * 0.5) group.facing = Math.sign(mx);
  }
}
