# Sudoku Game – Implementation Guide

**Source repo:** [csnaim/Soduko-Game-Repository](https://github.com/csnaim/Soduko-Game-Repository)  
**Target structure:** `Game Test` (organized + improved)

This document pulls the original code, reorganizes it into a clean folder structure, fixes the core logic, adds real difficulty levels, and integrates a free public API so the game is more interactive and enjoyable.

---

## 1. Original Repo Snapshot

| File | Role |
|------|------|
| `page1.html` / `.css` / `.js` | Login (hard-coded `abcd` / `1234`) + Guest entry |
| `chooseLevel.html` / `.css` / `.js` | Easy / Medium / Hard buttons → query param `?level=1\|2\|3` |
| `game_page.html` / `.css` / `.js` | 9×9 table board, random fill + remove cells by level, check on submit |
| `finish.html` / `finish_correct.html` | Win / Lose screens with images |
| `naim.txt` + 2 PNGs | Assets |

### Problems in the original code

- Board generation is incomplete / can produce invalid boards (no proper backtracking).
- Difficulty only removes a fixed number of cells (20 / 40 / 60) without guaranteeing uniqueness.
- No live validation, no notes/pencil marks, no timer, no hints.
- Login is hard-coded and fragile.
- Flat file structure, relative paths break easily.
- Spelling: “Soduko” → should be **Sudoku**.

---

## 2. New Project Structure

```
Game-Test/
├── docs/
│   └── IMPLEMENTATION.md          ← this file
├── resources/
│   ├── css/
│   │   ├── base.css               ← shared styles
│   │   ├── login.css
│   │   ├── level.css
│   │   └── game.css
│   ├── js/
│   │   ├── sudoku-engine.js       ← core generator + solver + validator
│   │   ├── api.js                 ← public API + local fallback
│   │   ├── login.js
│   │   ├── level.js
│   │   └── game.js                ← UI + game loop
│   ├── pages/
│   │   ├── index.html             ← login / start
│   │   ├── level.html             ← difficulty selection
│   │   ├── game.html              ← main board
│   │   ├── win.html
│   │   └── lose.html
│   └── images/
│       ├── win.png                ← (copy from original “little boy jumps up.png”)
│       └── lose.png               ← (copy from original “little boy crying.png”)
└── README.md                      ← short how-to-run
```

All pages link CSS/JS with relative paths from `resources/pages/`:

```html
<link rel="stylesheet" href="../css/base.css">
<script type="module" src="../js/game.js"></script>
```

---

## 3. Improvements Overview

| Feature | Original | Improved |
|---------|----------|----------|
| Board generation | Incomplete random fill | Full backtracking + unique-solution check |
| Difficulty | Fixed cell removal | Easy / Medium / Hard / Expert (clue counts + optional API) |
| Validation | Only on final submit | Live cell highlighting + full check |
| Interactivity | Basic inputs | Timer, notes (pencil), hint, undo, new puzzle |
| Data source | Local only | Public API + local generator fallback |
| Code quality | Global vars, mixed concerns | Modules, clear separation |
| UX | Flat pages | Consistent design system, keyboard support |

---

## 4. Difficulty Levels

| Level | Approx. clues left | Cells removed | Target audience |
|-------|--------------------|---------------|-----------------|
| Easy | 40–45 | ~36–41 | Beginners |
| Medium | 32–38 | ~43–49 | Casual |
| Hard | 26–32 | ~49–55 | Experienced |
| Expert | 22–26 | ~55–59 | Challenge |

Levels are selected on `level.html` and stored in `sessionStorage` (or passed as `?level=easy`).

---

## 5. Public API Integration

We use a **free, no-key** public API when available, and fall back to a solid local generator.

### Primary free API (Dosuku)

```
GET https://sudoku-api.vercel.app/api/dosuku
```

Example response shape (simplified):

```json
{
  "newboard": {
    "grids": [
      {
        "value": [[...], ...],      // 9×9 puzzle (0 = empty)
        "solution": [[...], ...],
        "difficulty": "Easy"
      }
    ]
  }
}
```

Alternative (also free, string format):

```
GET https://www.youdosudoku.com/api/
```

Returns `{ difficulty, puzzle, solution }` where `puzzle`/`solution` are 81-char strings (`0` or `-` = empty).

### `resources/js/api.js` (recommended implementation)

```js
// resources/js/api.js
const DOSUKU = 'https://sudoku-api.vercel.app/api/dosuku';
const YOUDO  = 'https://www.youdosudoku.com/api/';

/**
 * Fetch a puzzle from a public API.
 * @param {'easy'|'medium'|'hard'|'expert'} difficulty
 * @returns {Promise<{puzzle: number[][], solution: number[][], difficulty: string, source: string}>}
 */
export async function fetchPuzzle(difficulty = 'medium') {
  // Try Dosuku first
  try {
    const res = await fetch(DOSUKU, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error('Dosuku failed');
    const data = await res.json();
    const grid = data?.newboard?.grids?.[0];
    if (grid?.value && grid?.solution) {
      return {
        puzzle: grid.value.map(row => row.map(n => n || 0)),
        solution: grid.solution,
        difficulty: grid.difficulty || difficulty,
        source: 'dosuku'
      };
    }
  } catch (e) {
    console.warn('Dosuku unavailable, trying YouDoSudoku…', e);
  }

  // Fallback: YouDoSudoku
  try {
    const res = await fetch(YOUDO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty, solution: true, array: true }),
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) throw new Error('YouDo failed');
    const data = await res.json();
    // adapt according to actual response shape
    return {
      puzzle: toMatrix(data.puzzle),
      solution: toMatrix(data.solution),
      difficulty: data.difficulty || difficulty,
      source: 'youdosudoku'
    };
  } catch (e) {
    console.warn('Public APIs failed → local generator', e);
    // final fallback is handled by the engine
    return null;
  }
}

function toMatrix(strOrArr) {
  if (Array.isArray(strOrArr)) return strOrArr;
  const s = String(strOrArr).replace(/[^0-9.]/g, '');
  const m = [];
  for (let i = 0; i < 9; i++) {
    m.push([...s.slice(i * 9, i * 9 + 9)].map(c => (c === '.' || c === '0' ? 0 : +c)));
  }
  return m;
}
```

---

## 6. Core Engine (`resources/js/sudoku-engine.js`)

Replace the original broken generator with a classic backtracking approach.

```js
// resources/js/sudoku-engine.js

/** Create empty 9×9 board */
export function emptyBoard() {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

/** Deep clone */
export function clone(board) {
  return board.map(row => [...row]);
}

/** Is placing num at (r,c) legal? */
export function isValid(board, r, c, num) {
  for (let i = 0; i < 9; i++) {
    if (board[r][i] === num || board[i][c] === num) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let i = br; i < br + 3; i++) {
    for (let j = bc; j < bc + 3; j++) {
      if (board[i][j] === num) return false;
    }
  }
  return true;
}

/** Solve in-place (returns true if solvable) */
export function solve(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const n of nums) {
          if (isValid(board, r, c, n)) {
            board[r][c] = n;
            if (solve(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a full valid board, then remove cells according to difficulty.
 * Guarantees at least one solution (unique solution check is optional & slower).
 */
export function generate(difficulty = 'medium') {
  const board = emptyBoard();
  solve(board);                       // full solution
  const solution = clone(board);

  const removeCount = {
    easy: 36,
    medium: 46,
    hard: 52,
    expert: 56
  }[difficulty] ?? 46;

  // remove random cells
  let removed = 0;
  const positions = shuffle([...Array(81).keys()]);
  for (const pos of positions) {
    if (removed >= removeCount) break;
    const r = Math.floor(pos / 9);
    const c = pos % 9;
    if (board[r][c] !== 0) {
      board[r][c] = 0;
      removed++;
    }
  }

  return { puzzle: board, solution, difficulty };
}

/** Check whether the current board is completely filled and valid */
export function isCompleteAndValid(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = board[r][c];
      if (v < 1 || v > 9) return false;
      board[r][c] = 0;
      const ok = isValid(board, r, c, v);
      board[r][c] = v;
      if (!ok) return false;
    }
  }
  return true;
}
```

---

## 7. Game Page Logic (`resources/js/game.js`)

High-level flow:

1. Read difficulty from `sessionStorage` or URL.
2. Try `fetchPuzzle(difficulty)` → if null, call `generate(difficulty)`.
3. Render the board (given cells are read-only).
4. Track user input, optional notes, timer, mistakes.
5. On “Check” / “Finish” → compare with solution or run `isCompleteAndValid`.
6. Navigate to win / lose page.

Key UX additions:

- **Timer** – starts on first input.
- **Notes mode** – toggle pencil marks (small digits in corners).
- **Hint** – fills one correct empty cell (limited uses per game).
- **Undo** – simple history stack.
- **Live conflict highlight** – red border when a number already exists in row/col/box.
- **Keyboard** – arrow keys + number keys.

---

## 8. Mapping Original → New Files

| Original | New location | Notes |
|----------|--------------|-------|
| `page1.html` | `resources/pages/index.html` | Keep login + Guest; optional localStorage name |
| `page1.css` | `resources/css/login.css` + `base.css` | Extract shared rules |
| `page1.js` | `resources/js/login.js` | Soften hard-coded credentials or remove for guest-first |
| `chooseLevel.*` | `resources/pages/level.html` + `level.css` + `level.js` | Add Expert; store choice in sessionStorage |
| `game_page.*` | `resources/pages/game.html` + `game.css` + `game.js` | Full rewrite using engine + API |
| `finish.html` | `resources/pages/lose.html` | Keep image |
| `finish_correct.html` | `resources/pages/win.html` | Keep image |
| Images | `resources/images/` | Rename for clarity |

---

## 9. Quick Start (after you copy the files)

1. Open `resources/pages/index.html` in a browser (or serve the folder with any static server).
2. Click **Guest Enter** or log in.
3. Choose a level.
4. Play – the board is generated either from the public API or the local engine.

For local development with modules:

```bash
# from Game-Test/
npx serve resources
# then open http://localhost:3000/pages/index.html
```

---

## 10. Recommended Next Steps

1. Copy the original images into `resources/images/`.
2. Implement the four JS modules above (`sudoku-engine.js`, `api.js`, `game.js`, …).
3. Style with a modern palette (dark mode optional).
4. Add a simple score = time + mistakes + hints used.
5. (Optional) Persist best times per difficulty in `localStorage`.

---

## 11. License & Credits

- Original student project: [csnaim/Soduko-Game-Repository](https://github.com/csnaim/Soduko-Game-Repository)
- Free puzzle APIs: [Dosuku](https://sudoku-api.vercel.app/) · [YouDoSudoku](https://www.youdosudoku.com/)
- Engine algorithm: classic recursive backtracking (public domain pattern)

---

*Generated for the Game-Test project – ready to implement.*
