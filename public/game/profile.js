// Fills in a pal's profile (pal-profile.html's markup) for the pal with this
// id: her picture, species and size, her Gram stain and all her fun facts.
// Everything comes from her SPECIES entry and her picture, so every pal has
// one. Used by the profile page in the browser (pal-profile.js), and by the
// deploy, which writes a page for each pal ahead of time for search engines
// (scripts/build-site.js). Returns false for a pal who doesn't exist.
import { SPECIES } from './config.js';
import { speciesName, withItalics } from './italics.js';
import { cellLength, palById, palTile } from './pals.js';
import { stainPal } from './stain.js';

export function renderProfile(doc, id) {
  const pal = palById(id);
  if (!pal || !Object.hasOwn(SPECIES, id)) return false;
  const species = SPECIES[id];
  const positive = species.gram === 'positive';
  const element = (tag) => doc.createElement(tag);

  doc.querySelector('.profile-pal').append(palTile(pal));
  const name = doc.querySelector('.profile-name');
  name.textContent = pal.name;
  name.style.color = species.color;
  doc.querySelector('.profile-species').append(...speciesName(species.scientific));

  // About how long one of her cells is (or Nova's filament), as in Compare sizes.
  doc.querySelector('.profile-size').textContent = `~${cellLength(pal)} µm`;

  // Her picture after a Gram stain, and why she turns that color.
  const stained = palTile(pal);
  stainPal(stained.querySelector('svg'), species);
  doc.querySelector('.profile-stain-pal').append(stained);
  doc.querySelector('.profile-stain-text').textContent = species.faintStain
    ? `${pal.name} barely takes a Gram stain, so she turns only a pale color.`
    : `After a Gram stain, ${pal.name} turns ${positive ? 'purple: her thick wall holds the dye' : 'pink: her thin wall lets the purple wash out'}.`;

  doc.querySelector('.profile-facts').append(...species.facts.map((fact) => {
    const item = element('li');
    item.append(...withItalics(fact));
    return item;
  }));

  doc.querySelector('.profile-back').href = `./choose-mode.html?pal=${id}`;
  return true;
}
