// The mode screen after picking a pal (choose-mode.html?pal=mona): shows the
// pal and links to classic or mixed culture for her.
import { SPECIES } from './config.js';

const pal = new URLSearchParams(window.location.search).get('pal');

if (!Object.hasOwn(SPECIES, pal)) {
  window.location.replace('./pal-picker.html');
} else {
  document.querySelector('.mode-classic').href = `./petri-dish.html?pal=${pal}`;
  document.querySelector('.mode-mixed').href = `./petri-dish.html?pal=${pal}&mode=mixed`;
  showPal();
}

// Her name in her color, and her picture copied from the picker page.
async function showPal() {
  try {
    const picker = new DOMParser().parseFromString(
      await (await fetch('./pal-picker.html')).text(), 'text/html');
    const card = [...picker.querySelectorAll('.pal-card')]
      .find((c) => c.querySelector(`a[href*="pal=${pal}"]`));
    const name = card.querySelector('h2').textContent;
    const nameEl = document.querySelector('.mode-pal-name');
    nameEl.textContent = name;
    nameEl.style.color = SPECIES[pal].color;
    document.title = `PetriPals | ${name} | Choose a Mode`;
    const icon = card.querySelector('.pal-icon');
    if (icon) document.querySelector('.mode-pal').append(document.importNode(icon, true));
  } catch {
    // Without the picture or name the buttons still work.
  }
}
