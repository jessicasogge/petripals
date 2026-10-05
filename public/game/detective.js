// Detective mode (detective.html?pal=mona): your pal is the detective, and a
// mystery pal, any pal but her, is the case. The player runs one lab test at
// a time and answers its question from the result, following the dichotomous
// key in key.js until only one pal is left. Each wrong answer costs a star.
// Solved pals go in the Pal Book (book.js).
//
// Add &case=vi to the address to pick the mystery pal (for testing).
import { addToBook } from './book.js';
import { SPECIES } from './config.js';
import { pickFact, writeFact } from './facts.js';
import { speciesName } from './italics.js';
import { isPal, MAX_STARS, palsUnder, pathTo, starsFor } from './key.js';
import { labView } from './lab.js';
import { PALS, palById, palTile } from './pals.js';

const $ = (selector) => document.querySelector(selector);

const params = new URLSearchParams(window.location.search);
const detective = palById(params.get('pal'));

if (!detective) {
  window.location.replace('./pal-picker.html');
} else {
  const suspects = PALS.filter((pal) => pal !== detective);
  const asked = suspects.find((pal) => pal.id === params.get('case'));
  const mystery = asked ?? suspects[Math.floor(Math.random() * suspects.length)];
  openCase(detective, mystery, suspects);
}

function openCase(detective, mystery, suspects) {
  document.title = `PetriPals | ${detective.name} | Detective`;
  $('.detective-pal').append(palTile(detective));
  const name = $('.detective-name');
  name.textContent = detective.name;
  name.style.color = SPECIES[detective.id].color;
  $('.next-case').href = `./detective.html?pal=${detective.id}`;
  $('.other-mode').href = `./choose-mode.html?pal=${detective.id}`;

  // Every suspect, faded out as the key rules her out.
  const list = $('.suspects');
  for (const pal of suspects) {
    const item = document.createElement('li');
    item.dataset.pal = pal.id;
    const label = document.createElement('span');
    label.className = 'suspect-name';
    label.textContent = pal.name;
    item.append(palTile(pal), label);
    list.append(item);
  }
  const showSuspects = (left) => {
    for (const item of list.children) item.classList.toggle('ruled-out', !left.includes(item.dataset.pal));
    $('.suspect-count').textContent = `(${suspects.filter((pal) => left.includes(pal.id)).length} left)`;
  };

  const route = pathTo(mystery.id);
  const trail = []; // the answer picked at each step so far
  let wrong = 0;
  let at = 0; // which step of the route she's on

  const runButton = $('.run-test');
  const answers = $('.answers');
  const feedback = $('.step-feedback');
  const nextButton = $('.next-step');

  function showStep() {
    const { step } = route[at];
    $('.step-name').textContent = step.name;
    $('.step-question').textContent = step.question;
    const hint = document.createElement('p');
    hint.className = 'bench-hint';
    hint.textContent = 'The sample is ready.';
    $('.lab-bench').replaceChildren(hint);
    runButton.hidden = false;
    answers.hidden = true;
    nextButton.hidden = true;
    feedback.textContent = '';
    feedback.className = 'step-feedback';
  }

  runButton.addEventListener('click', () => {
    const { step, answer } = route[at];
    $('.lab-bench').replaceChildren(labView(step, answer, mystery.id));
    runButton.hidden = true;
    answers.replaceChildren(...step.answers.map((option, index) => answerButton(option.label, index)));
    answers.hidden = false;
    answers.querySelector('button').focus();
  });

  function answerButton(label, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-btn';
    button.textContent = label;
    button.addEventListener('click', () => pick(index, button));
    return button;
  }

  function pick(index, button) {
    const { step, answer } = route[at];
    if (index !== answer) {
      wrong += 1;
      button.disabled = true;
      button.classList.add('wrong');
      feedback.textContent = 'Not quite. Look at the result again!';
      feedback.className = 'step-feedback try-again';
      return;
    }
    const chosen = step.answers[index];
    trail.push({ step, chosen });
    for (const option of answers.querySelectorAll('button')) option.disabled = true;
    button.classList.add('right');
    feedback.textContent = `Yes! ${step.why}`;
    feedback.className = 'step-feedback correct';

    const item = document.createElement('li');
    item.textContent = `${step.name}: ${chosen.label}`;
    $('.trail').append(item);
    showSuspects(palsUnder(chosen.next));

    nextButton.textContent = isPal(chosen.next) ? 'Solve the case' : 'Next test';
    nextButton.hidden = false;
    nextButton.focus();
  }

  nextButton.addEventListener('click', () => {
    at += 1;
    if (at < route.length) {
      showStep();
      $('.step-name').focus();
    } else {
      solve();
    }
  });

  function solve() {
    $('.case').hidden = true;
    $('.solved').hidden = false;
    const species = SPECIES[mystery.id];
    $('.solved-pal').append(palTile(mystery));
    const heading = $('.solved-name');
    heading.textContent = `It's ${mystery.name}!`;
    heading.style.color = species.color;
    $('.solved-species').replaceChildren(...speciesName(species.scientific));
    document.title = `PetriPals | ${detective.name} | Case solved`;

    const stars = starsFor(wrong);
    const starLine = $('.stars');
    starLine.textContent = '★'.repeat(stars) + '☆'.repeat(MAX_STARS - stars);
    starLine.setAttribute('aria-label', `${stars} of ${MAX_STARS} stars`);

    $('.recap').replaceChildren(...trail.map(({ step, chosen }) => {
      const item = document.createElement('li');
      item.textContent = `${step.name}: ${chosen.label}`;
      return item;
    }));
    writeFact($('.fun-fact-text'), pickFact(species.facts));

    const book = addToBook(mystery.id);
    $('.book-count').textContent = `(${book.length} of ${PALS.length} found)`;
    $('.pal-book').replaceChildren(...PALS.map((pal) => {
      const page = document.createElement('li');
      if (book.includes(pal.id)) {
        const label = document.createElement('span');
        label.textContent = pal.name;
        page.append(palTile(pal), label);
      } else {
        page.className = 'unfound';
        page.textContent = '?';
        page.setAttribute('aria-label', 'Not found yet');
      }
      return page;
    }));
    heading.focus();
  }

  showSuspects(palsUnder(route[0].step));
  showStep();
}
