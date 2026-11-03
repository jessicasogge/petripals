// A pal's profile (pal-profile.html?pal=mona), opened from About on the mode
// screen: her picture, species, quick facts, her Gram stain, the drugs that
// usually work on her and how, and all her fun facts. Everything comes from
// her SPECIES entry and her picture, so every pal has one.
import { SPECIES } from './config.js';
import { DRUG_FACTS } from './drug-facts.js';
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

  // Her quick facts.
  const facts = [
    ['Gram stain', species.faintStain ? 'Barely stains' : positive ? 'Positive (purple)' : 'Negative (pink)'],
    ['Size', `~${species.sizeNote ?? `${cellLength(pal)} µm`}`],
    // Flagella in her picture, or a note for one who swims without them showing.
    ['Swims?', species.swims ?? (pal.art.includes('class="flagellum"') ? 'Yes, with flagella' : 'No')],
  ];
  document.querySelector('.profile-box').append(...facts.map(([label, value]) => {
    const box = element('div', 'profile-stat');
    box.append(element('dt', '', label), element('dd', '', value));
    return box;
  }));

  // Her picture after a Gram stain, and why she turns that color.
  const stained = palTile(pal);
  stainPal(stained.querySelector('svg'), species);
  document.querySelector('.profile-stain-pal').append(stained);
  document.querySelector('.profile-stain-text').textContent = species.faintStain
    ? `${pal.name} barely takes a Gram stain, so she turns only a pale color.`
    : `After a Gram stain, ${pal.name} turns ${positive ? 'purple: her thick wall holds the dye' : 'pink: her thin wall lets the purple wash out'}.`;

  // The drugs on her disks, each with how it works.
  document.querySelector('.profile-drugs').append(...species.antibiotics.map(({ code }) => {
    const item = element('li');
    const fact = element('p');
    fact.append(...withItalics(DRUG_FACTS[code]));
    item.append(element('span', 'profile-disk', code), fact);
    return item;
  }));

  document.querySelector('.profile-facts-head').textContent = `All about ${pal.name}`;
  document.querySelector('.profile-facts').append(...species.facts.map((fact) => {
    const item = element('li');
    item.append(...withItalics(fact));
    return item;
  }));

  document.querySelector('.profile-back').href = `./choose-mode.html?pal=${id}`;
  pageReady();
}
