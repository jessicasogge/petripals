const params = new URLSearchParams(window.location.search);
const choice = params.get('buddy');
const buddy = document.querySelector(`.dish-buddy[data-buddy="${choice}"]`);

if (buddy) {
  buddy.removeAttribute('hidden');
  document.title = `PetriPals | ${buddy.dataset.name}`;
  setUpMovement(buddy);
} else {
  // No buddy (or an unknown one) in the URL: send them back to choose.
  window.location.replace('./buddy-picker.html');
}

function setUpMovement(buddyEl) {
  const agar = document.querySelector('.agar');
  const mover = document.querySelector('.buddy-mover');

  // How far the buddy travels per second, as a fraction of the dish radius.
  const SPEED = 0.8;

  const directions = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
  };
  const held = new Set();

  // Position is the buddy's offset from the center of the dish, in pixels.
  let x = 0;
  let y = 0;
  let facing = 1; // 1 = right, -1 = left
  let lastTime = null;

  window.addEventListener('keydown', (event) => {
    if (!(event.key in directions)) return;
    event.preventDefault(); // stop arrow keys from scrolling the page
    held.add(event.key);
  });

  window.addEventListener('keyup', (event) => {
    held.delete(event.key);
  });

  // Don't keep moving if the window loses focus while a key is down.
  window.addEventListener('blur', () => held.clear());

  function step(time) {
    const seconds = lastTime === null ? 0 : (time - lastTime) / 1000;
    lastTime = time;

    let dx = 0;
    let dy = 0;
    for (const key of held) {
      dx += directions[key][0];
      dy += directions[key][1];
    }

    // Keep the buddy fully inside the dish: its center can go as far as the
    // dish radius minus the buddy's own radius.
    const dishRadius = agar.clientWidth / 2;
    const buddyRadius = buddyEl.getBoundingClientRect().width / 2;
    const maxDistance = Math.max(0, dishRadius - buddyRadius);

    if (dx !== 0 || dy !== 0) {
      // Same speed on diagonals as straight lines.
      const length = Math.hypot(dx, dy);
      const distance = SPEED * dishRadius * seconds;
      x += (dx / length) * distance;
      y += (dy / length) * distance;
      if (dx !== 0) facing = Math.sign(dx);
    }

    // Slide along the rim instead of leaving the dish.
    const fromCenter = Math.hypot(x, y);
    if (fromCenter > maxDistance) {
      x = (x / fromCenter) * maxDistance;
      y = (y / fromCenter) * maxDistance;
    }

    mover.style.transform = `translate(${x}px, ${y}px) scaleX(${facing})`;
    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}
