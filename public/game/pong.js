// Phage Pong: Pong in a round dish. You and a rival pal steered by the
// computer each lie along your own side of the rim, you on the left and her
// on the right, and slide round it to bat a phage back and forth across the
// agar. Let the phage past you to the rim and she scores; the first to
// PONG.TARGET wins. The rim at the top and bottom is nobody's, and the phage
// bounces off it. Each hit speeds the phage up, and where on her it hits
// sends it off at an angle, like the paddles in Pong.
//
// Made up for the game: real bacteria can't bat phages away. They fight them
// off other ways, like CRISPR, which chops up a phage's DNA.
import { showPop } from './colony.js';
import { PONG } from './config.js';
import { showFact } from './facts.js';
import { arrowKeys } from './keyboard.js';
import { goTo } from './loading.js';
import { phageDrawing } from './phage.js';
import { sporeBurst } from './spores.js';
import { touchSteering } from './touch.js';
import { track } from './track.js';

// The middle of each side, as an angle round the dish (0 is straight right
// and π straight left; screen y runs down, so angles turn clockwise).
export const SIDES = { you: Math.PI, rival: 0 };

// `angle` turned to between -π and π, so two angles can be compared.
export const wrap = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));

const clamp = (n, most) => Math.max(-most, Math.min(most, n));

// Where a pal is, as fractions of the dish radius from the center, when she
// has slid `slide` radians round from the middle of her side.
export function palSpot(side, slide) {
  const angle = SIDES[side] + slide;
  return [PONG.RING * Math.cos(angle), PONG.RING * Math.sin(angle)];
}

// `slide` moved toward `target` by at most `most`, and kept on her side.
export function slideToward(slide, target, most) {
  return clamp(slide + clamp(target - slide, most), PONG.SPAN);
}

// Whether the phage `ball` ({ fx, fy, vx, vy }, in fractions of the dish
// radius) hits the pal on `side`, slid `slide` round. She lies along the rim,
// so the part that hits is a short bar along it, PONG.REACH either way from
// her middle and PONG.THICK in and out. Only a phage heading out toward the
// rim counts, so one she just hit can't hit her again on its way back.
// Returns how far up her it hit, from -1 at her bottom end to 1 at her top
// end, or null if it missed her.
export function hitSpot(side, slide, ball) {
  const angle = SIDES[side] + slide;
  const [ox, oy] = [Math.cos(angle), Math.sin(angle)]; // out toward the rim
  if (ball.vx * ox + ball.vy * oy <= 0) return null;
  const [tx, ty] = [-oy, ox]; // along her: up the screen on the left, down it on the right
  const [px, py] = palSpot(side, slide);
  const [dx, dy] = [ball.fx - px, ball.fy - py];
  const along = clamp(dx * tx + dy * ty, PONG.REACH);
  if (Math.hypot(dx - along * tx, dy - along * ty) > PONG.THICK + PONG.BALL) return null;
  return (along / PONG.REACH) * (side === 'you' ? 1 : -1);
}

// Which way the phage heads after hitting the pal on `side` `up` of the way
// up her (from hitSpot): straight across off her middle, and further up or
// down the nearer it hit her top or bottom end.
export function returnHeading(side, up) {
  return side === 'you' ? -PONG.DEFLECT * up : Math.PI + PONG.DEFLECT * up;
}

// Whose rim the phage reached at `angle`: 'you' or 'rival', or null for the
// top or bottom, where it bounces.
export function rimOwner(angle) {
  return Object.keys(SIDES).find((side) => Math.abs(wrap(angle - SIDES[side])) <= PONG.GOAL) ?? null;
}

// Turns `ball` to head at most PONG.TILT off straight across, the way it's
// already going, at the same speed.
export function steady(ball) {
  const speed = Math.hypot(ball.vx, ball.vy);
  const across = ball.vx < 0 ? Math.PI : 0;
  const heading = across + clamp(wrap(Math.atan2(ball.vy, ball.vx) - across), PONG.TILT);
  ball.vx = speed * Math.cos(heading);
  ball.vy = speed * Math.sin(heading);
}

