// Entry point for the petri dish page: find the buddy picked in the URL
// (petri-dish.html?buddy=mona) and start the game with it.
import { placeAntibiotics } from './antibiotic.js';
import { SPECIES } from './config.js';
import { playGame } from './game.js';
import { scatterNutrients } from './nutrients.js';

const params = new URLSearchParams(window.location.search);
const choice = params.get('buddy');
const buddy = document.querySelector(`.dish-buddy[data-buddy="${choice}"]`);

if (buddy) {
  buddy.removeAttribute('hidden');
  document.title = `PetriPals | ${buddy.dataset.name}`;
  const species = SPECIES[buddy.dataset.buddy];
  const disks = placeAntibiotics(species.antibiotics);
  const nutrients = scatterNutrients({ avoid: disks });
  playGame(buddy, species, nutrients, disks);
} else {
  // No buddy (or an unknown one) in the URL: send them back to choose.
  window.location.replace('./buddy-picker.html');
}
