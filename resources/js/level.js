const player = sessionStorage.getItem('sudoku-player') || 'Guest';
document.querySelector('#player-label').textContent = player;

document.querySelectorAll('[data-level]').forEach((button) => {
  button.addEventListener('click', () => {
    sessionStorage.setItem('sudoku-level', button.dataset.level);
    window.location.href = 'game.html';
  });
});
