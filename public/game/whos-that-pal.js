// Quiz: identify each pal from a fact
import { SPECIES } from './config.js';
import { factDeck, fillBlanks, quizPals, roundSize, withBlanks } from './guess.js';
import { shortSpeciesName, speciesName } from './italics.js';
import { pageReady, watchLoading } from './loading.js';
import { PALS, palTile } from './pals.js';
import { QUIZ_FACTS } from './quiz-facts.js';
import { track } from './track.js';

// "Growing the colony…" while the next screen loads.
watchLoading();

const factEl = document.querySelector('.guess-fact');
const status = document.querySelector('.guess-status');
const next = document.querySelector('.next-fact');
const ASK = 'Who is this fact about? Tap her!';

// Her button: her picture, name and species.
function guessButton(pal) {
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
}

const grid = document.querySelector('.guess-grid');
let buttons = [];

const counter = document.querySelector('.guess-counter');
let deck = [];
let total = 0;
let current = null;

// A round: 12 random pals (9 on a phone), in their usual order so each is
// easy to find, and every quiz fact about them, shuffled.
function startRound() {
  const pals = quizPals(PALS, roundSize());
  buttons = pals.map(guessButton);
  grid.replaceChildren(...buttons);
  deck = factDeck(pals, QUIZ_FACTS);
  total = deck.length;
}

// Whether this fact has already been missed, so one fact counts once
// however many wrong guesses it takes.
let missed = false;

function showNext() {
  // Through every fact about this round's pals once, then a new round
  // picked at random again, counting from 1.
  if (deck.length === 0) startRound();
  current = deck.pop();
  missed = false;
  // Counted against the pal the fact is about, so asked and missed together
  // show which facts don't point clearly to one pal (see game/track.js).
  track(`quiz/asked/${current.pal.id}`, `${current.pal.name}'s fact was asked`);
  // How far through the facts you are (2 / 88), not a score.
  counter.textContent = `Fact ${total - deck.length} of ${total}`;
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
    if (!missed) {
      missed = true;
      track(`quiz/missed/${current.pal.id}`, `${current.pal.name}'s fact was missed`);
    }
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
