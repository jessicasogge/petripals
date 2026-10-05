// Detective mode (detective.html): a mystery pal, picked at random, and the
// player runs one lab test at a time, answering its question from the result
// and following the dichotomous key in key.js until only one pal is left.
// A wrong answer just asks them to look again. Once she's named, the whole
// key is shown as a tree, branching downward, with the path to her
// highlighted.
//
// Add ?case=vi to the address to pick the mystery pal (for testing).
import { SPECIES } from './config.js';
import { pickFact, writeFact } from './facts.js';
import { speciesName } from './italics.js';
import { isPal, KEY, palsUnder, pathTo } from './key.js';
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
}

const route = pathTo(mystery.id);
let at = 0; // which step of the route she's on

const answers = $('.answers');
const feedback = $('.step-feedback');
const nextButton = $('.next-step');

// Each step shows its test's result straight away, with the two answers
// under it.
function showStep() {
  const { step, answer } = route[at];
  $('.step-name').textContent = step.name;
  $('.step-question').textContent = step.question;
  $('.lab-bench').replaceChildren(labView(step, answer, mystery.id));
  answers.replaceChildren(...step.answers.map((option, index) => answerButton(option.label, index)));
  nextButton.hidden = true;
  feedback.textContent = '';
  feedback.className = 'step-feedback';
}

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

  writeFact($('.fun-fact-text'), pickFact(species.facts));

  $('.key-tree').replaceChildren(branch(KEY, null, true));
  heading.focus();
}

// One branch of the key as a tree: the test (or pal) at `next`, labeled
// with the answer that leads to it, and everything below it. `taken` marks
// the branches on the way to the mystery pal; the line down to her runs past
// the siblings above her, so they're marked too ('trunk-on') and styles.css
// colors that stretch of line.
const takenAt = new Map(route.map(({ step, answer }) => [step, answer]));

function branch(next, answer, taken) {
  const item = document.createElement('li');
  item.className = 'key-node';
  item.classList.toggle('on-path', taken);

  const box = document.createElement('div');
  box.className = isPal(next) ? 'node-box node-pal' : 'node-box';
  if (answer) {
    const label = document.createElement('span');
    label.className = 'node-answer';
    label.textContent = answer;
    box.append(label);
  }
  const name = document.createElement('span');
  name.className = 'node-name';
  if (isPal(next)) {
    const pal = palById(next);
    name.textContent = pal.name;
    box.append(palTile(pal));
  } else {
    name.textContent = next.name;
  }
  box.append(name);
  if (taken) {
    const note = document.createElement('span');
    note.className = 'visually-hidden';
    note.textContent = ' (your path)';
    box.append(note);
  }
  item.append(box);

  if (!isPal(next)) {
    const right = taken ? takenAt.get(next) : -1;
    const children = document.createElement('ul');
    next.answers.forEach((option, index) => {
      const child = branch(option.next, option.label, index === right);
      child.classList.toggle('trunk-on', index < right);
      children.append(child);
    });
    item.append(children);
  }
  return item;
}

document.title = 'PetriPals | Detective';
showSuspects(palsUnder(route[0].step));
showStep();
