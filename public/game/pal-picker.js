// The pal picker: a card for each pal, in the order of PALS (pals.js), with
// her picture, name and species, and a button to pick her.
import { SPECIES } from './config.js';
import { PALS, palTile } from './pals.js';

document.querySelector('.picker-grid').append(...PALS.map(card));

function card(pal) {
  const article = document.createElement('article');
  article.className = 'pal-card';

  const name = document.createElement('h2');
  name.textContent = pal.name;

  const species = document.createElement('p');
  species.className = 'species';
  const italic = document.createElement('i');
  italic.textContent = SPECIES[pal.id].scientific;
  species.append(italic);

  const pick = document.createElement('a');
  pick.className = 'pick-btn';
  pick.href = `./choose-mode.html?pal=${pal.id}`;
  pick.textContent = `Select ${pal.name}`;

  article.append(palTile(pal), name, species, pick);
  return article;
}
