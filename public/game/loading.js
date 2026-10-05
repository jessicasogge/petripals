// The small "Growing the colony…" card that shows while the next screen
// loads, so a tap on a slow connection doesn't look like it did nothing.
// It fades in after a moment (see .loading-overlay in styles.css), so on a
// fast connection the next page usually arrives before it's ever seen.
//
// Every page calls watchLoading() once: it shows the card when you follow a
// link to another PetriPals page. Buttons that change pages in code use
// goTo(address) instead of setting window.location.href themselves.
//
// The pages a script fills in (the picker, the mode and rival screens, the
// dish) also start with the card already in their HTML, covering the page
// (class "arriving"), so you never see them half built: no pal cards yet,
// both pager buttons showing. Their script calls pageReady() once the page
// is filled in.

export const LOADING_TEXT = 'Growing the colony…';

let overlay = null;

// The card: a little cell dividing in two, and the words.
function makeOverlay() {
  const el = document.createElement('div');
  el.className = 'loading-overlay';
  el.hidden = true;

  const card = document.createElement('div');
  card.className = 'loading-card';
  // A status, so a screen reader says it, too.
  card.setAttribute('role', 'status');

  const cells = document.createElement('span');
  cells.className = 'loading-cells';
  cells.setAttribute('aria-hidden', 'true');
  cells.append(document.createElement('span'), document.createElement('span'));

  const text = document.createElement('span');
  text.className = 'loading-text';
  text.textContent = LOADING_TEXT;

  card.append(cells, text);
  el.append(card);
  return el;
}

// The card on this page, if there is one yet: the one made earlier, or the
// one the page started with.
function current() {
  if (!overlay || !overlay.isConnected) overlay = document.querySelector('.loading-overlay');
  return overlay;
}

export function showLoading() {
  if (!current()) {
    overlay = makeOverlay();
    document.body.append(overlay);
  }
  overlay.hidden = false;
  return overlay;
}

export function hideLoading() {
  if (!current()) return;
  overlay.hidden = true;
  // From here on it's only shown on the way out, see-through.
  overlay.classList.remove('arriving');
}

// The page is filled in: take away the card it started with.
export const pageReady = hideLoading;

// Show the card, then go.
export function goTo(address) {
  showLoading();
  window.location.href = address;
}

// Show the card for clicks on links to another PetriPals page, and hide it
// again if the browser's Back button brings this page back exactly as it
// was left (card and all).
export function watchLoading(root = document) {
  root.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href]');
    if (link && leavesForAnotherPage(event, link)) showLoading();
  });
  window.addEventListener('pageshow', hideLoading);
}

function leavesForAnotherPage(event, link) {
  // Something else already handled the click.
  if (event.defaultPrevented) return false;
  // Opening in a new tab or window (or downloading) leaves this page here.
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (link.target && link.target !== '_self') return false;
  if (link.hasAttribute('download')) return false;

  const to = new URL(link.href);
  const here = new URL(document.URL);
  // Another site isn't ours to say anything about.
  if (to.origin !== here.origin) return false;
  // A jump to a spot on this same page doesn't load anything.
  const withoutSpot = (url) => url.href.split('#')[0];
  if (to.hash && withoutSpot(to) === withoutSpot(here)) return false;
  return true;
}
