// The rival screen before a mixed culture race (choose-rivals.html?pal=mona):
// tap up to MIXED.MAX_RIVALS of the other pals offered (a random 12 once
// there are more than that) to race, or Surprise me for one at random. You can't race yourself, and each rival can only be picked once.
import { MIXED, raceTarget, SPECIES } from './config.js';
import { palById, palTile } from './pals.js';
import { raceAddress, rivalChoices } from './rivals.js';

const id = new URLSearchParams(window.location.search).get('pal');
const pal = palById(id);

if (!pal || !Object.hasOwn(SPECIES, id)) {
  window.location.replace('./pal-picker.html');
} else {
  const picked = [];
  const grid = document.querySelector('.rivals-grid');
  const status = document.querySelector('.rivals-status');
  const start = document.querySelector('.start-race');

  // A button for every other pal (up to MIXED.CHOICES of them).
  const buttons = rivalChoices(id).map((other) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rival-btn';
    button.dataset.pal = other.id;
    button.setAttribute('aria-pressed', 'false');
    const name = document.createElement('span');
    name.className = 'rival-name';
    name.textContent = other.name;
    name.style.color = SPECIES[other.id].color;
    button.append(palTile(other), name);
    button.addEventListener('click', () => toggle(other.id));
    return button;
  });
  grid.append(...buttons);

  function toggle(rival) {
    const at = picked.indexOf(rival);
    if (at >= 0) picked.splice(at, 1);
    else if (picked.length < MIXED.MAX_RIVALS) picked.push(rival);
    update();
  }

  function update() {
    const full = picked.length >= MIXED.MAX_RIVALS;
    for (const button of buttons) {
      const on = picked.includes(button.dataset.pal);
      button.setAttribute('aria-pressed', String(on));
      // Once three are picked, the rest wait until one is let go.
      button.disabled = full && !on;
    }
    start.disabled = picked.length === 0;
    const count = picked.length;
    status.textContent = count === 0
      ? `Pick up to ${MIXED.MAX_RIVALS} rivals.`
      : `${count} ${count === 1 ? 'rival' : 'rivals'} picked: race to ${raceTarget(count)} cells.${full ? " That's a full dish!" : ''}`;
  }

  start.addEventListener('click', () => {
    window.location.href = raceAddress(id, picked);
  });
  document.querySelector('.surprise-me').href = raceAddress(id);
  document.querySelector('.back-link').href = `./choose-mode.html?pal=${id}`;

  // You, on your tile, as on the mode page, and your name in your color.
  document.querySelector('.mode-pal').append(palTile(pal));
  const nameEl = document.querySelector('.mode-pal-name');
  nameEl.textContent = pal.name;
  nameEl.style.color = SPECIES[id].color;
  document.title = `PetriPals | ${pal.name} | Pick Your Rivals`;
  update();
}
