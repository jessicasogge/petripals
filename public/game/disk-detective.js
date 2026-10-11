// Disk Detective: name the antibiotic from a fact, then learn how it works
import { SPECIES } from './config.js';
import { capitalized, choicesFor, drugDeck, DRUGS, palsFor, TARGETS, withArticle } from './drugs.js';
import { fillBlanks, withBlanks } from './guess.js';
import { withItalics } from './italics.js';
import { pageReady, watchLoading } from './loading.js';

// "Growing the colony…" while the next screen loads.
watchLoading();

const factEl = document.querySelector('.guess-fact');
const status = document.querySelector('.guess-status');
const next = document.querySelector('.next-fact');
const grid = document.querySelector('.drug-grid');
const card = document.querySelector('.drug-card');
const counter = document.querySelector('.guess-counter');
const ASK = 'Which antibiotic is this fact about? Tap its disk!';
const TEAL = '#0f766e'; // the drug's name, once it's found

// A paper disk with the drug's code on it, like the ones in the dish.
function disk(code) {
  const el = document.createElement('span');
  el.className = 'drug-disk';
  el.setAttribute('aria-hidden', 'true');
  el.textContent = code;
  return el;
}

// Its button: the disk, with the drug's name under it.
function choiceButton(code) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'rival-btn guess-btn drug-btn';
  button.dataset.drug = code;
  const name = document.createElement('span');
  name.textContent = capitalized(DRUGS[code].name);
  button.append(disk(code), name);
  button.addEventListener('click', () => guess(code, button));
  return button;
}

// The pals' names, each in her own color: "Mona, Vi and Goldie".
function palNames(pals) {
  const nodes = [];
  pals.forEach((pal, i) => {
    if (i > 0) nodes.push(i === pals.length - 1 ? ' and ' : ', ');
    const name = document.createElement('strong');
    name.textContent = pal.name;
    name.style.color = SPECIES[pal.id].color;
    nodes.push(name);
  });
  return nodes;
}

// What you learn once you've found it: its family, how it works, and whose
// dishes it's in when you play Classic.
function showCard(code) {
  const drug = DRUGS[code];
  const heading = document.createElement('h2');
  heading.append(disk(code), capitalized(drug.name));
  const family = document.createElement('p');
  family.className = 'drug-family';
  family.textContent = `${withArticle(drug.family)}. It ${TARGETS[drug.target].does}.`;
  const works = document.createElement('p');
  works.textContent = `How it works: ${drug.works}`;
  const dishes = document.createElement('p');
  dishes.append('Find its disk in Classic mode with ', ...palNames(palsFor(code)), '.');
  card.replaceChildren(heading, family, works, dishes);
  card.hidden = false;
}

let deck = [];
let total = 0;
let current = null;
let buttons = [];

function showNext() {
  // Through every fact once, then shuffle them all again.
  if (deck.length === 0) {
    deck = drugDeck();
    total = deck.length;
  }
  current = deck.pop();
  // How far through the facts you are (2 / 75), not a score.
  counter.textContent = `Fact ${total - deck.length} of ${total}`;
  factEl.replaceChildren(...withBlanks(current.fact, DRUGS[current.code].name, { noun: 'drug', ignoreCase: true }));
  buttons = choicesFor(current.code).map(choiceButton);
  grid.replaceChildren(...buttons);
  status.textContent = ASK;
  card.hidden = true;
  next.hidden = true;
}

function guess(code, button) {
  const drug = DRUGS[code];
  if (code !== current.code) {
    // A wrong guess still teaches something: what that drug goes after.
    status.textContent = `Not ${drug.name}: it ${TARGETS[drug.target].does}. Try again!`;
    button.disabled = true;
    return;
  }
  fillBlanks(factEl, drug.name, TEAL);
  button.classList.add('right');
  for (const other of buttons) other.disabled = other !== button;
  status.textContent = `Yes! It’s ${drug.name}.`;
  showCard(code);
  next.hidden = false;
  next.focus();
}

// The guide at the bottom: every disk, grouped by what it attacks.
function fillGuide() {
  const guide = document.querySelector('.drug-guide-list');
  for (const [target, { title: heading }] of Object.entries(TARGETS)) {
    const title = document.createElement('h3');
    title.textContent = heading;
    const list = document.createElement('ul');
    for (const [code, drug] of Object.entries(DRUGS)) {
      if (drug.target !== target) continue;
      const item = document.createElement('li');
      const name = document.createElement('strong');
      name.textContent = capitalized(drug.name);
      const about = document.createElement('span');
      about.append(name, ` (${drug.family}): `, ...withItalics(drug.works));
      item.append(disk(code), about);
      list.append(item);
    }
    guide.append(title, list);
  }
}

next.addEventListener('click', showNext);
fillGuide();
showNext();

// All filled in: take the loading card away.
pageReady();
