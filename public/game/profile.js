// Fills in a pal's profile (pal-profile.html's markup) for the pal with this
// id: her picture, species, size and how fast she doubles, her Gram stain,
// her colonies on her own plate and on plates to compare, and all her fun
// facts.
// Everything comes from her SPECIES entry and her picture, so every pal has
// one. Used by the profile page in the browser (pal-profile.js), and by the
// deploy, which writes a page for each pal ahead of time for search engines
// (scripts/build-site.js). Returns false for a pal who doesn't exist.
import { SPECIES } from './config.js';
import { plate, platesFor } from './colonies.js';
import { speciesName, withItalics } from './italics.js';
import { cellLength, palById, palTile } from './pals.js';
import { stainPal } from './stain.js';

// How often she doubles, in words: "20 minutes", "an hour and a half",
// "3 hours". Round numbers, since these are typical figures, not exact ones.
export function doublingText(minutes) {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = minutes / 60;
  if (hours === 1) return 'hour';
  if (hours === 1.5) return 'hour and a half';
  if (Number.isInteger(hours)) return `${hours} hours`;
  return `${Math.floor(hours)} and a half hours`;
}

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

  // How fast one cell becomes two with nothing holding her back. Real growth
  // is slower, so the line says the conditions these figures come from.
  doc.querySelector('.profile-doubling').textContent =
    `${doublingText(species.doubling)} in favorable conditions`;

  // Her picture after a Gram stain, and why she turns that color.
  const stained = palTile(pal);
  stainPal(stained.querySelector('svg'), species);
  doc.querySelector('.profile-stain-pal').append(stained);
  doc.querySelector('.profile-stain-text').textContent = species.faintStain
    ? `${pal.name} barely takes a Gram stain, so she turns only a pale color.`
    : `After a Gram stain, ${pal.name} turns ${positive ? 'purple: her thick wall holds the dye' : 'pink: her thin wall lets the purple wash out'}.`;

  // Her colonies on a streaked plate, and what to notice about them: on her
  // own plate, and buttons to try her on the plates every pal can be grown
  // on. Each button is a radio button; styles.css shows the plate that's
  // picked, so it works on the ready-made pages, which have no script.
  const box = doc.querySelector('.profile-plates');
  const chips = element('div');
  chips.className = 'plate-chips';
  const panels = element('div');
  panels.className = 'plate-panels';
  const plates = platesFor(id);
  for (const { kind, name, caption } of plates) {
    const radio = element('input');
    radio.type = 'radio';
    radio.name = 'plate';
    radio.id = `plate-${kind}`;
    radio.className = 'plate-radio';
    if (kind === 'home') radio.setAttribute('checked', '');
    box.append(radio);

    const label = element('label');
    label.htmlFor = radio.id;
    label.textContent = name;
    chips.append(label);

    const panel = element('div');
    panel.className = `profile-plate plate-${kind}`;
    const pic = element('div');
    pic.className = 'profile-plate-pic';
    pic.setAttribute('aria-hidden', 'true');
    pic.innerHTML = plate(id, kind);
    const text = element('p');
    text.className = 'profile-plate-text';
    text.textContent = caption;
    panel.append(pic, text);
    panels.append(panel);
  }
  // Just her own plate (Elia's), with nothing to pick: no buttons.
  if (plates.length > 1) box.append(chips);
  box.append(panels);

  doc.querySelector('.profile-facts').append(...species.facts.map((fact) => {
    const item = element('li');
    item.append(...withItalics(fact));
    return item;
  }));

  doc.querySelector('.profile-back').href = `./choose-mode.html?pal=${id}`;
  return true;
}
