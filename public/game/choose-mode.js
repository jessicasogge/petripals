// The mode screen after picking a pal (choose-mode.html?pal=mona): shows the
// pal and links to classic for her, to picking rivals for mixed culture, or
// to run & tumble if she can swim.
import { SPECIES, TUMBLE } from './config.js';
import { pageReady, watchLoading } from './loading.js';
import { palById, palTile } from './pals.js';

// "Growing the colony…" while the next screen loads.
watchLoading();

const id = new URLSearchParams(window.location.search).get('pal');
const pal = palById(id);

if (!pal || !Object.hasOwn(SPECIES, id)) {
  window.location.replace('./pal-picker.html');
} else {
  document.querySelector('.mode-classic').href = `./petri-dish.html?pal=${id}`;
  document.querySelector('.mode-mixed').href = `./choose-rivals.html?pal=${id}`;
  const tumble = document.querySelector('.mode-tumble');
  if (TUMBLE.SWIMMERS.includes(id)) {
    tumble.href = `./petri-dish.html?pal=${id}&mode=tumble`;
  } else {
    // No flagella, no swimming: say why instead of linking to it.
    tumble.remove();
    const note = document.querySelector('.mode-note');
    note.textContent = `${pal.name} has no flagella, so she can't swim. Pick a pal who swims to play!`;
    note.hidden = false;
  }

  // Her picture on its tile, as on the picker, and her name in her color.
  document.querySelector('.mode-pal').append(palTile(pal));
  const nameEl = document.querySelector('.mode-pal-name');
  nameEl.textContent = pal.name;
  nameEl.style.color = SPECIES[id].color;
  document.title = `PetriPals | ${pal.name} | Choose a Mode`;
  pageReady();
}
