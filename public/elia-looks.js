// Elia turns her head to look at the mouse pointer.
//
// Her head is drawn as two groups marked .elia-head (its dark outline, then
// its fill, highlight and face, each in its own spot among her body layers).
// Both swing around her neck toward the pointer, up to MAX_TURN degrees up or
// down, and her face slides a little inside her head so her eyes look right
// at it. She eases there smoothly, and back to facing forward when the
// pointer leaves the page.

const NECK = [160, 100]; // where her head meets her body, in drawing units
const MAX_TURN = 40; // degrees
const MAX_LOOK = 2.5; // how far her face slides toward the pointer
const EASE = 0.15; // how much of the way she turns each frame

// Where Elia's head should point for a pointer at (dx, dy) from her neck,
// in drawing units (y points down): the turn in degrees (negative is up),
// and how far to slide her face [x, y], measured along her turned head.
export function headPose(dx, dy) {
  if (dx === 0 && dy === 0) return { turn: 0, look: [0, 0] };
  const toward = (Math.atan2(dy, dx) * 180) / Math.PI;
  const turn = Math.max(-MAX_TURN, Math.min(MAX_TURN, toward));
  // Turn the direction into the head's own frame, then slide that way.
  const rest = ((toward - turn) * Math.PI) / 180;
  const length = Math.min(1, Math.hypot(dx, dy) / 40);
  return { turn, look: [Math.cos(rest) * MAX_LOOK * length, Math.sin(rest) * MAX_LOOK * length] };
}

function follow(svg) {
  const heads = svg.querySelectorAll('.elia-head');
  const face = svg.querySelector('.elia-head .face');
  const now = { turn: 0, look: [0, 0] };
  let target = { turn: 0, look: [0, 0] };
  let moving = false;

  function draw() {
    now.turn += (target.turn - now.turn) * EASE;
    now.look[0] += (target.look[0] - now.look[0]) * EASE;
    now.look[1] += (target.look[1] - now.look[1]) * EASE;
    for (const head of heads) head.setAttribute('transform', `rotate(${now.turn} ${NECK[0]} ${NECK[1]})`);
    if (face) face.setAttribute('transform', `translate(${now.look[0]} ${now.look[1]})`);
    const settled = Math.abs(target.turn - now.turn) < 0.05 &&
      Math.hypot(target.look[0] - now.look[0], target.look[1] - now.look[1]) < 0.01;
    moving = !settled;
    if (moving) requestAnimationFrame(draw);
  }
  function aim(next) {
    target = next;
    if (!moving) {
      moving = true;
      requestAnimationFrame(draw);
    }
  }

  window.addEventListener('pointermove', (event) => {
    const matrix = svg.getScreenCTM();
    if (!matrix) return; // not on screen
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    aim(headPose(point.x - NECK[0], point.y - NECK[1]));
  });
  document.documentElement.addEventListener('pointerleave', () => aim({ turn: 0, look: [0, 0] }));
}

if (typeof document !== 'undefined') {
  const svgs = new Set([...document.querySelectorAll('.elia-head')].map((head) => head.ownerSVGElement));
  for (const svg of svgs) follow(svg);
}

export { MAX_LOOK, MAX_TURN, NECK };
