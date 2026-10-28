// The PetriPals family tree: how the pals are related, simplified to
// show only the pals in the game. Each branch has a kid-friendly name, its
// science name (sci) where it has one, and a short note. Leaves are pal ids.
const pals = (...ids) => ids.map((leaf) => ({ leaf }));

export const TREE = {
  id: 'bacteria',
  name: 'Bacteria',
  note: 'Tiny single cells with no nucleus. They live almost everywhere on Earth.',
  kids: [
    {
      id: 'firmicutes', name: 'Firmicutes', sci: 'Bacillota',
      note: 'Thick cell walls, so most stain purple in a Gram stain.',
      kids: [
        {
          id: 'bacilli', name: 'Bacilli', sci: 'Bacilli',
          note: 'Rods and round cells. Many grow in chains, pairs or clusters.',
          kids: pals('ceres', 'ivy', 'lissie', 'goldie', 'scarlett', 'penny'),
        },
        {
          id: 'clostridia', name: 'Clostridia', sci: 'Clostridia',
          note: 'Grow without oxygen; many make tough resting spores.',
          kids: pals('terra', 'diffany'),
        },
      ],
    },
    {
      id: 'actinobacteria', name: 'Actinobacteria', sci: 'Actinomycetota',
      note: 'Many grow in branches, and some make the antibiotics we use as medicine.',
      kids: pals('ana', 'nova', 'marina'),
    },
    {
      id: 'deinococcota', name: 'Deinococcota',
      note: 'Super tough. They stain purple, but have an outer membrane like the pink ones.',
      kids: pals('dina'),
    },
    {
      id: 'cyanobacteria', name: 'Cyanobacteria', sci: 'Cyanobacteriota',
      note: 'Make their own food from sunlight, and made much of the oxygen we breathe.',
      kids: pals('ari'),
    },
    {
      id: 'spirochetes', name: 'Spirochetes', sci: 'Spirochaetota',
      note: 'Corkscrews, with their flagella tucked inside the cell.',
      kids: pals('elia'),
    },
    {
      id: 'desulfobacterota', name: 'Desulfobacterota',
      note: 'Many use sulfur compounds or metals instead of oxygen.',
      kids: pals('electra'),
    },
    {
      id: 'proteobacteria', name: 'Proteobacteria', sci: 'Pseudomonadota',
      note: 'Thin cell walls and an outer membrane, so they stain pink.',
      kids: [
        {
          id: 'alpha', name: 'Alphaproteobacteria',
          note: 'A big, varied class. Some, like Bree, live inside other cells.',
          kids: pals('astrid', 'bree'),
        },
        {
          id: 'gamma', name: 'Gammaproteobacteria',
          note: 'The biggest branch in PetriPals, from sea swimmers to gut cousins.',
          kids: [
            {
              id: 'pseudomonadales', name: 'Pseudomonadales',
              note: 'Live in soil and water, and can eat almost anything.',
              kids: pals('mona'),
            },
            {
              id: 'vibrionales', name: 'Vibrionales',
              note: 'Curved swimmers that love salty water.',
              kids: pals('vi'),
            },
            {
              id: 'pasteurellales', name: 'Pasteurellales',
              note: 'Small rods that live in the noses and throats of people and animals.',
              kids: pals('coco'),
            },
            {
              id: 'thiotrichales', name: 'Thiotrichales',
              note: 'A mixed group. Frannie’s family can hide inside animal cells.',
              kids: pals('frannie'),
            },
            {
              id: 'enterobacterales', name: 'Gut cousins', sci: 'Enterobacterales',
              note: 'Grow with or without oxygen. Many live in guts; others in soil, water and plants.',
              kids: pals('colette', 'sallie', 'sara', 'kiki', 'pearl'),
            },
          ],
        },
      ],
    },
  ],
};

// Every branch and leaf by id, each knowing its parent.
const byId = new Map();
(function index(node, parent) {
  node.parent = parent;
  byId.set(node.id ?? node.leaf, node);
  for (const kid of node.kids ?? []) index(kid, node);
})(TREE, null);

export const branchById = (id) => byId.get(id) ?? null;

// The branches from the top of the tree down to `id` (a branch or a pal),
// not counting the pal herself.
export function lineage(id) {
  const out = [];
  for (let node = byId.get(id); node; node = node.parent) if (!node.leaf) out.unshift(node);
  return out;
}

// Every pal on a branch, however far down, in order.
export function palsOn(branch) {
  return branch.kids.flatMap((kid) => (kid.leaf ? [kid.leaf] : palsOn(kid)));
}
