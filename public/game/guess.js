// Guess the Pal (guess-the-pal.html): the fun facts from config.js, one at a
// time, with the pal's name blanked out. Tap the pal you think it's about.
// There's no score: a wrong guess just greys out that pal so you can try
// again, until you find her.

import { withItalics } from './italics.js';

// Every fact about every pal, as { pal, fact }, shuffled, so you go through
// them all before any comes up again. `pals` are the pals from pals.js,
// `species` is SPECIES from config.js.
export function factDeck(pals, species, random = Math.random) {
  const deck = pals.flatMap((pal) => species[pal.id].facts.map((fact) => ({ pal, fact })));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// A blank where the pal's name goes: a "?" on screen, read as "this pal" by
// a screen reader. fillBlanks() puts her name in once she's been found.
function blank() {
  const gap = document.createElement('span');
  gap.className = 'fact-blank';
  const mark = document.createElement('span');
  mark.setAttribute('aria-hidden', 'true');
  mark.textContent = '?';
  const spoken = document.createElement('span');
  spoken.className = 'visually-hidden';
  spoken.textContent = 'this pal';
  gap.append(mark, spoken);
  return gap;
}

// `fact` as nodes for the page, with other bacteria's names in italics (as
// in the end-of-level pop-up) and every mention of `name` blanked out.
// Every fact says whose it is (test/facts.test.js checks), so there's always
// at least one blank. Only whole words count, so blanking Vi leaves
// "Vibrio" alone.
export function withBlanks(fact, name) {
  const word = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
  return withItalics(fact).flatMap((node) => {
    if (node.nodeType !== Node.TEXT_NODE) return [node];
    return node.textContent
      .split(word)
      .flatMap((part, i) => (i === 0 ? [part] : [blank(), part]))
      .map((part) => (typeof part === 'string' ? document.createTextNode(part) : part))
      .filter((part) => part.textContent !== '');
  });
}

// Found her: put her name in every blank in `element`, in her `color`.
export function fillBlanks(element, name, color) {
  for (const gap of element.querySelectorAll('.fact-blank')) {
    gap.classList.add('filled');
    gap.style.color = color;
    gap.textContent = name;
  }
}
