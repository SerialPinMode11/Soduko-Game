const MESSAGES = {
  welcome: ['Ready when you are. Pick a square and let us find the pattern.', 'Welcome back, solver. Look for the quiet, certain moves first.'],
  mistake: ['That number does not fit here. {left} mistakes left.', 'A small detour. {left} tries remain.'],
  blockClear: ['Nice work. You cleared the {block} block and earned a free hint.', 'Block complete. I unlocked one free hint for you.'],
  hint: ['A little help, placed carefully. {left} hints remain.', 'One square revealed. Keep the pattern moving.'],
  win: ['Puzzle solved. Beautifully done.', 'You found the whole pattern.'],
  lose: ['This round is over, but the pattern is still learnable. Try again.', 'Three mistakes. Reset your focus and take another run.'],
  tip: ['Tip: click a number or note to highlight every matching digit.', 'Complete a 3x3 block to earn a free hint.']
};

const REACT_CLASSES = ['bot-bounce', 'bot-wiggle', 'bot-nod', 'bot-pop'];

function pick(messages) { return messages[Math.floor(Math.random() * messages.length)]; }
function fill(message, values) { return message.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? ''); }

export const bot = {
  messageElement: null,
  bubbleElement: null,
  avatarElement: null,
  reactIndex: 0,
  init() {
    this.messageElement = document.querySelector('#bot-message');
    this.bubbleElement = this.messageElement?.parentElement;
    this.avatarElement = document.querySelector('#bot-avatar');
    this.say('welcome');
    document.addEventListener('click', () => this.react());
    document.addEventListener('keydown', (event) => {
      if (/^[1-9]$/.test(event.key) || ['Backspace', 'Delete', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        this.react();
      }
    });
  },
  react() {
    if (!this.avatarElement) return;
    const next = REACT_CLASSES[this.reactIndex % REACT_CLASSES.length];
    this.reactIndex += 1;
    REACT_CLASSES.forEach((name) => this.avatarElement.classList.remove(name));
    void this.avatarElement.offsetWidth;
    this.avatarElement.classList.add(next);
  },
  say(type, values = {}) {
    if (!this.messageElement) return;
    this.messageElement.textContent = fill(pick(MESSAGES[type] || MESSAGES.tip), values);
    this.bubbleElement.classList.remove('bot-talk');
    void this.bubbleElement.offsetWidth;
    this.bubbleElement.classList.add('bot-talk');
    this.react();
  },
  sayText(message) {
    if (!this.messageElement) return;
    this.messageElement.textContent = message;
    this.bubbleElement.classList.remove('bot-talk');
    void this.bubbleElement.offsetWidth;
    this.bubbleElement.classList.add('bot-talk');
    this.react();
  },
  announce(event, values = {}) {
    const type = { mistake: 'mistake', 'block-clear': 'blockClear', hint: 'hint', win: 'win', lose: 'lose' }[event] || 'tip';
    this.say(type, values);
  }
};
