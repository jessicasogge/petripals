// "Did you know?" facts on the end-of-level pop-up, win or lose: a random fact about your pal from
// her `facts` in config.js, never the same one twice in a row.

// A random fact from `facts`, avoiding `last` if there's any other choice.
export function pickFact(facts = [], last = null, random = Math.random) {
  const choices = facts.length > 1 ? facts.filter((f) => f !== last) : facts;
  if (choices.length === 0) return null;
  return choices[Math.floor(random() * choices.length)];
}

// Show a random fact about `pal` (her key, e.g. "mona") in the pop-up, or
// hide the fact line if `species` has none. Remembers the fact for the rest
// of the visit, since every level loads a fresh page.
export function showFact(pal, species) {
  const line = document.querySelector('.fun-fact');
  if (!line) return;
  const key = `petripals-last-fact-${pal}`;
  let last = null;
  try {
    last = sessionStorage.getItem(key);
  } catch {
    // No storage (private browsing, etc.): repeats are possible, that's all.
  }
  const fact = pickFact(species.facts, last);
  if (!fact) {
    line.hidden = true;
    return;
  }
  line.querySelector('.fun-fact-text').textContent = fact;
  line.hidden = false;
  try {
    sessionStorage.setItem(key, fact);
  } catch {
    // See above.
  }
}

// Hide the fact line (e.g. on a game over).
export function hideFact() {
  const line = document.querySelector('.fun-fact');
  if (line) line.hidden = true;
}
