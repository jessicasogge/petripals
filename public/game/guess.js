// Who’s That Pal? (whos-that-pal.html): fun facts from quiz-facts.js

import { withItalics } from './italics.js';
import { inRandomOrder } from './pals.js';

// How many pals each round of the quiz uses.
export const ROUND_SIZE = 9;

// A random `count` of `pals` for one round, kept in their usual order so
// each is easy to find.
export function quizPals(pals, count = ROUND_SIZE, random = Math.random) {
  const picked = new Set(inRandomOrder(pals, random).slice(0, count));
  return pals.filter((pal) => picked.has(pal));
}

// Shuffled { pal, fact } pairs
export function factDeck(pals, facts, random = Math.random) {
  const deck = pals.flatMap((pal) => facts[pal.id].map((fact) => ({ pal, fact })));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Placeholder for the pal's name
function blank(startsSentence) {
  const gap = document.createElement('span');
  gap.className = 'fact-blank';
  gap.textContent = startsSentence ? 'This pal' : 'this pal';
  return gap;
}

const SENTENCE_END = /(^|[.!?]["”]?\s+)["“]?$/;

// Format fact text with name blanks and italics
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

export function fillBlanks(element, name, color) {
  for (const gap of element.querySelectorAll('.fact-blank')) {
    gap.classList.add('filled');
    gap.style.color = color;
    gap.textContent = name;
  }
}
