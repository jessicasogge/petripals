// DIY Gram stain on picker pals: violet dyes all, iodine fixes it,
// alcohol clears thin-walled cells, safranin turns them pink.
// Final colors match stainOf.
import { STAINS, stainOf } from './stain.js';

export const WASHED = { outline: '#b6c2cc', body: '#f4f7f9', light: '#ffffff', eyes: '#97a6b3' };

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
