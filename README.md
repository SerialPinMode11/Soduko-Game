# soduko-nelson

Interactive Sudoku game plugin. Mount it in any web project without copying game files into the host app.

## Install

```bash
npm install soduko-nelson
```

## Quick start

```html
<div id="game"></div>
<script type="module">
  import { mountSudoku } from 'soduko-nelson';
  import 'soduko-nelson/dist/soduko-nelson.css';

  const game = mountSudoku(document.getElementById('game'), {
    difficulty: 'medium',
    startScreen: 'login',
    showBot: true,
    music: true,
    onWin: (stats) => console.log('Won', stats),
    onLose: (stats) => console.log('Lost', stats),
    onReady: () => console.log('Game mounted'),
  });

  // Later:
  // game.newGame('hard');
  // game.destroy();
</script>
```

## API

### `mountSudoku(container, options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `difficulty` | string | `'medium'` | `easy` \| `medium` \| `hard` \| `expert` |
| `startScreen` | string | `'login'` | `login` \| `level` \| `game` |
| `showBot` | boolean | `true` | Show announcer bot |
| `music` | boolean | `true` | Enable synthesized theme |
| `onWin` | function | — | Called with `{ time, mistakes, difficulty }` |
| `onLose` | function | — | Called with `{ time, mistakes, difficulty }` |
| `onReady` | function | — | Called after first paint |

Returns `{ destroy(), newGame(difficulty?) }`.

The plugin keeps all UI inside your container and does not use the host router.

## React / Vite

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
  return <div ref={ref} />;
}
```

## Local development

```bash
npm install
npm run build
```

Open `examples/vanilla.html` via a static server that can resolve the built `dist/` files, or use:

```bash
npx serve .
# then open /examples/vanilla.html
```

Design notes: see `docs/PLUG-IN.md`.
