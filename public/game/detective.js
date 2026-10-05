// Detective mode (detective.html): a mystery pal, picked at random, and the
// player runs one lab test at a time, answering its question from the result
// and following the dichotomous key in key.js until only one pal is left.
// Each wrong answer costs a star. Once she's named, the whole key is shown,
// numbered the way a textbook prints one, with the path to her highlighted.
//
// Add ?case=vi to the address to pick the mystery pal (for testing).
import { SPECIES } from './config.js';
import { pickFact, writeFact } from './facts.js';
import { speciesName } from './italics.js';
import { couplets, isPal, MAX_STARS, palsUnder, pathTo, starsFor } from './key.js';
import { labView } from './lab.js';
import { PALS, palById, palTile } from './pals.js';

const $ = (selector) => document.querySelector(selector);

const asked = palById(new URLSearchParams(window.location.search).get('case'));
const mystery = asked ?? PALS[Math.floor(Math.random() * PALS.length)];

// Every pal is a suspect, faded out as the key rules her out.
const list = $('.suspects');
for (const pal of PALS) {
  const item = document.createElement('li');
  item.dataset.pal = pal.id;
  const label = document.createElement('span');
  label.className = 'suspect-name';
  label.textContent = pal.name;
  item.append(palTile(pal), label);
  list.append(item);
}
function showSuspects(left) {
  for (const item of list.children) item.classList.toggle('ruled-out', !left.includes(item.dataset.pal));
  $('.suspect-count').textContent = `(${left.length} left)`;
}

const route = pathTo(mystery.id);
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
  document.title = `PetriPals | Detective | It's ${mystery.name}!`;

  const stars = starsFor(wrong);
  const starLine = $('.stars');
  starLine.textContent = '★'.repeat(stars) + '☆'.repeat(MAX_STARS - stars);
  starLine.setAttribute('aria-label', `${stars} of ${MAX_STARS} stars`);
  writeFact($('.fun-fact-text'), pickFact(species.facts));

  $('.key-chart').replaceChildren(...keyChart());
  heading.focus();
}

// The whole key as numbered couplets: 1a and 1b, then 2a and 2b... Each
// answer says which couplet to go to next, or names the pal it ends at.
// The steps and answers on the way to the mystery pal are highlighted.
function keyChart() {
  const numbered = couplets();
  const numberOf = (step) => numbered.find((c) => c.step === step).number;
  const onPath = new Map(route.map(({ step, answer }) => [step, answer]));

  return numbered.map(({ number, step }) => {
    const couplet = document.createElement('li');
    couplet.className = 'couplet';
    couplet.id = `couplet-${number}`;
    couplet.classList.toggle('on-path', onPath.has(step));

    const title = document.createElement('p');
    title.className = 'couplet-step';
    const name = document.createElement('b');
    name.textContent = `${number}. ${step.name}`;
    title.append(name, ` ${step.question}`);

    const leads = document.createElement('ul');
    leads.className = 'leads';
    step.answers.forEach((option, index) => {
      const lead = document.createElement('li');
      lead.className = 'lead';
      const taken = onPath.get(step) === index;
      lead.classList.toggle('on-path', taken);

      const letter = document.createElement('span');
      letter.className = 'lead-letter';
      letter.textContent = `${number}${'ab'[index]}`;
      const label = document.createElement('span');
      label.className = 'lead-label';
      label.textContent = option.label;
      lead.append(letter, label);

      if (isPal(option.next)) {
        const pal = palById(option.next);
        const end = document.createElement('span');
        end.className = 'lead-pal';
        const name = document.createElement('span');
        name.className = 'lead-pal-name';
        name.textContent = pal.name;
        end.append(palTile(pal), name);
        lead.append(end);
      } else {
        const to = document.createElement('a');
        to.className = 'lead-to';
        to.href = `#couplet-${numberOf(option.next)}`;
        to.textContent = `Go to ${numberOf(option.next)}`;
        lead.append(to);
      }
      if (taken) {
        const note = document.createElement('span');
        note.className = 'visually-hidden';
        note.textContent = ' (your path)';
        lead.append(note);
      }
      leads.append(lead);
    });

    couplet.append(title, leads);
    return couplet;
  });
}

document.title = 'PetriPals | Detective';
showSuspects(palsUnder(route[0].step));
showStep();
