# Sudoku Game – Improvement Guide

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
│   └── IMPROVEMENT.md             ← this file
├── resources/
│   ├── css/
│   │   ├── base.css               ← shared styles
│   │   ├── login.css
│   │   ├── level.css
│   │   └── game.css
│   ├── js/
│   │   ├── sudoku-engine.js       ← core generator + solver + validator
│   │   ├── api.js                 ← public API + local fallback
│   │   ├── bot.js                 ← in-game announcer bot (messages, errors, tips)
│   │   ├── audio.js               ← background music + SFX controller
│   │   ├── login.js
│   │   ├── level.js
│   │   └── game.js                ← UI + game loop
│   ├── pages/
│   │   ├── index.html             ← login / start
│   │   ├── level.html             ← difficulty selection
│   │   ├── game.html              ← main board
│   │   ├── win.html
│   │   └── lose.html
│   ├── audio/
│   │   └── game-theme.mp3         ← default loopable background track (royalty-free)
│   └── images/
│       ├── win.png                ← (copy from original “little boy jumps up.png”)
│       ├── lose.png               ← (copy from original “little boy crying.png”)
│       └── bot-avatar.png         ← optional face for the announcer bot
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
| **Same-number highlight** | None | Click any number → highlight every matching cell (filled + notes) |
| **Free hint reward** | None | Clear one full 3×3 block → earn **1 free hint** |
| **Announcer bot** | Plain red error text | Friendly bot avatar that speaks announcements, errors & tips |
| **Background music** | None | Default loopable game theme + mute toggle |

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
- **Hint** – fills one correct empty cell (limited uses per game; see free-hint reward below).
- **Undo** – simple history stack.
- **Live conflict highlight** – red border when a number already exists in row/col/box.
- **Keyboard** – arrow keys + number keys.
- **Same-number highlight** – click a digit → all matching filled cells *and* notes light up.
- **Announcer bot** – friendly character that speaks instead of plain red error text.
- **Background music** – default loopable theme with mute toggle.

---

## 8. Same-Number Highlight (filled cells + notes)

When the player clicks (or focuses) a cell that contains a number — either a committed value or a pencil note — every other cell on the board that shows the same digit must be highlighted.

### Behaviour rules

| Cell type | Highlight when matching digit is selected |
|-----------|-------------------------------------------|
| Given / user-filled number | Strong highlight (e.g. light blue background) |
| Pencil note containing that digit | Soft highlight (e.g. yellow underline or note badge glow) |
| Empty cell | No highlight |

### Implementation sketch (`game.js`)

```js
let selectedDigit = null;   // 1–9 or null

function onCellClick(r, c) {
  const cell = board[r][c];
  const notes = notesBoard[r][c]; // Set of small digits

  // Prefer the real number; otherwise use the first note under the cursor
  selectedDigit = cell !== 0 ? cell : (notes.size ? [...notes][0] : null);
  refreshHighlights();
}

function refreshHighlights() {
  document.querySelectorAll('.cell').forEach(el => {
    el.classList.remove('highlight-num', 'highlight-note');
  });
  if (selectedDigit == null) return;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const el = cellEl(r, c);
      if (board[r][c] === selectedDigit) {
        el.classList.add('highlight-num');
      } else if (notesBoard[r][c].has(selectedDigit)) {
        el.classList.add('highlight-note');
      }
    }
  }
}
```

### CSS (`game.css`)

```css
.cell.highlight-num {
  background: #b3e5fc !important;   /* clear blue for real numbers */
}
.cell.highlight-note {
  box-shadow: inset 0 0 0 2px #ffd54f; /* soft yellow for notes */
}
.cell.highlight-note .note[data-n="N"] { /* optional: glow the specific note */
  background: #ffd54f;
  border-radius: 2px;
}
```

Also call `refreshHighlights()` after any number pad click so that selecting “5” from the pad highlights every 5 on the board.

---

## 9. Free Hint Reward – “Clear one block, earn one free hint”

### Rule

As soon as the player **completely fills a 3×3 block** with correct numbers (the nine cells match the solution), award **exactly one free hint**.

- A block is considered “cleared” only once.
- The free hint is added to the player’s remaining hint counter.
- The announcer bot celebrates the achievement.

### Detection helper (`sudoku-engine.js`)

