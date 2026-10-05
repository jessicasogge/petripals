// Who’s That Pal? (whos-that-pal.html): the fun facts from config.js, one at a
// time, with the pal's name swapped for "this pal". Tap the pal you think it's about.
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

// Where the pal's name goes: the words "this pal", in plain text, so the
// fact reads as a riddle ("This pal can grow at 42°C"). Capitalized when it
// starts a sentence. fillBlanks() puts her name in once she's been found.
function blank(startsSentence) {
  const gap = document.createElement('span');
  gap.className = 'fact-blank';
  gap.textContent = startsSentence ? 'This pal' : 'this pal';
  return gap;
}

// Text that ends a sentence, so whatever comes next starts a new one.
const SENTENCE_END = /(^|[.!?]["”]?\s+)["“]?$/;

// `fact` as nodes for the page, with other bacteria's names in italics (as
// in the end-of-level pop-up) and every mention of `name` swapped for
// "this pal". Every fact says whose it is (test/facts.test.js checks), so
// there's always at least one. Only whole words count, so Vi's facts leave
// "Vibrio" alone.
export function withBlanks(fact, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const word = new RegExp(`\\b${escaped}\\b`);
  // Her name used as a describing word reads oddly as "this pal": "some
  // Goldie strains" becomes "some strains of this pal", not "some this pal
  // strains".
  const reworded = fact.replace(new RegExp(`\\b${escaped} (strains|cells|types)\\b`, 'g'), `$1 of ${name}`);
  let before = ''; // the fact so far, to tell when a sentence starts
  return withItalics(reworded).flatMap((node) => {
    if (node.nodeType !== Node.TEXT_NODE) {
      before += node.textContent;
      return [node];
    }
    const nodes = [];
    node.textContent.split(word).forEach((part, i) => {
      if (i > 0) nodes.push(blank(SENTENCE_END.test(before)));
      if (part) nodes.push(document.createTextNode(part));
      before += (i > 0 ? name : '') + part;
    });
    return nodes;
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
