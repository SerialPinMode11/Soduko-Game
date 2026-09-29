# PLUG-IN.md — Turn Sudoku into an installable npm plugin

**Package name:** `soduko-nelson`  
**Goal:** `npm install soduko-nelson` installs a self-contained Sudoku game plugin that other projects can mount **without polluting or overwriting** their own directory structure.

Based on the current Game-Test layout (see project `README.md`):

- Entry: `resources/index.html` (login) → level → game → win/lose  
- Modules: engine, api, bot, audio, game UI  
- Features: difficulty levels, public API + local fallback, same-number highlight, blank-cell crosshair, free hint on block clear, announcer bot, browser-synthesized music, win/lose feedback  

---

## 1. Design principles

| Principle | How we satisfy it |
|-----------|-------------------|
| **Zero host pollution** | All game files live **inside `node_modules/soduko-nelson/`**. The host only adds a tiny mount point (one `<div>` + one import). |
| **Framework-agnostic** | Plain JS that works in vanilla HTML, React, Vue, Angular, Next, Vite, etc. |
| **Single entry API** | One function: `mountSudoku(container, options)`. |
| **No global CSS leaks** | Styles are scoped (CSS modules / shadow DOM / unique class prefix `sn-`). |
| **Optional assets** | Images/audio stay inside the package; host never copies them. |
| **Publishable** | Standard `package.json` + `files` field so only the built package is published. |

---

## 2. Recommended package layout (inside the repo)

Reorganize (or build into) this structure **before publishing**:

```
soduko-nelson/                    ← npm package root
├── package.json
├── README.md                     ← usage for consumers
├── LICENSE
├── src/                          ← source (your current game code)
│   ├── index.js                  ← public API: mountSudoku()
│   ├── engine.js
│   ├── api.js
│   ├── bot.js
│   ├── audio.js
│   ├── game.js
│   ├── ui/                       ← HTML templates or DOM builders
│   ├── styles/
│   │   └── game.css              ← scoped with .sn- prefix or CSS modules
│   └── assets/
│       ├── bot.jpg
│       └── ...
├── dist/                         ← build output (what gets published)
│   ├── soduko-nelson.js          ← ESM
│   ├── soduko-nelson.umd.js      ← for <script> tags
│   ├── soduko-nelson.css
│   └── assets/
└── examples/
    └── vanilla.html              ← minimal host page demo
```

**Important:** The host project never receives a full `resources/` tree. Everything ships inside `node_modules/soduko-nelson/dist/`.

---

## 3. Public API (what consumers call)

```js
import { mountSudoku } from 'soduko-nelson';
import 'soduko-nelson/dist/soduko-nelson.css';   // or auto-injected

const game = mountSudoku(document.getElementById('sudoku-root'), {
  difficulty: 'medium',      // 'easy' | 'medium' | 'hard' | 'expert'
  startScreen: 'login',      // 'login' | 'level' | 'game'
  showBot: true,
  music: true,
  onWin:  (stats) => console.log('Won', stats),
  onLose: (stats) => console.log('Lost', stats),
  onReady: () => console.log('Game mounted'),
});

// Later:
game.destroy();              // clean unmount — removes listeners, audio, DOM
game.newGame('hard');        // optional control methods
```

### Mount contract

1. Host provides **one empty container** (`<div id="sudoku-root"></div>`).
2. Plugin injects its own DOM **only inside that container**.
3. Plugin never writes to `document.body` outside the container (except optional temporary audio context).
4. `destroy()` restores the container to empty and stops music.

This is the key to “does not ruin the host project’s directory.”

---

## 4. Integration patterns (host projects)

### A. Vanilla / static site

```html
<div id="sudoku-root"></div>
<script type="module">
  import { mountSudoku } from './node_modules/soduko-nelson/dist/soduko-nelson.js';
  mountSudoku(document.getElementById('sudoku-root'));
</script>
```

### B. Vite / React

```jsx
import { useEffect, useRef } from 'react';
import { mountSudoku } from 'soduko-nelson';
import 'soduko-nelson/dist/soduko-nelson.css';

export function SudokuPlugin() {
  const ref = useRef(null);
  useEffect(() => {
    const game = mountSudoku(ref.current, { difficulty: 'medium' });
    return () => game.destroy();
  }, []);
  return <div ref={ref} className="sudoku-plugin-root" />;
}
```

### C. Next.js (client-only)

```jsx
'use client';
// same as React above — dynamic import if you need SSR avoidance
```

### D. CDN / no-bundler (UMD)

```html
<link rel="stylesheet" href="https://unpkg.com/soduko-nelson/dist/soduko-nelson.css">
<div id="sudoku-root"></div>
<script src="https://unpkg.com/soduko-nelson/dist/soduko-nelson.umd.js"></script>
<script>
  SodukoNelson.mountSudoku(document.getElementById('sudoku-root'));
</script>
```

