// The pal picker: a card for each pal, with her picture, name and species,
// and a button to pick her. The pals are in alphabetical order by species,
// so it's easy to find the one you're looking for, then split into pages of
// eight (PAGE_SIZE in pals.js), shown one at a time
// with Back and More pals buttons to move between them.
// The microscope button shows every pal as she'd look after a
// Gram stain, with "Do the stain yourself" to walk the four steps that get
// there (game/gram-steps.js), and the Compare sizes button shows the pals'
// sizes relative to each other.
import { SPECIES } from './config.js';
import { speciesName } from './italics.js';
import { pageReady, watchLoading } from './loading.js';
import { bySpecies, cellLength, PALS, palTile, pickerPages, toScale } from './pals.js';
import { GRAM_STEPS } from './gram-steps.js';
import { paintPal, stainPal, unstainPal } from './stain.js';

watchLoading();

const pages = pickerPages(bySpecies(PALS)).map((pals, i) => {
  const grid = document.createElement('div');
  grid.className = 'picker-grid';
  grid.dataset.page = String(i + 1);
  grid.append(...pals.map(card));
  return grid;
});
document.querySelector('.picker-pages').append(...pages);

const back = document.querySelector('.pager-back');
const more = document.querySelector('.pager-more');
let current = 0;

const PAGE_KEY = 'petripals-picker-page';

function savedPage() {
  try {
    const page = Number(sessionStorage.getItem(PAGE_KEY));
    // A page that no longer exists (fewer pals than before) opens page one.
    return Number.isInteger(page) && page > 0 && page < pages.length ? page : 0;
  } catch {
    return 0; // No storage (private browsing, etc.): page one, as before.
  }
}

