// A pal's profile in the browser (pal-profile.html?pal=mona). The deploy also
// writes a ready-made page for each pal (pals/mona.html, see
// scripts/build-site.js), which is what About on the mode screen opens and
// what search engines find; this page is there for any old ?pal= link.
import { palById } from './pals.js';
import { pageReady, watchLoading } from './loading.js';
import { renderProfile } from './profile.js';

// "Growing the colony…" while the next screen loads.
watchLoading();

const id = new URLSearchParams(window.location.search).get('pal');

if (!renderProfile(document, id)) {
  window.location.replace('./pal-picker.html');
} else {
  document.title = `PetriPals | About ${palById(id).name}`;
  pageReady();
}