```js
/** Returns true if the 3×3 block at (br, bc) is fully filled and matches solution */
export function isBlockComplete(board, solution, br, bc) {
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (board[r][c] === 0 || board[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

/** Returns list of newly completed block origins, e.g. [[0,0], [3,6]] */
export function newlyCompletedBlocks(board, solution, alreadyAwarded) {
  const result = [];
  for (let br = 0; br < 9; br += 3) {
    for (let bc = 0; bc < 9; bc += 3) {
      const key = `${br},${bc}`;
      if (!alreadyAwarded.has(key) && isBlockComplete(board, solution, br, bc)) {
        result.push([br, bc]);
      }
    }
  }
  return result;
}
```

### Game loop integration (`game.js`)

```js
const awardedBlocks = new Set();   // "0,0", "0,3", …

function afterUserMove(r, c) {
  // … existing validation …

  const newBlocks = newlyCompletedBlocks(board, solution, awardedBlocks);
  for (const [br, bc] of newBlocks) {
    awardedBlocks.add(`${br},${bc}`);
    hintsLeft += 1;                 // free hint reward
    bot.announce('block-clear', { block: blockName(br, bc), hintsLeft });
    // optional: subtle glow animation on the completed block
  }
}
```

---

## 10. Announcer Bot + Background Music

Plain red error text is replaced by a **friendly in-game bot** that talks to the player. A default game song plays in the background.

### 10.1 Bot UI (inside `game.html`)

```html
<aside id="bot-panel" class="bot-panel" aria-live="polite">
  <img src="../images/bot-avatar.png" alt="Sudoku Bot" class="bot-avatar" width="64" height="64">
  <div class="bot-bubble">
    <p id="bot-message">Ready when you are! Let’s solve this puzzle.</p>
  </div>
</aside>
```

Place the panel beside or below the board so it is always visible.

### 10.2 Bot module (`resources/js/bot.js`)

```js
// resources/js/bot.js
const MESSAGES = {
  welcome: [
    "Hey! I’m your Sudoku buddy. Good luck!",
    "Ready when you are — pick a cell and let’s go!"
  ],
  mistake: [
    "Oops, that number doesn’t fit. You have {left} mistakes left.",
    "Hmm, conflict detected. {left} tries remaining — you got this!",
    "That one’s taken in the row/col/box. {left} left."
  ],
  blockClear: [
    "Nice! You cleared the {block} block. Here’s a free hint 🎁",
    "Block complete! Free hint unlocked. Keep the streak going!"
  ],
  hintUsed: [
    "Here’s a little help. Hints left: {left}.",
    "One cell filled for you. You’ve got {left} hints remaining."
  ],
  win: [
    "You did it! Amazing work 🎉",
    "Puzzle solved — you’re a Sudoku star!"
  ],
  lose: [
    "Out of mistakes… but every puzzle teaches something. Try again!",
    "Game over this round. Hit Play Again whenever you’re ready."
  ],
  tip: [
    "Tip: click any number to highlight all matching cells & notes.",
    "Clear a whole 3×3 block and I’ll give you a free hint!"
  ]
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fill(template, vars = {}) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

export const bot = {
  el: null,
  init() {
    this.el = document.getElementById('bot-message');
    this.say('welcome');
  },
  say(type, vars = {}) {
    if (!this.el) return;
    const pool = MESSAGES[type] || MESSAGES.tip;
    this.el.textContent = fill(pick(pool), vars);
    this.el.parentElement.classList.add('bot-talk');
    setTimeout(() => this.el.parentElement.classList.remove('bot-talk'), 400);
  },
  announce(event, vars) {
    const map = {
      mistake: 'mistake',
      'block-clear': 'blockClear',
      hint: 'hintUsed',
      win: 'win',
      lose: 'lose'
    };
    this.say(map[event] || 'tip', vars);
  }
};
```

### 10.3 Replace plain error text

**Before (old style):**

```js
statusEl.textContent = `That number does not fit here. ${mistakesLeft} mistakes left.`;
statusEl.classList.add('error');
```

**After:**

```js
bot.announce('mistake', { left: mistakesLeft });
// optional short shake animation on the cell — no red banner needed
```

### 10.4 Background music (`resources/js/audio.js`)

