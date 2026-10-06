// Touch steering, for phones and tablets: a finger drags her like a laptop
// trackpad. Touch anywhere on the dish and she stays put, then slide your
// finger and she moves the same way, as far as your finger moves (up to a top
// speed). Nothing jumps when you touch down, and your finger can stay well
// away from her and the antibiotic disks. Lift and touch again to keep going.
//
// A mouse steers right where it points instead: press and hold, and she
// swims there at her normal speed, stopping when she gets there.
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
// { target() } giving where a held-down mouse is, in px from the dish center,
// or null when none is; drag(), how far a finger (or pen) has moved since the
// last call, as [dx, dy] px (and starts counting again from there); and
// stop(), to ignore them from now on (after the game ends). A finger never
// gives a target(), so she never heads for the spot it touched.
//
// It listens on `area`, the whole dish (the glass rim too, see main.js), so a
// finger that lands near the edge still drags her instead of starting a
// long-press on the page. Positions are still measured from the agar.
export function touchSteering(agar, area = agar) {
  let pointer = null; // the id of the finger we're following
  let dragging = false;
  let last = null; // where a dragging finger was, on the screen
  let moved = [0, 0]; // how far it's moved since drag() was last called
  let target = null;
  let stopped = false;

  const follow = (event) => {
    if (!dragging) {
      target = fromCenter(agar, event.clientX, event.clientY);
      return;
    }
    moved = [moved[0] + event.clientX - last[0], moved[1] + event.clientY - last[1]];
    last = [event.clientX, event.clientY];
  };

  area.addEventListener('pointerdown', (event) => {
    if (stopped || !event.isPrimary || pointer !== null) return;
    pointer = event.pointerId;
    dragging = event.pointerType !== 'mouse';
    last = [event.clientX, event.clientY];
    moved = [0, 0];
    follow(event);
    // Keep following the finger even if it slides off the dish.
    area.setPointerCapture?.(event.pointerId);
    event.preventDefault(); // no text selection or long-press menu
  });
  area.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointer) return;
    follow(event);
  });
  const release = (event) => {
    if (event.pointerId !== pointer) return;
    pointer = null;
    target = null;
    moved = [0, 0];
  };
  area.addEventListener('pointerup', release);
  area.addEventListener('pointercancel', release);
  area.addEventListener('lostpointercapture', release);

  return {
    target: () => (stopped ? null : target),
    drag() {
      const sofar = moved;
      moved = [0, 0];
      return stopped ? [0, 0] : sofar;
    },
    stop() {
      stopped = true;
      pointer = null;
      target = null;
      moved = [0, 0];
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
// are held ([dx, dy] from keyboard.js); otherwise a dragging finger moves her
// the same way it moved (`dragged`, [dx, dy] px from touchSteering's drag(),
// at most `dragStep`: a really fast swipe moves her less than the finger);
// otherwise she swims toward the finger, if one is down ([x, y] or null, from
// touchSteering's target()). The arrow keys and the finger share a top speed,
// `maxStep`; `arrive` is how close to the finger counts as there. Both game
// modes use this.
export function steer(group, [dx, dy], finger, maxStep, arrive = 0, dragged = [0, 0], dragStep = maxStep) {
  if (dx !== 0 || dy !== 0) {
    const length = Math.hypot(dx, dy); // same speed on diagonals
    group.x += (dx / length) * maxStep;
    group.y += (dy / length) * maxStep;
    if (dx !== 0) group.facing = Math.sign(dx);
    return;
  }
  let [mx, my] = [0, 0];
  if (dragged[0] !== 0 || dragged[1] !== 0) {
    const scale = Math.min(1, dragStep / Math.hypot(dragged[0], dragged[1]));
    [mx, my] = [dragged[0] * scale, dragged[1] * scale];
  } else if (finger) {
    [mx, my] = stepToward(group.x, group.y, finger[0], finger[1], maxStep, arrive);
  }
  group.x += mx;
  group.y += my;
  // Only turn around when mostly heading sideways, so she doesn't flip
  // back and forth while swimming nearly straight up or down.
  if (Math.abs(mx) > Math.abs(my) * 0.5) group.facing = Math.sign(mx);
}