function showPage(index) {
  current = index;
  try {
    sessionStorage.setItem(PAGE_KEY, String(index));
  } catch {
    // See savedPage.
  }
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
showPage(savedPage());

// Her card: the whole card is the link that picks her.
function card(pal) {
  const link = document.createElement('a');
  link.className = 'pal-card';
  link.href = `./choose-mode.html?pal=${pal.id}`;

  const name = document.createElement('h2');
  name.textContent = pal.name;

  const { scientific, gram, faintStain } = SPECIES[pal.id];
  const species = document.createElement('p');
  species.className = 'species';
  species.append(...speciesName(scientific));
  // In microscope mode, a pal who barely takes the stain says so.
  if (faintStain) {
    const note = document.createElement('span');
    note.className = 'stain-note';
    note.textContent = "Doesn't stain well";
    species.append(note);
  }

  const tile = palTile(pal);
  tile.classList.add(`gram-${gram}`);
  if (faintStain) tile.classList.add('faint-stain');

  // In Compare sizes mode, about how long one cell really is (or a note that
  // says more). The ~ means about: sizes vary, and these are typical ones.
  const size = document.createElement('p');
  size.className = 'size-note';
  size.textContent = `~${SPECIES[pal.id].sizeNote ?? `${cellLength(pal)} µm`}`;

  link.append(tile, name, species, size);
  return link;
}

// The microscope button: switch every pal between her colors and her Gram
// stain colors. "Do the stain yourself" walks the four steps that get there,
// on these same pals, and ends on exactly the colors this button shows.
const shell = document.querySelector('.picker-shell');
const scope = document.querySelector('.scope-btn');
const caption = document.querySelector('.scope-caption');
const cta = document.querySelector('.stain-cta');
const ctaBtn = cta.querySelector('.stain-btn');
const stepList = document.querySelector('.stain-steps');
const stepCaption = document.querySelector('.stain-caption');

// Her drawing on whichever page she's on. Every page is made up front, so a
// step reaches all of them and holds as you page through.
const drawingOf = (id) => document.querySelector(`.pal-icon.${id} svg`);

// Paint every pal, or put her own colors back with `shades` left out.
function paintAll(shades) {
  for (const pal of PALS) {
    const svg = drawingOf(pal.id);
    unstainPal(svg);
    if (shades) paintPal(svg, shades(SPECIES[pal.id]));
  }
}

// How far through the steps we are: 0 before the first dye, or null when
// we're not doing the steps at all.
let step = null;

// A button per dye, in order.
const dyes = GRAM_STEPS.map((dye, i) => {
  const item = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'stain-step';
  button.style.setProperty('--dye', dye.dye);
  const drop = document.createElement('span');
  drop.className = 'stain-drop';
  drop.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.textContent = dye.name;
  button.append(drop, label);
  button.addEventListener('click', () => takeStep(i + 1));
  item.append(button);
  stepList.append(item);
  return button;
});

function takeStep(next) {
  step = next;
  const dye = GRAM_STEPS[next - 1];
  paintAll(dye.shades);
  stepCaption.textContent = dye.says;
  showSteps();
}

// What the step row and the captions show. Once the last dye is on, the
// steps are done: the row goes away and the usual caption comes back, since
// the pals are now exactly as the Gram stain button leaves them.
function showSteps() {
  const walking = step !== null;
  const done = step === GRAM_STEPS.length;
  stepList.hidden = !walking || done;
  stepCaption.hidden = !walking;
  caption.hidden = !shell.classList.contains('stained') || (walking && !done);
  cta.hidden = !shell.classList.contains('stained') || (walking && !done);
  ctaBtn.textContent = done ? 'Do the stain again' : 'Do the stain yourself';
  dyes.forEach((button, i) => {
    button.classList.toggle('done', i < step);
    button.disabled = i !== step;
    button.setAttribute('aria-disabled', String(i !== step));
  });
}

function showStain(stained) {
  shell.classList.toggle('stained', stained);
  scope.setAttribute('aria-pressed', String(stained));
  scope.querySelector('.scope-label').textContent = stained ? 'Back to color' : 'Gram stain';
  // Turning it on or off leaves the steps, and shows the finished stain.
  step = null;
  showSteps();
  for (const pal of PALS) {
    const svg = drawingOf(pal.id);
    if (stained) stainPal(svg, SPECIES[pal.id]);
    else unstainPal(svg);
  }
}

scope?.addEventListener('click', () => showStain(!shell.classList.contains('stained')));

// Start the steps: back to her own colors, with the first dye to tap.
ctaBtn.addEventListener('click', () => {
  step = 0;
  paintAll(null);
  stepCaption.textContent = 'Four dyes, in order. Tap the first one to begin.';
  showSteps();
});

showSteps();

// The Compare sizes button: show one cell of every pal, shrunk around her
// body so the pals' sizes compare relative to each other (see toScale in
// pals.js), and back. It works in color or stained.
const scale = document.querySelector('.scale-btn');

function showScale(scaled) {
  shell.classList.toggle('to-scale', scaled);
  scale.setAttribute('aria-pressed', String(scaled));
  scale.querySelector('.scale-label').textContent = scaled ? 'Full size' : 'Compare sizes';
  document.querySelector('.scale-caption').hidden = !scaled;
  const stained = shell.classList.contains('stained');
  for (const pal of PALS) {
    const svg = document.querySelector(`.pal-icon.${pal.id} svg`);
    // A pal whose picture shows several cells shows just one of them.
    if (pal.cellArt) {
      svg.innerHTML = scaled ? pal.cellArt : pal.art;
      for (const wiggle of svg.querySelectorAll('animate')) wiggle.remove();
      if (stained) stainPal(svg, SPECIES[pal.id]);
    }
    if (scaled) {
      const { scale: by, x, y } = toScale(pal);
      svg.style.transformOrigin = `${x * 100}% ${y * 100}%`;
      svg.style.transform = `translate(${(0.5 - x) * 100}%, ${(0.5 - y) * 100}%) scale(${by})`;
    } else {
      svg.style.removeProperty('transform-origin');
      svg.style.removeProperty('transform');
    }
  }
}

scale?.addEventListener('click', () => showScale(!shell.classList.contains('to-scale')));

// All filled in: take the loading card away.
pageReady();
