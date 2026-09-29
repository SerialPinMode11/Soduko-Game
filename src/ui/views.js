import botUrl from '../assets/bot.jpg';

export function brandHtml(label = 'SUDOKU / 01') {
  return `<button type="button" class="sn-brand" data-sn-nav="login"><span class="sn-brand-mark"><i></i><i></i><i></i><i></i></span> ${label}</button>`;
}

export function renderLogin(root) {
  root.innerHTML = `
    <div class="sn-shell sn-login-layout">
      <section class="sn-intro">
        ${brandHtml()}
        <p class="sn-eyebrow">A quiet puzzle, a sharp mind</p>
        <h1>Make space<br>for numbers.</h1>
        <p>A thoughtful Sudoku board with clean clues, useful tools, and no pressure to play perfectly.</p>
      </section>
      <section class="sn-login-card">
        <p class="sn-eyebrow">Player entry</p>
        <h2>Ready when you are.</h2>
        <p class="sn-muted">Choose a name or step in as a guest.</p>
        <form id="sn-login-form">
          <label for="sn-player-name">Your name</label>
          <input id="sn-player-name" autocomplete="name" placeholder="Ada Lovelace">
          <div id="sn-login-message" role="status"></div>
          <div class="sn-login-actions">
            <button class="sn-btn" type="submit">Start playing</button>
            <button class="sn-btn sn-secondary" type="button" id="sn-guest-button">Guest</button>
          </div>
        </form>
      </section>
    </div>`;
}

export function renderLevel(root, player) {
  root.innerHTML = `
    <div class="sn-shell">
      ${brandHtml()}
      <header class="sn-level-header">
        <div>
          <p class="sn-eyebrow">Welcome, <span id="sn-player-label">${player}</span></p>
          <h1>How much<br>resistance?</h1>
        </div>
        <p class="sn-muted">Every board is generated with one complete solution. Pick the pace that suits your attention today.</p>
      </header>
      <section class="sn-level-grid" aria-label="Difficulty levels">
        <button class="sn-level-card" type="button" data-level="easy"><strong>Easy</strong><span>More clues. A gentle start for warming up.</span><b>01 / 04</b></button>
        <button class="sn-level-card" type="button" data-level="medium"><strong>Medium</strong><span>A balanced board for an everyday challenge.</span><b>02 / 04</b></button>
        <button class="sn-level-card" type="button" data-level="hard"><strong>Hard</strong><span>Fewer clues. More pattern recognition.</span><b>03 / 04</b></button>
        <button class="sn-level-card" type="button" data-level="expert"><strong>Expert</strong><span>Minimal help. Bring your whole attention.</span><b>04 / 04</b></button>
      </section>
    </div>`;
}

export function renderGame(root, difficultyLabel) {
  root.innerHTML = `
    <div class="sn-shell">
      <header class="sn-game-top">
        <div class="sn-game-title">
          <button type="button" class="sn-brand" data-sn-nav="level"><span class="sn-brand-mark"><i></i><i></i><i></i><i></i></span> SUDOKU / 01</button>
          <h1 id="sn-level-title">${difficultyLabel}</h1>
        </div>
        <div class="sn-stats">
          <span>TIME<strong id="sn-timer">00:00</strong></span>
          <span>MISTAKES<strong id="sn-mistakes">0 / 3</strong></span>
          <span>HINTS<strong id="sn-hints">3</strong></span>
          <button class="sn-settings-button" id="sn-settings-button" type="button" aria-haspopup="dialog">Settings</button>
        </div>
      </header>
      <div class="sn-game-layout">
        <section>
          <div id="sn-board" class="sn-board" role="grid" aria-label="Sudoku board"></div>
          <aside id="sn-bot-panel" class="sn-bot-panel" aria-live="polite">
            <div class="sn-bot-avatar" id="sn-bot-avatar" aria-hidden="true"><img src="${botUrl}" alt="" class="sn-bot-face"></div>
            <div class="sn-bot-bubble"><p id="sn-bot-message">Ready when you are.</p></div>
          </aside>
        </section>
        <aside class="sn-side-panel">
          <h2>Make a move</h2>
          <p>Select a square, then use a number key or the buttons below. Notes mode keeps small candidate marks in a cell.</p>
          <div class="sn-tool-row">
            <button class="sn-btn sn-secondary" id="sn-undo" type="button">Undo</button>
            <button class="sn-btn sn-secondary" id="sn-hint" type="button">Hint</button>
            <button class="sn-btn sn-secondary" id="sn-check" type="button">Check</button>
            <button class="sn-btn sn-secondary" id="sn-new-game" type="button">New board</button>
          </div>
          <label class="sn-mode"><span>Notes mode</span><input id="sn-notes-mode" type="checkbox"></label>
          <div class="sn-toolbar" id="sn-number-pad" aria-label="Number pad"></div>
        </aside>
      </div>
    </div>
    <div class="sn-settings-modal" id="sn-settings-modal" role="dialog" aria-modal="true" aria-labelledby="sn-settings-title" hidden>
      <div class="sn-settings-card">
        <div class="sn-settings-heading">
          <div><p class="sn-eyebrow">Game controls</p><h2 id="sn-settings-title">Settings</h2></div>
          <button class="sn-close-button" id="sn-settings-close" type="button" aria-label="Close settings">Close</button>
        </div>
        <label class="sn-setting-row"><span><strong>Background music</strong><small>Play the looping game theme.</small></span><input id="sn-music-enabled" type="checkbox"></label>
        <label class="sn-setting-row"><span><strong>Button sounds</strong><small>Play a soft sound on every click.</small></span><input id="sn-sound-enabled" type="checkbox"></label>
        <label class="sn-setting-row sn-volume-row"><span><strong>Music volume</strong><small>Adjust the theme level.</small></span><input id="sn-music-volume" type="range" min="0" max="100" step="1"></label>
      </div>
    </div>`;
}

export function renderWin(root, player) {
  root.innerHTML = `
    <canvas id="sn-confetti" class="sn-confetti" aria-hidden="true"></canvas>
    <div class="sn-shell sn-result">
      <section>
        <p class="sn-eyebrow">Board complete</p>
        <h1>Well<br>solved.</h1>
        <p id="sn-result-copy">${player}, you found the shape of it.</p>
        <button class="sn-btn" type="button" data-sn-nav="level">Play another</button>
      </section>
    </div>`;
}

export function renderLose(root) {
  root.innerHTML = `
    <div class="sn-lose-flash" aria-hidden="true"></div>
    <div class="sn-shell sn-result sn-shake">
      <section>
        <p class="sn-eyebrow">This one got away</p>
        <h1>Try<br>again.</h1>
        <p>The board is still here. Your next pattern may be the one.</p>
        <button class="sn-btn" type="button" data-sn-nav="level">Choose another</button>
      </section>
    </div>`;
}

export function runConfetti(canvas) {
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  const colors = ['#e07a3d', '#f2c94c', '#7eb6a2', '#2f6f5e', '#17231f', '#b7e1ee'];
  let pieces = [];
  let start = 0;
  let raf = 0;

  function resize() {
    canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
    canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
  }

  function spawn() {
    pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * -0.4,
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 10,
      vx: -2 + Math.random() * 4,
      vy: 2 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: -0.2 + Math.random() * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }

  function frame(time) {
    if (!start) start = time;
    const elapsed = time - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.vy += 0.03;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (elapsed < 3200) raf = requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  resize();
  spawn();
  window.addEventListener('resize', resize);
  raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
  };
}