---

## 5. `package.json` sketch

```json
{
  "name": "soduko-nelson",
  "version": "1.0.0",
  "description": "Interactive Sudoku game plugin — mountable in any web project",
  "type": "module",
  "main": "./dist/soduko-nelson.umd.js",
  "module": "./dist/soduko-nelson.js",
  "exports": {
    ".": {
      "import": "./dist/soduko-nelson.js",
      "require": "./dist/soduko-nelson.umd.js"
    },
    "./dist/soduko-nelson.css": "./dist/soduko-nelson.css"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "vite build",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["sudoku", "game", "plugin", "widget"],
  "license": "MIT",
  "sideEffects": [
    "*.css"
  ]
}
```

- **`files`** ensures only `dist/` is published — source and examples stay private unless you want them public.
- No heavy peerDependencies required (vanilla DOM).

---

## 6. Build step (Vite recommended)

Use Vite (or Rollup/esbuild) to:

1. Bundle all JS modules into one ESM + one UMD file.
2. Process CSS → single `soduko-nelson.css` with a unique prefix (e.g. `.sn-`) or CSS modules.
3. Copy/inline small assets (bot avatar) as base64 or as files under `dist/assets/`.
4. Keep audio synthesis in JS (already browser-generated — no MP3 needed).

Example `vite.config.js` (library mode):

```js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'SodukoNelson',
      fileName: (format) =>
        format === 'es' ? 'soduko-nelson.js' : 'soduko-nelson.umd.js',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      output: {
        assetFileNames: 'soduko-nelson.[ext]',
      },
    },
    cssCodeSplit: false,
  },
});
```

---

## 7. Scoping & isolation checklist

| Risk | Mitigation |
|------|------------|
| CSS overrides host styles | Prefix every selector with `.sn-` **or** use Shadow DOM for the root |
| Global event listeners | Attach only to the container; remove on `destroy()` |
| `localStorage` keys | Namespace keys: `sn-muted`, `sn-best-easy`, etc. |
| Audio context | Create per instance; close on destroy |
| Routing (`/level`, `/game`) | **Do not use host URL routes.** Use internal view state (login → level → game → win/lose) inside the component so the host router is never touched. |

> **Critical change from current app:** The present multi-page HTML flow (`index.html` → `level.html` → `game.html`) must become a **single-page state machine** inside `mountSudoku`. That is what makes it a true plugin.

---

## 8. Migration plan (from current Game-Test → plugin)

| Step | Action |
|------|--------|
| 1 | Create new repo or folder `soduko-nelson` with the layout in §2 |
| 2 | Move engine / api / bot / audio / game logic into `src/` |
| 3 | Convert multi-page navigation into internal views (show/hide or render functions) |
| 4 | Wrap UI in `mountSudoku(container, options)` + `destroy()` |
| 5 | Scope all CSS under `.sn-` (or Shadow DOM) |
| 6 | Add Vite library build → `dist/` |
| 7 | Write consumer `README.md` with the examples in §4 |
| 8 | `npm login` → `npm publish` (or publish under a scope `@you/soduko-nelson`) |
| 9 | Test in a **fresh** empty Vite/React project: `npm install soduko-nelson` and mount |

---

## 9. Optional advanced features (later)

- **Web Component:** `<soduko-nelson difficulty="hard"></soduko-nelson>` for zero-JS hosts.
- **React/Vue wrappers** published as peer packages (`soduko-nelson-react`).
- **Config file** in host: `soduko.config.js` for default difficulty, theme, etc.
- **CDN mirror** via unpkg / jsDelivr automatically after npm publish.

---

## 10. Quick success criteria

After publishing, a third-party developer should be able to do **exactly** this and nothing more:

```bash
npm install soduko-nelson
```

```html
<div id="game"></div>
<script type="module">
  import { mountSudoku } from 'soduko-nelson';
  import 'soduko-nelson/dist/soduko-nelson.css';
  mountSudoku(document.getElementById('game'));
</script>
```

- No files copied into their `src/` or `public/`.
- No conflict with their router or CSS.
- `game.destroy()` leaves their page clean.

---

## 11. Suggested first milestone

1. Implement `mountSudoku` + internal view state (no multi-page links).
2. Scope CSS.
3. Produce a working `dist/` with Vite.
4. Test install in a temporary folder:
   ```bash
   mkdir /tmp/host-test && cd /tmp/host-test
   npm init -y
   npm install /path/to/soduko-nelson   # local path first
   ```
5. Only then publish to the npm registry as `soduko-nelson`.

---

*This plan keeps the full feature set from the current README (bot, music, hints, highlights, API, levels) while turning the game into a safe, reusable plugin.*
