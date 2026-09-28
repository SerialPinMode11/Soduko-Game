# Sudoku Game (Game-Test)

Reorganized and improved version of the original [csnaim/Soduko-Game-Repository](https://github.com/csnaim/Soduko-Game-Repository).

## Structure

```
Game-Test/
├── docs/IMPLEMENTATION.md   ← full guide (code, API, bot, audio, levels)
├── resources/
│   ├── css/
│   ├── js/                  ← engine, api, bot, audio, game
│   ├── pages/               ← open index.html to start
│   ├── audio/               ← game-theme.mp3
│   └── images/
└── README.md
```

## What was improved

- Proper Sudoku generator (backtracking) instead of the original incomplete fill
- Real difficulty levels: Easy / Medium / Hard / Expert
- Public free API integration (Dosuku + YouDoSudoku) with local fallback
- Clean modular structure (engine, API, bot, audio, UI)
- Timer, notes, hints, live validation, keyboard support
- **Same-number highlight** – click a digit → all matching cells & notes light up
- **Free hint reward** – clear one full 3×3 block → earn 1 free hint
- **Announcer bot** – friendly messages instead of plain red error text
- **Background music** – default browser-generated loopable theme with mute toggle

## How to run

1. Open `resources/pages/index.html` in a browser,
   or serve the folder:

```bash
npx serve resources
```

Then go to `http://localhost:3000/pages/index.html`.

The original image and MP3 assets were not present in this workspace. The game remains self-contained: the bot uses a CSS avatar and the audio module synthesizes a quiet default theme after the first user gesture.
# Soduko-Game
