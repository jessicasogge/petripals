// Counts which plates people try on a pal's profile (see game/track.js):
// her own, and the three every pal can be grown on to compare. That answers
// whether the comparison plates get used at all, or whether everyone only
// ever sees the plate she opens on.
//
// Its own small script, so the ready-made pal pages (scripts/build-site.js)
// have it too: those drop the script that fills a profile in, and they're
// the pages About opens. The pages themselves are counted as visits by
// GoatCounter's own script, so there's nothing here for opening one.
import { track } from './track.js';

const plates = document.querySelector('.profile-plates');

if (plates) {
  // Each plate once a visit, so flipping back and forth doesn't look like a
  // crowd. Picking one is a radio button, so the change bubbles up to here.
  const counted = new Set();
  plates.addEventListener('change', (event) => {
    const kind = event.target.id?.replace(/^plate-/, '');
    if (!kind || counted.has(kind)) return;
    counted.add(kind);
    const label = plates.querySelector(`[for="${event.target.id}"]`)?.textContent;
    track(`plate/${kind}`, `Tried her on ${label ?? kind}`);
  });
}