// Bounces `ball`, which has reached the rim, back off it like a mirror, and
// puts it back just inside.
export function bounce(ball) {
  const out = Math.hypot(ball.fx, ball.fy);
  const [nx, ny] = [ball.fx / out, ball.fy / out];
  const toward = ball.vx * nx + ball.vy * ny;
  if (toward > 0) {
    ball.vx -= 2 * toward * nx;
    ball.vy -= 2 * toward * ny;
  }
  const inside = PONG.RIM - PONG.BALL;
  ball.fx = nx * inside;
  ball.fy = ny * inside;
  steady(ball);
}

// Where the rival slides to: where the phage will reach her, `miss` radians
// off, once it's heading her way and past the middle; back to the middle of
// her side until then. She only looks along the phage's path, not at bounces
// off the top and bottom, so a bounce can still catch her out.
export function rivalTarget(ball, miss = 0) {
  if (ball.vx <= 0 || ball.fx < 0) return 0;
  // How long until the phage is PONG.RING from the center: solve
  // |position + t * velocity| = RING for t.
  const a = ball.vx ** 2 + ball.vy ** 2;
  const b = 2 * (ball.fx * ball.vx + ball.fy * ball.vy);
  const c = ball.fx ** 2 + ball.fy ** 2 - PONG.RING ** 2;
  const t = (-b + Math.sqrt(Math.max(0, b * b - 4 * a * c))) / (2 * a);
  const angle = Math.atan2(ball.fy + t * ball.vy, ball.fx + t * ball.vx);
  return clamp(wrap(angle - SIDES.rival) + miss, PONG.SPAN);
}

