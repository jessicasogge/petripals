const startButton = document.querySelector('.start-btn');

if (startButton) {
  startButton.addEventListener('click', () => {
    startButton.textContent = 'Opening picker...';
    startButton.disabled = true;

    setTimeout(() => {
      window.location.href = './pal-picker.html';
    }, 250);
  });
}
