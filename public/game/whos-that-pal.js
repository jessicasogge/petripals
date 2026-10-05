// Quiz: identify each pal from a fact
import { SPECIES } from './config.js';
import { factDeck, fillBlanks, withBlanks } from './guess.js';
import { shortSpeciesName, speciesName } from './italics.js';
import { pageReady, watchLoading } from './loading.js';
import { PALS, palTile } from './pals.js';
import { QUIZ_FACTS } from './quiz-facts.js';

// "Growing the colony…" while the next screen loads.
watchLoading();

const factEl = document.querySelector('.guess-fact');
const status = document.querySelector('.guess-status');
const next = document.querySelector('.next-fact');
const ASK = 'Who is this fact about? Tap her!';

// Every pal, in the same order every time, so it's easy to find her again.
const buttons = PALS.map((pal) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'rival-btn guess-btn';
  button.dataset.pal = pal.id;
  const name = document.createElement('span');
  name.textContent = pal.name;
  name.style.color = SPECIES[pal.id].color;
  // Her species, shortened (P. aeruginosa), so facts about it can help too.
  const species = document.createElement('span');
  species.className = 'guess-species';
  species.append(...shortSpeciesName(SPECIES[pal.id].scientific));
  button.append(palTile(pal), name, species);
  button.addEventListener('click', () => guess(pal, button));
  return button;
});
document.querySelector('.guess-grid').append(...buttons);

const counter = document.querySelector('.guess-counter');
let deck = [];
let total = 0;
let current = null;

function showNext() {
  // Through every fact once, then shuffle them all again and count from 1.
  if (deck.length === 0) {
    deck = factDeck(PALS, QUIZ_FACTS);
    total = deck.length;
  }
  current = deck.pop();
  // How far through the facts you are (2 / 88), not a score.
  counter.textContent = `${total - deck.length} / ${total}`;
  factEl.replaceChildren(...withBlanks(current.fact, current.pal.name));
  status.textContent = ASK;
  next.hidden = true;
  for (const button of buttons) {
    button.disabled = false;
    button.classList.remove('right');
  }
}

function guess(pal, button) {
  if (pal.id !== current.pal.id) {
    status.textContent = `Not ${pal.name}. Try again!`;
    button.disabled = true;
    return;
  }
  
  fillBlanks(factEl, pal.name, SPECIES[pal.id].color);
  button.classList.add('right');
  for (const other of buttons) other.disabled = other !== button;
  status.replaceChildren(`Yes! It's ${pal.name}, `, ...speciesName(SPECIES[pal.id].scientific), '.');
  next.hidden = false;
  next.focus();
}

next.addEventListener('click', showNext);
showNext();

// All filled in: take the loading card away.
pageReady();
