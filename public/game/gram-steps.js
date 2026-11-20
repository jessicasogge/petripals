// The four steps of a Gram stain, for doing it yourself on the picker (see
// game/pal-picker.js). The picker's Gram stain button shows the finished
// result straight away; these are the steps that get there, on the same pals.
//
// Crystal violet stains every cell purple. Iodine locks that dye inside,
// which is the one step you can't see happen. Alcohol is where they part: a
// thick wall holds the dye in, a thin one lets it wash out, leaving the cell
// colorless. Safranin is a pink dye, which only shows on the cells that lost
// their purple, and lands every pal on exactly the shades microscope mode
// gives her (stainOf).
import { STAINS, stainOf } from './stain.js';

// A cell that has lost the purple and not yet picked up the pink: the shape
// of a STAINS entry, washed out to almost nothing.
export const WASHED = { outline: '#b6c2cc', body: '#f4f7f9', light: '#ffffff', eyes: '#97a6b3' };

// Her purple once the dye is on. A pal who barely stains (Elia, Marina,
// Myra) takes up little of it, so she only ever goes pale.
const purpleFor = (species) => (species.faintStain ? STAINS.faintPositive : STAINS.positive);

export const GRAM_STEPS = [
  {
    name: 'Crystal violet',
    dye: '#7c3aed',
    shades: purpleFor,
    says: 'Every cell soaks up the purple dye.',
  },
  {
    name: 'Iodine',
    dye: '#b45309',
    shades: purpleFor,
    says: 'Nothing looks different yet. The iodine locks the purple inside.',
  },
  {
    name: 'Alcohol',
    dye: '#38bdf8',
    // A thick wall keeps what it has; a thin one is rinsed colorless.
    shades: (species) => (species.gram === 'positive' ? purpleFor(species) : WASHED),
    says: 'A thick wall holds the purple in. A thin wall lets it wash out, leaving the cell colorless.',
  },
  {
    name: 'Safranin',
    dye: '#db2777',
    shades: stainOf,
    says: 'A pink dye, which only shows on the cells that lost their purple.',
  },
];
