import './styles/game.css';
import { createAudio } from './audio.js';
import { createBot } from './bot.js';
import { createGameController } from './game.js';
import { renderGame, renderLevel, renderLogin, renderLose, renderWin, runConfetti } from './ui/views.js';

/**
 * Mount the Sudoku plugin into a host container.
 * @param {HTMLElement} container
 * @param {object} [options]
 * @returns {{ destroy: Function, newGame: Function }}
 */
export function mountSudoku(container, options = {}) {
  if (!container) throw new Error('mountSudoku requires a container element');

  const {
    difficulty: initialDifficulty = 'medium',
    startScreen = 'login',
    showBot = true,
    music = true,
    onWin,
    onLose,
    onReady,
  } = options;

  let player = 'Guest';
  let difficulty = initialDifficulty;
  let view = startScreen;
  let stopConfetti = null;
  let game = null;

  const root = document.createElement('div');
  root.className = 'sn-sudoku';
  container.replaceChildren(root);

  const bot = createBot(root);
  const audio = createAudio(root, { music });
  audio.attach();

  function titleCase(value) {
    return value[0].toUpperCase() + value.slice(1);
  }

  function go(next) {
    stopConfetti?.();
    stopConfetti = null;
    game?.destroy();
    game = null;
    bot.detach();
    view = next;
    render();
  }

  function wireNav() {
    root.querySelectorAll('[data-sn-nav]').forEach((el) => {
      el.addEventListener('click', () => go(el.dataset.snNav));
    });
  }

  function render() {
    if (view === 'login') {
      renderLogin(root);
      wireNav();
      const form = root.querySelector('#sn-login-form');
      const nameInput = root.querySelector('#sn-player-name');
      const message = root.querySelector('#sn-login-message');
      form?.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!nameInput.value.trim()) {
          message.textContent = 'Enter a name to continue.';
          nameInput.focus();
          return;
        }
        player = nameInput.value.trim();
        go('level');
      });
      root.querySelector('#sn-guest-button')?.addEventListener('click', () => {
        player = 'Guest';
        go('level');
      });
      return;
    }

    if (view === 'level') {
      renderLevel(root, player);
      wireNav();
      root.querySelectorAll('[data-level]').forEach((button) => {
        button.addEventListener('click', () => {
          difficulty = button.dataset.level;
          go('game');
        });
      });
      return;
    }

    if (view === 'game') {
      renderGame(root, titleCase(difficulty));
      wireNav();
      bot.attach();
      bot.bind();
      bot.say('welcome');
      audio.bindSettings();
      game = createGameController(root, {
        getDifficulty: () => difficulty,
        bot,
        audio,
        showBot,
        onWin: (stats) => {
          onWin?.(stats);
          go('win');
        },
        onLose: (stats) => {
          onLose?.(stats);
          go('lose');
        },
      });
      game.bindControls();
      game.loadGame();
      return;
    }

    if (view === 'win') {
      renderWin(root, player);
      wireNav();
      stopConfetti = runConfetti(root.querySelector('#sn-confetti'));
      return;
    }

    if (view === 'lose') {
      renderLose(root);
      wireNav();
    }
  }

  // Start screen shortcuts
  if (startScreen === 'game') view = 'game';
  else if (startScreen === 'level') view = 'level';
  else view = 'login';

  render();
  onReady?.();

  return {
    destroy() {
      stopConfetti?.();
      game?.destroy();
      bot.detach();
      audio.destroy();
      container.replaceChildren();
    },
    newGame(nextDifficulty) {
      if (nextDifficulty) difficulty = nextDifficulty;
      go('game');
    },
  };
}
