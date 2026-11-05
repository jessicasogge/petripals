// A pal's profile (pal-profile.html?pal=mona), opened from About on the mode
// screen: her picture, species and size, her Gram stain and all her fun
// facts. Everything comes from
// her SPECIES entry and her picture, so every pal has one.
import { SPECIES } from './config.js';
import { speciesName, withItalics } from './italics.js';
import { pageReady, watchLoading } from './loading.js';
import { cellLength, palById, palTile } from './pals.js';
import { stainPal } from './stain.js';

// "Growing the colony…" while the next screen loads.
watchLoading();

const id = new URLSearchParams(window.location.search).get('pal');
const pal = palById(id);

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

if (!pal || !Object.hasOwn(SPECIES, id)) {
  window.location.replace('./pal-picker.html');
} else {
  const species = SPECIES[id];
  const positive = species.gram === 'positive';
  document.title = `PetriPals | About ${pal.name}`;

  document.querySelector('.profile-pal').append(palTile(pal));
  const name = document.querySelector('.profile-name');
  name.textContent = pal.name;
  name.style.color = species.color;
  document.querySelector('.profile-species').append(...speciesName(species.scientific));

  // About how long one of her cells is (or Nova's filament), as in Compare sizes.
  document.querySelector('.profile-size').textContent = `About ${cellLength(pal)} µm long`;

  // Her picture after a Gram stain, and why she turns that color.
  const stained = palTile(pal);
  stainPal(stained.querySelector('svg'), species);
  document.querySelector('.profile-stain-pal').append(stained);
  document.querySelector('.profile-stain-text').textContent = species.faintStain
    ? `${pal.name} barely takes a Gram stain, so she turns only a pale color.`
    : `After a Gram stain, ${pal.name} turns ${positive ? 'purple: her thick wall holds the dye' : 'pink: her thin wall lets the purple wash out'}.`;

  document.querySelector('.profile-facts-head').textContent = `All about ${pal.name}`;
  document.querySelector('.profile-facts').append(...species.facts.map((fact) => {
    const item = element('li');
    item.append(...withItalics(fact));
    return item;
  }));

  document.querySelector('.profile-back').href = `./choose-mode.html?pal=${id}`;
  pageReady();
}
