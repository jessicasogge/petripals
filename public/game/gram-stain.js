// The Gram stain mini-game (gram-stain.html): do the stain yourself, one
// step at a time, on a slide of three pals chosen so each one ends up
// differently. It's the "how" behind the picker's Gram stain button, which
// shows the finished result.
//
// The four steps are the real ones. Crystal violet stains every cell purple.
// Iodine locks that dye inside, which is the one step you can't see happen.
// Alcohol is where they part: a thick wall holds the dye in, a thin one lets
// it wash out, leaving the cell colorless. Safranin is a pink dye, which only
// shows on the cells that lost the purple. The last step paints each pal
// exactly as microscope mode does (stainOf), so the ending matches what the
// picker already shows.
import { SPECIES } from './config.js';
import { pageReady, watchLoading } from './loading.js';
import { palById, palTile } from './pals.js';
import { paintPal, STAINS, stainOf, unstainPal } from './stain.js';

// "Growing the colony…" while the next screen loads.
watchLoading();

// One Gram-positive, one Gram-negative, and one who barely stains at all, so
// every ending is on the slide at once.
const SLIDE = ['goldie', 'colette', 'myra'];

// A cell that has lost the purple and not yet picked up the pink: the same
// shades a stain uses, washed out to almost nothing.
const WASHED = { outline: '#b6c2cc', body: '#f4f7f9', light: '#ffffff', eyes: '#97a6b3' };

const isPositive = (id) => SPECIES[id].gram === 'positive';

// Each step: what to call it, the dye's color on its button, how it paints
// each pal, and what to say about it. `shades` returning null leaves her in
// her own colors.
const STEPS = [
  {
    name: 'Crystal violet',
    dye: '#7c3aed',
    shades: () => STAINS.positive,
    says: 'Every cell soaks up the purple dye.',
  },
  {
    name: 'Iodine',
    dye: '#b45309',
    shades: () => STAINS.positive,
    says: 'Nothing looks different yet. The iodine locks the purple inside, so it cannot simply rinse away.',
  },
  {
    name: 'Alcohol',
    dye: '#38bdf8',
    shades: (id) => (isPositive(id) ? STAINS.positive : WASHED),
    says: 'The step that tells them apart. A thick wall holds the purple in. A thin wall lets it wash out, leaving the cell colorless.',
  },
  {
    name: 'Safranin',
    dye: '#db2777',
    shades: (id) => stainOf(SPECIES[id]),
    says: 'A pink dye, which only shows on the cells that lost their purple.',
  },
];

const START = 'Four steps, in order. Tap the first dye to begin.';
const DONE = 'That is a finished Gram stain, and the same colors the picker shows: purple for a thick wall, pink for a thin one.';

export function startGame(doc) {
  const slide = doc.querySelector('.stain-slide');
  const buttons = doc.querySelector('.stain-steps');
  const caption = doc.querySelector('.stain-caption');
  const again = doc.querySelector('.stain-again');

  // Her picture on the slide, with her name under it.
  const pals = SLIDE.map((id) => {
    const pal = palById(id);
    const cell = doc.createElement('figure');
    cell.className = `stain-cell ${id}`;
    const tile = palTile(pal);
    const name = doc.createElement('figcaption');
    name.textContent = pal.name;
    cell.append(tile, name);
    slide.append(cell);
    return { id, svg: tile.querySelector('svg') };
  });

  // A button per step, in order.
  const steps = STEPS.map((step, i) => {
    const item = doc.createElement('li');
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'stain-step';
    button.style.setProperty('--dye', step.dye);
    const drop = doc.createElement('span');
    drop.className = 'stain-drop';
    drop.setAttribute('aria-hidden', 'true');
    const label = doc.createElement('span');
    label.textContent = step.name;
    button.append(drop, label);
    button.addEventListener('click', () => take(i + 1));
    item.append(button);
    buttons.append(item);
    return button;
  });

  // How many steps are done. 0 is the slide before any dye.
  let at = 0;

  function take(step) {
    at = step;
    const { shades, says } = STEPS[step - 1];
    for (const pal of pals) {
      unstainPal(pal.svg);
      paintPal(pal.svg, shades(pal.id));
    }
    caption.textContent = step === STEPS.length ? `${says} ${DONE}` : says;
    show();
  }

  // Only the next step can be tapped, and done ones say so.
  function show() {
    steps.forEach((button, i) => {
      button.classList.toggle('done', i < at);
      button.classList.toggle('next', i === at);
      button.disabled = i !== at;
      button.setAttribute('aria-disabled', String(i !== at));
    });
    again.hidden = at === 0;
    slide.classList.toggle('stained', at > 0);
  }

  again.addEventListener('click', () => {
    at = 0;
    for (const pal of pals) unstainPal(pal.svg);
    caption.textContent = START;
    show();
  });

  caption.textContent = START;
  show();
}

startGame(document);
pageReady();
