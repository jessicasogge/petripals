// The pal picker: a card for each pal, with her picture, name and species,
// and a button to pick her. The pals come in pages (see `page` in pals.js),
// one page at a time, with Back and More pals buttons to move between them.
// Each page's pals are in a new random order every visit, so no pal is
// always first. The microscope button shows every pal as she'd look after a
// Gram stain.
import { SPECIES } from './config.js';
import { inRandomOrder, PALS, palTile, pickerPages } from './pals.js';
import { stainPal, unstainPal } from './stain.js';

// Every page is made up front and the ones not showing are hidden, so the
// microscope button can stain every pal, and a page you come back to looks
// the same as when you left it.
const pages = pickerPages().map((pals, i) => {
  const grid = document.createElement('div');
  grid.className = 'picker-grid';
  grid.dataset.page = String(i + 1);
  grid.append(...inRandomOrder(pals).map(card));
  return grid;
});
document.querySelector('.picker-pages').append(...pages);

const back = document.querySelector('.pager-back');
const more = document.querySelector('.pager-more');
let current = 0;

function showPage(index) {
  current = index;
  pages.forEach((grid, i) => {
    grid.hidden = i !== index;
  });
  back.hidden = index === 0;
  more.hidden = index === pages.length - 1;
  // With only one page there's nothing to page through.
  document.querySelector('.picker-pager').hidden = pages.length < 2;
}

back.addEventListener('click', () => {
  showPage(current - 1);
  // The Back button is gone on the first page, so keep the keyboard nearby.
  if (back.hidden) more.focus();
});
more.addEventListener('click', () => {
  showPage(current + 1);
  if (more.hidden) back.focus();
});
showPage(0);

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
