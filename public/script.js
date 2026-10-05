// The home page: the row of pals, and the "Press Start to Play" button.
import { HOME_PALS, homePal } from './game/pals.js';
import { splitOnTap } from './game/split.js';

const friends = document.querySelector('.friends');
friends?.append(...HOME_PALS.map(homePal));
// An easter egg: tap a pal and she divides in two.
splitOnTap(friends);

const startButton = document.querySelector('.start-btn');

if (startButton) {
  const label = startButton.textContent;

  startButton.addEventListener('click', () => {
    startButton.textContent = 'Opening picker...';
    startButton.disabled = true;

    setTimeout(() => {
      window.location.href = './pal-picker.html';
    }, 250);
  });

  // When you come back with the browser's Back button, the browser may show
  // this page exactly as it was left, still saying "Opening picker...".
  // Put the button back the way it started.
  window.addEventListener('pageshow', () => {
    startButton.textContent = label;
    startButton.disabled = false;
  });
}
