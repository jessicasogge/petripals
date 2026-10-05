// Detective mode's dichotomous key: a chain of two-way questions about lab
// test results that ends at exactly one pal. Each step is one test, with two
// possible results; each result leads either to the next step or to a pal.
//
// Each step has:
//   name      the test, as the button and the trail say it
//   question  what the player looks for in the result
//   view      how lab.js draws the result ('microscope' shows the pal herself,
//             Gram stained; the rest are drawings of the test)
//   why       the science behind it, shown once the player gets it right
//   answers   the two results, each with:
//     label   the answer button
//     seen    what the result looks like, for screen readers
//     next    the next step, or the id of the pal it leads to
//
// The key is real lab microbiology, simplified to one test per step. Every
// pal is at exactly one end of it (key.test.js checks), and its Gram stain
// split matches each pal's `gram` in config.js. Elia barely takes the stain,
// so she's on the pink side with the other Gram-negative pals.

const microscope = (question, why, [a, b]) => ({ name: 'Microscope', question, view: 'microscope', why, answers: [a, b] });

export const KEY = {
  name: 'Gram stain',
  question: 'What color are the cells?',
  view: 'microscope',
  why: 'Thick cell walls hold on to the purple dye. Thin walls wash clean and take up the pink.',
  answers: [
    {
      label: 'Purple',
      seen: 'The cells are stained purple.',
      next: microscope('Are the cells round, or rods?', 'Round cells are called cocci, and rod-shaped cells are called bacilli.', [
        {
          label: 'Round',
          seen: 'The cells are round.',
          next: {
            name: 'Catalase test',
            question: 'A drop of peroxide goes on the cells. Does it fizz?',
            view: 'catalase',
            why: 'Catalase is an enzyme that splits peroxide into water and oxygen gas. The gas makes the bubbles.',
            answers: [
              { label: 'Bubbles', seen: 'Lots of bubbles fizz up in the drop.', next: 'goldie' },
              {
                label: 'No bubbles',
                seen: 'The drop sits still, with no bubbles.',
                next: {
                  name: 'Blood agar',
                  question: 'What color is the ring around each colony?',
                  view: 'blood',
                  why: 'Some bacteria break open red blood cells. Breaking them partway leaves a green ring; breaking them all leaves a clear one.',
                  answers: [
                    { label: 'Green', seen: 'Each colony has a green ring around it.', next: 'penny' },
                    { label: 'Clear', seen: 'Each colony has a clear ring around it.', next: 'scarlett' },
                  ],
                },
              },
            ],
          },
        },
        {
          label: 'Rods',
          seen: 'The cells are rods.',
          next: {
            name: 'Spore stain',
            question: 'Spores stain green, and the rest of the cell pink. Any green spores?',
            view: 'spores',
            why: 'Spores are tough, sleeping cells that can wait out heat and drying for years.',
            answers: [
              {
                label: 'Green spores',
                seen: 'The pink rods have green spores in them.',
                next: {
                  name: 'Oxygen tube',
                  question: 'Air only gets into the top of the tube. Where do the cells grow?',
                  view: 'oxygen',
                  why: 'Bacteria that oxygen harms can only grow deep down, where the air can\'t reach.',
                  answers: [
                    { label: 'Top to bottom', seen: 'Cells grow all the way down the tube, most near the top.', next: 'ceres' },
                    { label: 'Only at the bottom', seen: 'Cells grow only at the bottom of the tube.', next: 'terra' },
                  ],
                },
              },
              { label: 'No spores', seen: 'The pink rods have no spores.', next: 'ana' },
            ],
          },
        },
      ]),
    },
    {
      label: 'Pink',
      seen: 'The cells are stained pink.',
      next: microscope('Are the cells corkscrews, or rods?', 'Corkscrew-shaped bacteria are called spirochetes.', [
        { label: 'Corkscrew', seen: 'The cell is a long corkscrew.', next: 'elia' },
        {
          label: 'Rods',
          seen: 'The cells are rods.',
          next: {
            name: 'Oxidase test',
            question: 'The cells are rubbed on a test strip. Does it turn purple?',
            view: 'oxidase',
            why: 'The strip turns purple when the cells have an enzyme called oxidase.',
            answers: [
              {
                label: 'Purple',
                seen: 'The strip turns dark purple.',
                next: microscope('Are the rods curved, or straight?', 'Curved rods shaped like a comma are called vibrios.', [
                  { label: 'Curved', seen: 'The rod is curved like a comma.', next: 'vi' },
                  {
                    label: 'Straight',
                    seen: 'The rods are straight.',
                    next: {
                      name: 'Chocolate agar',
                      question: 'Does it grow on plain agar too, or only on chocolate agar?',
                      view: 'chocolate',
                      why: 'Chocolate agar is made from heated blood. It has two growth factors, X and V, that some bacteria can\'t live without.',
                      answers: [
                        { label: 'Plain agar too', seen: 'Colonies grow on both plates.', next: 'mona' },
                        { label: 'Only chocolate', seen: 'Colonies grow only on the chocolate agar.', next: 'coco' },
                      ],
                    },
                  },
                ]),
              },
              { label: 'Stays pale', seen: 'The strip stays pale.', next: 'sallie' },
            ],
          },
        },
      ]),
    },
  ],
};

// True for the end of a branch: a pal's id rather than another step.
export const isPal = (next) => typeof next === 'string';

// Every pal reached from `next` (a step, or a pal's id), in key order.
export function palsUnder(next) {
  return isPal(next) ? [next] : next.answers.flatMap((answer) => palsUnder(answer.next));
}

// The way through the key to pal `id`: each step on the way and the index of
// its right answer. Empty if she isn't in the key.
export function pathTo(id, step = KEY) {
  for (const [index, answer] of step.answers.entries()) {
    if (answer.next === id) return [{ step, answer: index }];
    if (!isPal(answer.next) && palsUnder(answer.next).includes(id)) {
      return [{ step, answer: index }, ...pathTo(id, answer.next)];
    }
  }
  return [];
}

// Stars for a solved case: three, minus one for each wrong answer, but never
// fewer than one. Every case solved earns at least a star.
export const MAX_STARS = 3;
export const starsFor = (wrong) => Math.max(1, MAX_STARS - wrong);
