// The home page: the row of pals, and the "Press Start to Play" button.
import { homePal, PALS } from './game/pals.js';

document.querySelector('.friends')?.append(...PALS.map(homePal));

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
