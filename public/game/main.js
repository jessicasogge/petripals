// Entry point for the petri dish page: find the pal picked in the URL
// (petri-dish.html?pal=mona) and start the game with it.
import { placeAntibiotics } from './antibiotic.js';
import { SPECIES } from './config.js';
import { playGame } from './game.js';
import { scatterNutrients } from './nutrients.js';

const params = new URLSearchParams(window.location.search);
const choice = params.get('pal');
const pal = document.querySelector(`.dish-pal[data-pal="${choice}"]`);

if (pal) {
  pal.removeAttribute('hidden');
  document.title = `PetriPals | ${pal.dataset.name}`;
  const species = SPECIES[pal.dataset.pal];
  const disks = placeAntibiotics(species.antibiotics);
  const nutrients = scatterNutrients({ avoid: disks });
  playGame(pal, species, nutrients, disks);
} else {
  // No pal (or an unknown one) in the URL: send them back to choose.
  window.location.replace('./pal-picker.html');
}
