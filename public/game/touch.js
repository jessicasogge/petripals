// Touch steering, for phones and tablets: touch and hold anywhere on the dish
// and the pal swims toward your finger at her normal speed, stopping when she
// gets there. Let go and she stops. It works with a mouse too (press and hold).
//
// A finger covers up the very spot it's pointing at, so by default a finger
// steers with an inoculating loop, the wire loop used to streak plates in a
// real lab: its tip sits a little above the finger, and the pal swims to the
// tip instead. Players can switch back to steering right under the finger
// (the Loop / Finger buttons under the dish), and the game remembers which.
// A mouse pointer is small, so it always steers right where it points.
//
// Also keeps the how-to-play directions right for the device: touch wording
// on a touch screen, arrow-key wording on a computer, switching if someone
// with both (a touchscreen laptop, an iPad with a keyboard) changes which
// one they're using.

// How far above the finger the loop's tip sits, in screen px: enough to
// clear a grown-up's fingertip, not so far it feels disconnected. It's a
// fixed size rather than a share of the dish because fingers don't shrink on
// small screens.
export const LOOP_REACH = 64;

// The loop's drawing. Its box is placed (in styles.css, .inoc-loop svg) so
// the finger is at (20, LOOP_FINGER_Y): the handle runs down under the
// finger, and the ring, where the pal aims, is LOOP_REACH px straight up.
// Straight up, not leaning to one side, so it suits left and right hands.
export const LOOP_FINGER_Y = 70;
const RING_Y = LOOP_FINGER_Y - LOOP_REACH;
export const LOOP_ART = `
  <svg viewBox="0 0 40 120" width="40" height="120">
    <rect x="14" y="${LOOP_FINGER_Y - 2}" width="12" height="50" rx="6" fill="#0f766e" />
    <path d="M20 ${RING_Y + 7.5} L20 ${LOOP_FINGER_Y}" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" />
    <circle class="inoc-loop-ring" cx="20" cy="${RING_Y}" r="6.5" fill="rgba(255, 255, 255, 0.35)" stroke="#475569" stroke-width="2.5" />
  </svg>`;

// A little loop for the Loop button.
const LOOP_ICON = `
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <circle cx="5" cy="5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6" />
    <path d="M6.9 6.9 L13 13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
    <path d="M13.5 13.5 L20.5 20.5" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
  </svg>`;
const FINGER_ICON = '👆';

// Where the Loop / Finger choice is saved in the browser.
export const STEERING_KEY = 'petripals.steering';

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

// Whether the player picked the loop (see steeringChoice below).
export function loopChosen(root = document.documentElement) {
  return root.classList.contains('steer-loop');
}

// Listen for a finger (or mouse button) held down on `agar`. Returns
// { target() } giving where it is now, in px from the dish center, or null
// when nothing is held down; and stop(), to ignore it from now on (after the
// game ends).
//
// With the loop on (`useLoop()`), a finger or pen steers to LOOP_REACH px
// above where it touches, and `loop` (the loop drawing) follows it so the
// player can see where that is. Pulling the finger down past the dish's edge
// still steers (it's followed off the dish), which is how the tip reaches the
// bottom of the agar.
export function touchSteering(agar, {
  useLoop = () => loopChosen(),
  loop = document.querySelector('.inoc-loop'),
} = {}) {
  let pointer = null; // the id of the finger we're following
  let lifted = false; // steering with the loop's tip, above the finger
  let target = null;
  let stopped = false;

  const showLoop = (x, y) => {
    if (!loop) return;
    loop.hidden = false;
    loop.style.transform = `translate(${x}px, ${y}px)`;
  };
  const hideLoop = () => {
    if (loop) loop.hidden = true;
  };
  const follow = (event) => {
    const reach = lifted ? LOOP_REACH : 0;
    target = fromCenter(agar, event.clientX, event.clientY - reach);
    if (lifted) showLoop(event.clientX, event.clientY);
  };

  agar.addEventListener('pointerdown', (event) => {
    if (stopped || !event.isPrimary || pointer !== null) return;
    pointer = event.pointerId;
    // Decided once per touch, so the aim can't jump mid-swim.
    lifted = event.pointerType !== 'mouse' && useLoop();
    follow(event);
    // Keep following the finger even if it slides off the dish.
    agar.setPointerCapture?.(event.pointerId);
    event.preventDefault(); // no text selection or long-press menu
  });
  agar.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointer) return;
    follow(event);
  });
  const release = (event) => {
    if (event.pointerId !== pointer) return;
    pointer = null;
    target = null;
    hideLoop();
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
      hideLoop();
    },
  };
}

// The browser's saved settings, or null if it won't share them (some private
// windows, or site data turned off), in which case the choice just isn't
// remembered.
function savedSettings(win) {
  try {
    return win.localStorage ?? null;
  } catch {
    return null;
  }
}

// The Loop / Finger buttons under the dish: `buttons` each have
// data-steer="loop" or "finger". Starts from what was picked last time (the
// loop if nothing was), marks the picked button pressed, and sets the
// steer-loop class on `root` while the loop is on, which touchSteering reads
// at the start of each touch. Also draws the buttons' icons and `loop`, the
// loop that follows the finger.
export function steeringChoice({
  root = document.documentElement,
  buttons = document.querySelectorAll('.steer-btn'),
  loop = document.querySelector('.inoc-loop'),
  win = window,
} = {}) {
  if (loop) loop.innerHTML = LOOP_ART;
  for (const button of buttons) {
    const icon = button.querySelector('.steer-icon');
    if (icon) icon.innerHTML = button.dataset.steer === 'loop' ? LOOP_ICON : FINGER_ICON;
  }
  const storage = savedSettings(win);
  const pick = (choice, save) => {
    root.classList.toggle('steer-loop', choice === 'loop');
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.steer === choice));
    }
    if (!save) return;
    try {
      storage?.setItem(STEERING_KEY, choice);
    } catch {
      // Full or blocked: it still works, it just won't be remembered.
    }
  };

  let saved = null;
  try {
    saved = storage?.getItem(STEERING_KEY);
  } catch {
    saved = null;
  }
  pick(saved === 'finger' ? 'finger' : 'loop', false);
  for (const button of buttons) {
    button.addEventListener('click', () => pick(button.dataset.steer, true));
  }
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
