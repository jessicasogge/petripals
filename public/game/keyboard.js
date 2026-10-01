// Arrow-key steering: which way the arrow keys being held point.
const DIRECTIONS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

export function arrowKeys() {
  const held = new Set();
  let enabled = true;
  window.addEventListener('keydown', (event) => {
    if (!(event.key in DIRECTIONS)) return;
    event.preventDefault(); // stop arrow keys from scrolling the page
    if (enabled) held.add(event.key);
  });
  window.addEventListener('keyup', (event) => held.delete(event.key));
  // Don't keep moving if the window loses focus while a key is down.
  window.addEventListener('blur', () => held.clear());

  return {
    // [dx, dy], each -1, 0 or 1 ([0, 0] if no arrows are held).
    direction() {
      let dx = 0;
      let dy = 0;
      for (const key of held) {
        dx += DIRECTIONS[key][0];
        dy += DIRECTIONS[key][1];
      }
      return [dx, dy];
    },
    // Stop listening for good, e.g. when the game is over.
    stop() {
      enabled = false;
      held.clear();
    },
  };
}
