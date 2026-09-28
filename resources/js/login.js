const form = document.querySelector('#login-form');
const nameInput = document.querySelector('#player-name');
const guestButton = document.querySelector('#guest-button');
const message = document.querySelector('#login-message');

function enterGame(name) {
  sessionStorage.setItem('sudoku-player', name.trim() || 'Guest');
  window.location.href = 'level.html';
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!nameInput.value.trim()) {
    message.textContent = 'Enter a name to continue.';
    nameInput.focus();
    return;
  }
  enterGame(nameInput.value);
});

guestButton.addEventListener('click', () => enterGame('Guest'));
