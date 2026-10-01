// Entry point for the petri dish page: find the pal and level picked in the
// URL (petri-dish.html?pal=mona&level=2) and start the game with them.
import { antibioticsFor, placeAntibiotics } from './antibiotic.js';
import { LEVELS, SPECIES } from './config.js';
import { playGame } from './game.js';
import { scatterNutrients } from './nutrients.js';

const params = new URLSearchParams(window.location.search);
const choice = params.get('pal');
// Compare names rather than building a CSS selector from the address, so a
// mangled link (e.g. ?pal=mona"]) can't crash the page.
const pal = [...document.querySelectorAll('.dish-pal')].find((el) => el.dataset.pal === choice);
// Level 1 unless the URL says otherwise.
const levelNumber = Math.min(Math.max(parseInt(params.get('level'), 10) || 1, 1), LEVELS.length);
const level = LEVELS[levelNumber - 1];

if (pal) {
  pal.removeAttribute('hidden');
  document.title = `PetriPals | ${pal.dataset.name} | Level ${levelNumber}`;
  const species = SPECIES[pal.dataset.pal];
  // Her name and species above the dish.
  const title = document.querySelector('.pal-name');
  title.textContent = pal.dataset.name;
  title.style.color = species.color;
  document.querySelector('.species-name').textContent = species.scientific;
  const disks = placeAntibiotics(antibioticsFor(species.antibiotics, level.disks));
  const nutrients = scatterNutrients({ avoid: disks });
  playGame(pal, species, nutrients, disks, { level: levelNumber, target: level.target });
} else {
  // No pal (or an unknown one) in the URL: send them back to choose.
  window.location.replace('./pal-picker.html');
}
