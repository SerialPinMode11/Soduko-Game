const DOSUKU = 'https://sudoku-api.vercel.app/api/dosuku';
const YOUDO = 'https://www.youdosudoku.com/api/';

function toMatrix(value) {
  if (Array.isArray(value)) {
    if (value.length !== 9 || value.some((row) => !Array.isArray(row) || row.length !== 9)) return null;
    return value.map((row) => row.map((number) => Number(number) || 0));
  }
  const text = String(value ?? '').replace(/[^0-9.]/g, '');
  if (text.length !== 81) return null;
  return Array.from({ length: 9 }, (_, row) => [...text.slice(row * 9, row * 9 + 9)].map((char) => char === '.' || char === '0' ? 0 : Number(char)));
}

function normalizePuzzle(puzzle, solution, difficulty, source) {
  const normalizedPuzzle = toMatrix(puzzle);
  const normalizedSolution = toMatrix(solution);
  if (!normalizedPuzzle || !normalizedSolution || normalizedSolution.flat().some((number) => number < 1 || number > 9)) return null;
  return { puzzle: normalizedPuzzle, solution: normalizedSolution, difficulty, source };
}

export async function fetchPuzzle(difficulty = 'medium') {
  try {
    const response = await fetch(DOSUKU, { signal: AbortSignal.timeout(4000) });
    if (response.ok) {
      const grid = (await response.json())?.newboard?.grids?.[0];
      const puzzle = normalizePuzzle(grid?.value, grid?.solution, grid?.difficulty || difficulty, 'Dosuku');
      if (puzzle) return puzzle;
    }
  } catch (error) {
    console.warn('Dosuku unavailable:', error);
  }

  try {
    const response = await fetch(YOUDO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty, solution: true, array: true }),
      signal: AbortSignal.timeout(4000)
    });
    if (response.ok) {
      const data = await response.json();
      const puzzle = normalizePuzzle(data.puzzle, data.solution, data.difficulty || difficulty, 'YouDoSudoku');
      if (puzzle) return puzzle;
    }
  } catch (error) {
    console.warn('YouDoSudoku unavailable:', error);
  }

  return null;
}