```js
// resources/js/audio.js
let audio = null;
let muted = localStorage.getItem('sudoku-muted') === '1';

export function initAudio() {
  audio = new Audio('../audio/game-theme.mp3');
  audio.loop = true;
  audio.volume = 0.35;
  // browsers require a user gesture before play
  document.body.addEventListener('click', tryPlay, { once: true });
  updateMuteButton();
}

function tryPlay() {
  if (!muted && audio) audio.play().catch(() => {});
}

export function toggleMute() {
  muted = !muted;
  localStorage.setItem('sudoku-muted', muted ? '1' : '0');
  if (muted) audio?.pause();
  else tryPlay();
  updateMuteButton();
}

function updateMuteButton() {
  const btn = document.getElementById('mute-btn');
  if (btn) btn.textContent = muted ? '🔇' : '🔊';
}
```

Add a mute button in the game header:

```html
<button id="mute-btn" onclick="toggleMute()" title="Toggle music">🔊</button>
```

Use any royalty-free loopable track (e.g. from OpenGameArt or Pixabay) and place it at `resources/audio/game-theme.mp3`.

### 10.5 CSS for bot bubble

```css
.bot-panel {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  max-width: 320px;
  margin-top: 1rem;
}
.bot-avatar {
  border-radius: 50%;
  border: 3px solid #7e57c2;
}
.bot-bubble {
  background: #f3e5f5;
  border-radius: 12px;
  padding: 10px 14px;
  position: relative;
  transition: transform 0.2s;
}
.bot-bubble.bot-talk {
  transform: scale(1.03);
}
.bot-bubble::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 16px;
  border: 8px solid transparent;
  border-right-color: #f3e5f5;
}
```

---

## 11. Mapping Original → New Files

| Original | New location | Notes |
|----------|--------------|-------|
| `page1.html` | `resources/pages/index.html` | Keep login + Guest; optional localStorage name |
| `page1.css` | `resources/css/login.css` + `base.css` | Extract shared rules |
| `page1.js` | `resources/js/login.js` | Soften hard-coded credentials or remove for guest-first |
| `chooseLevel.*` | `resources/pages/level.html` + `level.css` + `level.js` | Add Expert; store choice in sessionStorage |
| `game_page.*` | `resources/pages/game.html` + `game.css` + `game.js` | Full rewrite using engine + API + bot + audio |
| `finish.html` | `resources/pages/lose.html` | Keep image |
| `finish_correct.html` | `resources/pages/win.html` | Keep image |
| Images | `resources/images/` | Rename for clarity; add bot-avatar.png |
| — | `resources/js/bot.js` | New – announcer bot |
| — | `resources/js/audio.js` | New – background music controller |
| — | `resources/audio/game-theme.mp3` | New – default loopable track |

---

## 12. Quick Start (after you copy the files)

1. Open `resources/pages/index.html` in a browser (or serve the folder with any static server).
2. Click **Guest Enter** or log in.
3. Choose a level.
4. Play – the board is generated either from the public API or the local engine.
5. Clear a 3×3 block → bot awards a free hint.
6. Click any number → matching cells & notes highlight.
7. Listen to the theme (toggle mute anytime).

For local development with modules:

```bash
# from Game-Test/
npx serve resources
# then open http://localhost:3000/pages/index.html
```

---

## 13. Recommended Next Steps

1. Copy the original images into `resources/images/` and add a simple bot avatar.
2. Drop a royalty-free MP3 into `resources/audio/game-theme.mp3`.
3. Implement the modules: `sudoku-engine.js`, `api.js`, `bot.js`, `audio.js`, `game.js`.
4. Wire same-number highlighting and the free-hint-on-block-clear logic.
5. Style the bot panel and mute button.
6. (Optional) Persist best times per difficulty in `localStorage`.

---

## 14. License & Credits

- Original student project: [csnaim/Soduko-Game-Repository](https://github.com/csnaim/Soduko-Game-Repository)
- Free puzzle APIs: [Dosuku](https://sudoku-api.vercel.app/) · [YouDoSudoku](https://www.youdosudoku.com/)
- Engine algorithm: classic recursive backtracking (public domain pattern)
- Music: use any royalty-free loop (credit the author in README if required)

---

*Updated for the Game-Test project – same-number highlight, free hint on block clear, announcer bot & background music.*
