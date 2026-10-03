// The mode screen after picking a pal (choose-mode.html?pal=mona): shows the
// pal and links to classic or mixed culture for her.
import { SPECIES } from './config.js';
import { palById, palTile } from './pals.js';
import { stainOn, stainPal } from './stain.js';

const id = new URLSearchParams(window.location.search).get('pal');
const pal = palById(id);

if (!pal || !Object.hasOwn(SPECIES, id)) {
  window.location.replace('./pal-picker.html');
} else {
  document.querySelector('.mode-classic').href = `./petri-dish.html?pal=${id}`;
  document.querySelector('.mode-mixed').href = `./petri-dish.html?pal=${id}&mode=mixed`;

  // Her picture on its tile, as on the picker, and her name in her color.
  // Stained, if microscope mode is on (see stain.js).
  const tile = palTile(pal);
  if (stainOn()) {
    stainPal(tile.querySelector('svg'), SPECIES[id]);
    document.body.classList.add('stained');
  }
  document.querySelector('.mode-pal').append(tile);
  const nameEl = document.querySelector('.mode-pal-name');
  nameEl.textContent = pal.name;
  nameEl.style.color = SPECIES[id].color;
  document.title = `PetriPals | ${pal.name} | Choose a Mode`;
}
