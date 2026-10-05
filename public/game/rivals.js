// Who's in the dish with you in mixed culture mode. The rivals ride along in
// the address, so a race can be shared or played again:
//   petri-dish.html?pal=mona&mode=mixed&rivals=vi,elia   Mona vs. Vi and Elia
//   petri-dish.html?pal=mona&mode=mixed                  Mona vs. one random pal
import { MIXED, SPECIES } from './config.js';

// The rivals named in `text` ("vi,elia"): real pals only, never `you`, each
// once, and no more than MIXED.MAX_RIVALS. If that leaves nobody, one random
// pal instead (that's what Surprise me does).
export function rivalsFor(you, text, random = Math.random) {
  const asked = (text ?? '').split(',').filter((id) => Object.hasOwn(SPECIES, id) && id !== you);
  const rivals = [...new Set(asked)].slice(0, MIXED.MAX_RIVALS);
  if (rivals.length > 0) return rivals;
  const others = Object.keys(SPECIES).filter((id) => id !== you);
  return [others[Math.floor(random() * others.length)]];
}

// The address of a race between `you` and `rivals` (none: a random one).
export function raceAddress(you, rivals = []) {
  const address = `./petri-dish.html?pal=${you}&mode=mixed`;
  return rivals.length ? `${address}&rivals=${rivals.join(',')}` : address;
}

// "Vi", "Vi and Elia", "Vi, Elia and Ceres".
export function listOf(names) {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}
