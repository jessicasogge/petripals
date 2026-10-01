// The spore burst: when a colony wins (you beating a level, or whichever
// colony wins a mixed culture race), it "sporulates" and little blobs in agar
// colors burst out from it and drift down. Uses canvas-confetti
// (vendor/confetti.js, v1.9.4, ISC license), copied in because the game is
// plain files with no build step.
import confetti from './vendor/confetti.js';

// Colors of real agar plates and stains.
export const AGAR_COLORS = [
  '#B3262E', // blood agar red
  '#E85A8C', // MacConkey pink
  '#7B4A2A', // chocolate agar
  '#E8C26A', // nutrient agar amber
  '#3E7CC9', // chromogenic blue
  '#5DBB63', // colony green
  '#6A3FA0', // crystal violet
];

// A slightly lumpy cell shape. Made the first time it's needed; plain
// circles if the browser can't draw custom shapes.
let blob;
function spore() {
  if (blob === undefined) {
    try {
      blob = confetti.shapeFromPath({ path: 'M6 0C9 0 12 2 12 6C12 9 10 12 6 12C2 12 0 10 0 6C0 3 3 0 6 0Z' });
    } catch {
      blob = 'circle';
    }
  }
  return blob;
}

// Where to burst from, as fractions of the window (0 to 1, what
// canvas-confetti wants), given the box of the element to burst from.
// The middle of the window if there's no box.
export function burstOrigin(rect, width, height) {
  if (!rect || !width || !height) return { x: 0.5, y: 0.5 };
  const clamp = (n) => Math.min(1, Math.max(0, n));
  return {
    x: clamp((rect.left + rect.width / 2) / width),
    y: clamp((rect.top + rect.height / 2) / height),
  };
}

// Burst spores out of `el` (the player's colony). Beating a level gets a
// quick little puff; `big` is for beating the last level: a full burst in
// three waves that floats down slowly.
export function sporeBurst(el, { big = false } = {}) {
  try {
    const base = {
      origin: burstOrigin(el?.getBoundingClientRect(), window.innerWidth, window.innerHeight),
      colors: AGAR_COLORS,
      shapes: [spore(), 'circle'],
      spread: 360, // every direction, like spores
      disableForReducedMotion: true,
    };
    if (!big) {
      // Under a second: fewer spores, not flung as far, and they fade fast.
      confetti({ ...base, particleCount: 30, startVelocity: 15, scalar: 0.9,
        gravity: 0.6, decay: 0.9, ticks: 90 });
      return;
    }
    const floaty = { ...base, gravity: 0.35, decay: 0.92, ticks: 250 };
    // One big burst, then a slower wave of fine spores, then one more pop.
    confetti({ ...floaty, particleCount: 240, startVelocity: 30, scalar: 1.1 });
    setTimeout(() => {
      confetti({ ...floaty, particleCount: 120, startVelocity: 15, scalar: 0.6, drift: 0.4 });
    }, 180);
    setTimeout(() => confetti({ ...floaty, particleCount: 150, startVelocity: 40, scalar: 0.9 }), 450);
  } catch {
    // A celebration is never worth breaking the game over.
  }
}
