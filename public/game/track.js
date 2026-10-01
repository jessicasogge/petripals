// Count game events on GoatCounter (petripals.goatcounter.com), alongside
// the page visits its script counts on its own. Each event shows up on the
// dashboard like a page, e.g. "level-complete/mona/level-3" or, in mixed
// culture, "mixed/won/mona/vs-vi". No cookies and
// nothing personal is sent. If the script didn't load (an ad blocker, or
// playing offline), this quietly does nothing; GoatCounter also skips
// localhost, so playing locally isn't counted.
export function track(name, title = name) {
  try {
    window.goatcounter?.count?.({ path: name, title, event: true });
  } catch {
    // Counting is never worth breaking the game over.
  }
}