// `you` and `rival` are { svg, species }: each pal's drawing on the page
// and settings from config.js. `random` returns 0 to 1, for the tests.
// Returns the phage, the pals and the score, for the tests.
export function playPong({ you, rival, random = Math.random }) {
  const agar = document.querySelector('.agar');
  const counter = document.querySelector('.cell-count');
  const dishRadius = () => agar.clientWidth / 2;
  const pal = you.svg.dataset.pal;
  const name = you.svg.dataset.name;
  const rivalName = rival.svg.dataset.name;

  // Your pal, in the page's pal holder, and a copy of the rival's drawing in
  // a holder of its own, as in Mixed Culture. Both are drawn the same size,
  // so neither has a bigger paddle.
  const yourMover = document.querySelector('.pal-mover');
  yourMover.classList.add('player');
  const rivalSvg = rival.svg.cloneNode(true);
  rivalSvg.removeAttribute('hidden');
  rivalSvg.setAttribute('aria-label', `${rivalName}, your rival`);
  const rivalMover = document.createElement('div');
  rivalMover.className = 'pal-mover rival';
  rivalMover.appendChild(rivalSvg);
  agar.appendChild(rivalMover);
  const pals = {
    you: { mover: yourMover, slide: 0, name, color: you.species.color },
    rival: { mover: rivalMover, slide: 0, name: rivalName, color: rival.species.color },
  };
  // Under each pal, a soft bar in her color the size of the part of her
  // that hits the phage (see hitSpot), since some pals are drawn shorter or
  // thinner than that.
  for (const one of Object.values(pals)) {
    one.mover.style.width = `${PONG.PADDLE}%`;
    one.bar = document.createElement('div');
    one.bar.className = 'pong-bar';
    one.bar.setAttribute('aria-hidden', 'true');
    one.bar.style.width = `${PONG.REACH * 100}%`;
    one.bar.style.height = `${PONG.THICK * 100}%`;
    one.bar.style.background = one.color;
    agar.appendChild(one.bar);
  }

  // The phage, hidden between points.
  const phage = document.createElement('div');
  phage.className = 'phage pong-phage';
  phage.hidden = true;
  phage.appendChild(phageDrawing());
  agar.appendChild(phage);
  const ball = { fx: 0, fy: 0, vx: 0, vy: 0 };

  const score = { you: 0, rival: 0 };
  let serveIn = PONG.SERVE_MS; // ms until the next serve, or 0 while the phage is in play
  let serveTo = 'rival'; // the first serve goes to the rival, so you get a look at it; after that, to whoever missed
  let miss = 0; // how far off the rival is aiming this time
  let finished = false;
  let lastTime = null;
  const keys = arrowKeys();
  const touch = touchSteering(agar, agar.closest('.petri-dish') ?? agar);

  // The pop-up's buttons: play the same rival again, a new random one, or
  // go back to the modes.
  const rivalId = rival.svg.dataset.pal;
  document.querySelector('.play-again').addEventListener('click', () => {
    goTo(`./petri-dish.html?pal=${pal}&mode=pong&rival=${rivalId}`);
  });
  document.querySelector('.start-over').addEventListener('click', () => {
    goTo(`./petri-dish.html?pal=${pal}&mode=pong`);
  });
  document.querySelector('.back-to-modes').addEventListener('click', () => goTo(`./choose-mode.html?pal=${pal}`));

  function updateCounter() {
    counter.replaceChildren(tally(pals.you, score.you), ' · ', tally(pals.rival, score.rival), ` · first to ${PONG.TARGET}`);
  }

  // Each pal lies along the rim with her top toward the middle of the dish.
  function placePal(side, radius) {
    const [fx, fy] = palSpot(side, pals[side].slide);
    const turn = ((SIDES[side] + pals[side].slide) * 180) / Math.PI - 90;
    pals[side].mover.style.transform = `translate(${round(fx * radius)}px, ${round(fy * radius)}px) rotate(${round(turn)}deg)`;
    const { bar } = pals[side];
    bar.style.left = `${50 + fx * 50}%`;
    bar.style.top = `${50 + fy * 50}%`;
    bar.style.setProperty('--turn', `${round(turn)}deg`);
  }

  function placeBall() {
    phage.style.left = `${50 + ball.fx * 50}%`;
    phage.style.top = `${50 + ball.fy * 50}%`;
    // Drawn tail down: turn it so the tail leads.
    phage.style.setProperty('--turn', `${(Math.atan2(ball.vy, ball.vx) * 180) / Math.PI - 90}deg`);
  }

  // The arrow keys slide you round the rim the way they point (up and down
  // on your side); a finger drags you as far round as it moves; a mouse held
  // down pulls you toward it.
  function moveYou(seconds, radius) {
    const most = PONG.YOUR_SPEED * seconds;
    const angle = SIDES.you + pals.you.slide;
    const [tx, ty] = [-Math.sin(angle), Math.cos(angle)]; // the way that slides her round
    const [dx, dy] = keys.direction();
    const dragged = touch.drag();
    const finger = touch.target();
    let target = pals.you.slide;
    let step = most;
    if (dx !== 0 || dy !== 0) {
      target += ((dx * tx + dy * ty) / Math.hypot(dx, dy)) * most;
    } else if ((dragged[0] !== 0 || dragged[1] !== 0) && radius > 0) {
      target += (dragged[0] * tx + dragged[1] * ty) / (PONG.RING * radius);
      step = PONG.DRAG_SPEED * seconds;
    } else if (finger) {
      target = wrap(Math.atan2(finger[1], finger[0]) - SIDES.you);
    }
    pals.you.slide = slideToward(pals.you.slide, target, step);
  }

  function serve() {
    const heading = SIDES[serveTo] + (random() - 0.5) * PONG.SERVE_TILT;
    Object.assign(ball, { fx: 0, fy: 0, vx: PONG.SPEED * Math.cos(heading), vy: PONG.SPEED * Math.sin(heading) });
    miss = (random() * 2 - 1) * PONG.RIVAL_MISS;
    phage.hidden = false;
  }

  function moveBall(seconds, radius) {
    ball.fx += ball.vx * seconds;
    ball.fy += ball.vy * seconds;
    for (const side of Object.keys(SIDES)) {
      const up = hitSpot(side, pals[side].slide, ball);
      if (up === null) continue;
      const speed = Math.min(PONG.MAX_SPEED, Math.hypot(ball.vx, ball.vy) * PONG.SPEEDUP);
      const heading = returnHeading(side, up);
      ball.vx = speed * Math.cos(heading);
      ball.vy = speed * Math.sin(heading);
      // The rival lines up her next shot a little differently each time.
      if (side === 'you') miss = (random() * 2 - 1) * PONG.RIVAL_MISS;
    }
    if (Math.hypot(ball.fx, ball.fy) < PONG.RIM - PONG.BALL) return;
    const owner = rimOwner(Math.atan2(ball.fy, ball.fx));
    if (owner) point(owner, radius);
    else bounce(ball);
  }

  // The phage got past the pal on `missed` and reached her rim.
  function point(missed, radius) {
    const scorer = missed === 'you' ? 'rival' : 'you';
    score[scorer]++;
    showPop(agar, [ball.fx * radius, ball.fy * radius, 2 * PONG.BALL * radius], pals[missed].color);
    phage.hidden = true;
    updateCounter();
    if (score[scorer] >= PONG.TARGET) {
      finish(scorer);
    } else {
      serveIn = PONG.SERVE_MS;
      serveTo = missed;
    }
  }

  function step(time) {
    const seconds = lastTime === null ? 0 : Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    const radius = dishRadius();

    if (!finished) {
      moveYou(seconds, radius);
      // Between points the rival heads back to the middle.
      const target = serveIn > 0 ? 0 : rivalTarget(ball, miss);
      pals.rival.slide = slideToward(pals.rival.slide, target, PONG.RIVAL_SPEED * seconds);
      if (serveIn > 0) {
        serveIn -= seconds * 1000;
        if (serveIn <= 0) {
          serveIn = 0;
          serve();
        }
      } else {
        moveBall(seconds, radius);
      }
    }

    placePal('you', radius);
    placePal('rival', radius);
    placeBall();
    requestAnimationFrame(step);
  }

  function finish(winner) {
    finished = true;
    keys.stop();
    touch.stop();
    const won = winner === 'you';
    sporeBurst(pals[winner].mover);
    pals[won ? 'rival' : 'you'].mover.classList.add('killed');
    track(`pong/${won ? 'won' : 'lost'}/${pal}/vs-${rivalId}`,
      `${name} ${won ? 'beat' : 'lost to'} ${rivalName} in Phage Pong`);
    setTimeout(() => {
      showFact(pal, you.species);
      if (won) {
        showBanner('You won!', `You beat ${rivalName}, ${score.you} to ${score.rival}!`);
      } else {
        showBanner(`${rivalName} won!`,
          `${rivalName} beat you, ${score.rival} to ${score.you}. The phage got past ${name} ${score.rival} times!`);
      }
    }, 600);
  }

  function showBanner(title, message) {
    const banner = document.querySelector('.win-banner');
    banner.querySelector('h2').textContent = title;
    banner.querySelector('.win-message').textContent = message;
    banner.querySelector('.play-again').textContent = 'Play again';
    const newRival = banner.querySelector('.start-over');
    newRival.textContent = 'New rival';
    newRival.hidden = false;
    banner.querySelector('.back-to-modes').hidden = false;
    banner.removeAttribute('hidden');
    banner.querySelector('.play-again').focus();
  }

  updateCounter();
  requestAnimationFrame(step);
  return { ball, pals, score };
}

// Rounded to a hundredth, so the styles stay short and tidy.
const round = (n) => Math.round(n * 100) / 100 || 0;

// "Mona 3", with the name in the pal's color.
function tally({ name, color }, points) {
  const span = document.createElement('span');
  const strong = document.createElement('span');
  strong.textContent = name;
  strong.style.color = color;
  span.append(strong, ` ${points}`);
  return span;
}
