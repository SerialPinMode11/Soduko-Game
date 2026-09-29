import { fetchPuzzle } from './api.js';
import { bot } from './bot.js';
import { initAudio, playLoseSting, playWinFanfare } from './audio.js';
import { clone, findConflicts, generate, isCompleteAndValid, newlyCompletedBlocks } from './sudoku-engine.js';

const difficulty = sessionStorage.getItem('sudoku-level') || 'medium';
const boardElement = document.querySelector('#board');
const timerElement = document.querySelector('#timer');
const mistakesElement = document.querySelector('#mistakes');
const hintsElement = document.querySelector('#hints');
const notesMode = document.querySelector('#notes-mode');
const state = { puzzle: null, solution: null, board: null, notes: Array.from({ length: 81 }, () => new Set()), selected: 0, selectedDigit: null, awardedBlocks: new Set(), history: [], mistakes: 0, hints: 3, seconds: 0, timer: null, started: false };

document.querySelector('#level-title').textContent = difficulty[0].toUpperCase() + difficulty.slice(1);

function formatTime(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function setStatus(text) { bot.sayText(text); }
function startTimer() { if (!state.started) { state.started = true; state.timer = setInterval(() => { state.seconds += 1; timerElement.textContent = formatTime(state.seconds); }, 1000); } }
function stopTimer() { clearInterval(state.timer); state.timer = null; }
function saveHistory() { state.history.push({ board: clone(state.board), notes: state.notes.map((set) => new Set(set)) }); }
function blockName(row, column) { return `${['top', 'middle', 'bottom'][row / 3]}-${['left', 'middle', 'right'][column / 3]}`; }
function awardCompletedBlocks() {
  for (const [row, column] of newlyCompletedBlocks(state.board, state.solution, state.awardedBlocks)) {
    state.awardedBlocks.add(`${row},${column}`);
    state.hints += 1;
    hintsElement.textContent = state.hints;
    bot.announce('block-clear', { block: blockName(row, column) });
  }
}

function render() {
  const conflicts = findConflicts(state.board);
  const selectedRow = Math.floor(state.selected / 9);
  const selectedCol = state.selected % 9;
  const selectedEmpty = !state.board[selectedRow][selectedCol];
  const blockRow = Math.floor(selectedRow / 3) * 3;
  const blockCol = Math.floor(selectedCol / 3) * 3;
  boardElement.replaceChildren();
  state.board.forEach((row, rowIndex) => row.forEach((value, columnIndex) => {
    const index = rowIndex * 9 + columnIndex;
    const cell = document.createElement('button');
    cell.className = 'cell';
    cell.type = 'button';
    cell.role = 'gridcell';
    cell.dataset.index = index;
    cell.setAttribute('aria-label', `Row ${rowIndex + 1}, column ${columnIndex + 1}`);
    if (state.puzzle[rowIndex][columnIndex]) cell.classList.add('given');
    if (index === state.selected) cell.classList.add('selected');
    const inBlock = rowIndex >= blockRow && rowIndex < blockRow + 3 && columnIndex >= blockCol && columnIndex < blockCol + 3;
    if (selectedEmpty && (rowIndex === selectedRow || columnIndex === selectedCol || inBlock)) cell.classList.add('crosshair');
    if (conflicts.has(`${rowIndex}-${columnIndex}`)) cell.classList.add('conflict');
    if (value) { cell.textContent = value; if (value === state.selectedDigit) cell.classList.add('highlight-num'); }
    else if (state.notes[index].size) {
      const noteGrid = document.createElement('span');
      noteGrid.className = 'notes';
      for (let number = 1; number <= 9; number += 1) { const note = document.createElement('span'); note.textContent = state.notes[index].has(number) ? number : ''; note.dataset.note = number; if (number === state.selectedDigit && state.notes[index].has(number)) { cell.classList.add('highlight-note'); note.classList.add('highlight-num'); } noteGrid.append(note); }
      cell.append(noteGrid);
    }
    cell.addEventListener('click', (event) => { state.selected = index; const note = event.target.closest('[data-note]'); state.selectedDigit = value || (note ? Number(note.dataset.note) : state.notes[index].values().next().value) || null; render(); });
    boardElement.append(cell);
  }));
}

function checkSolved() {
  if (isCompleteAndValid(state.board) && state.board.every((row, rowIndex) => row.every((value, columnIndex) => value === state.solution[rowIndex][columnIndex]))) {
    stopTimer();
    sessionStorage.setItem('sudoku-time', formatTime(state.seconds));
    bot.announce('win');
    playWinFanfare();
    setTimeout(() => { window.location.href = 'win.html'; }, 900);
    return true;
  }
  return false;
}

function enterNumber(number) {
  const row = Math.floor(state.selected / 9);
  const column = state.selected % 9;
  state.selectedDigit = number;
  if (state.puzzle[row][column]) { render(); return; }
  startTimer();
  saveHistory();
  if (notesMode.checked) {
    if (state.notes[state.selected].has(number)) state.notes[state.selected].delete(number); else state.notes[state.selected].add(number);
  } else {
    state.notes[state.selected].clear();
    state.board[row][column] = number;
    if (number !== state.solution[row][column]) {
      state.mistakes += 1;
      state.board[row][column] = 0;
      setStatus('The bot spotted a conflict.');
      bot.announce('mistake', { left: 3 - state.mistakes });
      if (state.mistakes >= 3) { stopTimer(); bot.announce('lose'); playLoseSting(); setTimeout(() => { window.location.href = 'lose.html'; }, 900); return; }
    } else { setStatus('Good placement. Keep looking for the next certain move.'); awardCompletedBlocks(); }
  }
  mistakesElement.textContent = `${state.mistakes} / 3`;
  render();
  checkSolved();
}

function undo() {
  const previous = state.history.pop();
  if (!previous) return setStatus('Nothing to undo yet.');
  state.board = previous.board; state.notes = previous.notes; render(); setStatus('Last move undone.'); bot.say('tip');
}

function hint() {
  const empty = state.board.flatMap((row, rowIndex) => row.map((value, columnIndex) => value ? null : rowIndex * 9 + columnIndex)).filter((index) => index !== null);
  if (!empty.length) return;
  if (!state.hints) return setStatus('No hints left for this board.', true);
  saveHistory(); state.hints -= 1; const index = empty[Math.floor(Math.random() * empty.length)]; state.board[Math.floor(index / 9)][index % 9] = state.solution[Math.floor(index / 9)][index % 9]; state.notes[index].clear(); state.selected = index; state.selectedDigit = state.board[Math.floor(index / 9)][index % 9]; hintsElement.textContent = state.hints; startTimer(); awardCompletedBlocks(); render(); setStatus('A correct square, revealed.'); bot.announce('hint', { left: state.hints }); checkSolved();
}

document.querySelector('#number-pad').innerHTML = [...Array(9)].map((_, index) => `<button class="btn secondary" type="button" data-number="${index + 1}">${index + 1}</button>`).join('');
document.querySelectorAll('[data-number]').forEach((button) => button.addEventListener('click', () => enterNumber(Number(button.dataset.number))));
document.querySelector('#undo').addEventListener('click', undo);
document.querySelector('#hint').addEventListener('click', hint);
document.querySelector('#check').addEventListener('click', () => { const conflicts = findConflicts(state.board); setStatus(conflicts.size ? 'The bot found a few conflicts.' : 'No conflicts so far. Keep solving.'); if (conflicts.size) bot.say('mistake', { left: 3 - state.mistakes }); else bot.say('tip'); render(); });
document.querySelector('#new-game').addEventListener('click', () => { stopTimer(); loadGame(); });
document.addEventListener('keydown', (event) => { if (/^[1-9]$/.test(event.key)) enterNumber(Number(event.key)); else if (event.key === 'Backspace' || event.key === 'Delete') { const row = Math.floor(state.selected / 9); const column = state.selected % 9; if (!state.puzzle[row][column]) { saveHistory(); state.board[row][column] = 0; state.notes[state.selected].clear(); render(); } } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); const row = Math.floor(state.selected / 9); const column = state.selected % 9; const delta = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[event.key]; state.selected = (Math.max(0, Math.min(8, row + delta[0])) * 9) + Math.max(0, Math.min(8, column + delta[1])); render(); } });

async function loadGame() {
  setStatus('Loading a fresh board...');
  const remote = await fetchPuzzle(difficulty);
  const game = remote || generate(difficulty);
  state.puzzle = game.puzzle; state.solution = game.solution; state.board = clone(game.puzzle); state.notes = Array.from({ length: 81 }, () => new Set()); state.history = []; state.awardedBlocks = new Set(); state.selectedDigit = null; state.mistakes = 0; state.hints = 3; state.seconds = 0; state.started = false; mistakesElement.textContent = '0 / 3'; hintsElement.textContent = '3'; timerElement.textContent = '00:00'; render(); setStatus(`${game.source ? `Puzzle from ${game.source}.` : 'Offline puzzle ready.'} Select a square to begin.`);
}

bot.init();
initAudio();
loadGame();
