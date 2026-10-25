// Arrow-key steering: which way the arrow keys being held point.
const DIRECTIONS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

// `win` is the window to listen on (tests pass their own).
export function arrowKeys(win = window) {
  const held = new Set();
  let enabled = true;
  win.addEventListener('keydown', (event) => {
    // Once steering stops (the game is over), arrows scroll the page again.
    if (!(event.key in DIRECTIONS) || !enabled) return;
    event.preventDefault(); // stop arrow keys from scrolling the page
    held.add(event.key);
  });
  win.addEventListener('keyup', (event) => held.delete(event.key));
  // Don't keep moving if the window loses focus while a key is down.
  win.addEventListener('blur', () => held.clear());

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
