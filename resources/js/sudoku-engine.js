const SIZE = 9;
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function emptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

export function clone(board) {
  return board.map((row) => [...row]);
}

export function isValid(board, row, column, number) {
  for (let index = 0; index < SIZE; index += 1) {
    if (index !== column && board[row][index] === number) return false;
    if (index !== row && board[index][column] === number) return false;
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxColumn = Math.floor(column / 3) * 3;
  for (let currentRow = boxRow; currentRow < boxRow + 3; currentRow += 1) {
    for (let currentColumn = boxColumn; currentColumn < boxColumn + 3; currentColumn += 1) {
      if ((currentRow !== row || currentColumn !== column) && board[currentRow][currentColumn] === number) {
        return false;
      }
    }
  }
  return true;
}

function shuffle(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function findEmptyCell(board) {
  for (let row = 0; row < SIZE; row += 1) {
    for (let column = 0; column < SIZE; column += 1) {
      if (board[row][column] === 0) return { row, column };
    }
  }
  return null;
}

export function solve(board) {
  const cell = findEmptyCell(board);
  if (!cell) return true;

  for (const number of shuffle(DIGITS)) {
    if (isValid(board, cell.row, cell.column, number)) {
      board[cell.row][cell.column] = number;
      if (solve(board)) return true;
      board[cell.row][cell.column] = 0;
    }
  }
  return false;
}

const REMOVALS = { easy: 38, medium: 46, hard: 52, expert: 57 };

export function generate(difficulty = 'medium') {
  const solution = emptyBoard();
  solve(solution);
  const puzzle = clone(solution);
  const positions = shuffle([...Array(81).keys()]);
  const removeCount = REMOVALS[difficulty] ?? REMOVALS.medium;

  for (const position of positions.slice(0, removeCount)) {
    puzzle[Math.floor(position / SIZE)][position % SIZE] = 0;
  }

  return { puzzle, solution, difficulty };
}

export function isCompleteAndValid(board) {
  return board.every((row, rowIndex) => row.every((value, columnIndex) => (
    Number.isInteger(value) && value >= 1 && value <= 9 && isValid(board, rowIndex, columnIndex, value)
  )));
}

export function findConflicts(board) {
  const conflicts = new Set();
  for (let row = 0; row < SIZE; row += 1) {
    for (let column = 0; column < SIZE; column += 1) {
      const value = board[row][column];
      if (!value) continue;
      if (!isValid(board, row, column, value)) conflicts.add(`${row}-${column}`);
    }
  }
  return conflicts;
}

export function isBlockComplete(board, solution, blockRow, blockColumn) {
  for (let row = blockRow; row < blockRow + 3; row += 1) {
    for (let column = blockColumn; column < blockColumn + 3; column += 1) {
      if (!board[row][column] || board[row][column] !== solution[row][column]) return false;
    }
  }
  return true;
}

export function newlyCompletedBlocks(board, solution, alreadyAwarded) {
  const completed = [];
  for (let blockRow = 0; blockRow < SIZE; blockRow += 3) {
    for (let blockColumn = 0; blockColumn < SIZE; blockColumn += 3) {
      const key = `${blockRow},${blockColumn}`;
      if (!alreadyAwarded.has(key) && isBlockComplete(board, solution, blockRow, blockColumn)) {
        completed.push([blockRow, blockColumn]);
      }
    }
  }
  return completed;
}
