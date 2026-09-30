const params = new URLSearchParams(window.location.search);
const choice = params.get('buddy');
const buddy = document.querySelector(`.dish-buddy[data-buddy="${choice}"]`);

if (buddy) {
  buddy.removeAttribute('hidden');
  document.getElementById('buddy-name').textContent = buddy.dataset.name;
  document.title = `PetriPals | ${buddy.dataset.name}`;
} else {
  // No buddy (or an unknown one) in the URL: send them back to choose.
  window.location.replace('./buddy-picker.html');
}
