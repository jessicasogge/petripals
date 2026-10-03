// The pal picker: a card for each pal, in the order of PALS (pals.js), with
// her picture, name and species, and a button to pick her. The microscope
// button shows every pal as she'd look after a Gram stain.
import { SPECIES } from './config.js';
import { PALS, palTile } from './pals.js';
import { stainPal, unstainPal } from './stain.js';

document.querySelector('.picker-grid').append(...PALS.map(card));

function card(pal) {
  const article = document.createElement('article');
  article.className = 'pal-card';

  const name = document.createElement('h2');
  name.textContent = pal.name;

  const { scientific, gram, faintStain } = SPECIES[pal.id];
  const species = document.createElement('p');
  species.className = 'species';
  const italic = document.createElement('i');
  italic.textContent = scientific;
  species.append(italic);
  // In microscope mode, a pal who barely takes the stain says so.
  if (faintStain) {
    const note = document.createElement('span');
    note.className = 'stain-note';
    note.textContent = "Doesn't stain well";
    species.append(note);
  }

  const pick = document.createElement('a');
  pick.className = 'pick-btn';
  pick.href = `./choose-mode.html?pal=${pal.id}`;
  pick.textContent = `Select ${pal.name}`;

  const tile = palTile(pal);
  tile.classList.add(`gram-${gram}`);
  if (faintStain) tile.classList.add('faint-stain');

  article.append(tile, name, species, pick);
  return article;
}

// The microscope button: switch every pal between her colors and her Gram
// stain colors.
const shell = document.querySelector('.picker-shell');
const scope = document.querySelector('.scope-btn');

function showStain(stained) {
  shell.classList.toggle('stained', stained);
  scope.setAttribute('aria-pressed', String(stained));
  scope.querySelector('.scope-label').textContent = stained ? 'Back to color' : 'Gram stain';
  document.querySelector('.scope-caption').hidden = !stained;
  for (const pal of PALS) {
    const svg = document.querySelector(`.pal-icon.${pal.id} svg`);
    if (stained) stainPal(svg, SPECIES[pal.id]);
    else unstainPal(svg);
  }
}

scope?.addEventListener('click', () => showStain(!shell.classList.contains('stained')));
