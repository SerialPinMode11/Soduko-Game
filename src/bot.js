const MESSAGES = {
  welcome: ['Ready when you are. Pick a square and let us find the pattern.', 'Welcome back, solver. Look for the quiet, certain moves first.'],
  mistake: ['That number does not fit here. {left} mistakes left.', 'A small detour. {left} tries remain.'],
  blockClear: ['Nice work. You cleared the {block} block and earned a free hint.', 'Block complete. I unlocked one free hint for you.'],
  hint: ['A little help, placed carefully. {left} hints remain.', 'One square revealed. Keep the pattern moving.'],
  win: ['Puzzle solved. Beautifully done.', 'You found the whole pattern.'],
  lose: ['This round is over, but the pattern is still learnable. Try again.', 'Three mistakes. Reset your focus and take another run.'],
  tip: ['Tip: click a number or note to highlight every matching digit.', 'Complete a 3x3 block to earn a free hint.']
};

const REACT_CLASSES = ['sn-bot-bounce', 'sn-bot-wiggle', 'sn-bot-nod', 'sn-bot-pop'];

function pick(messages) {
  return messages[Math.floor(Math.random() * messages.length)];
}

function fill(message, values) {
  return message.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

export function createBot(root) {
  let reactIndex = 0;
  let messageElement = null;
  let bubbleElement = null;
  let avatarElement = null;

  const onClick = () => react();
  const onKeydown = (event) => {
    if (/^[1-9]$/.test(event.key) || ['Backspace', 'Delete', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      react();
    }
  };

  function bind() {
    messageElement = root.querySelector('#sn-bot-message');
    bubbleElement = messageElement?.parentElement ?? null;
    avatarElement = root.querySelector('#sn-bot-avatar');
  }

  function react() {
    if (!avatarElement) return;
    const next = REACT_CLASSES[reactIndex % REACT_CLASSES.length];
    reactIndex += 1;
    REACT_CLASSES.forEach((name) => avatarElement.classList.remove(name));
    void avatarElement.offsetWidth;
    avatarElement.classList.add(next);
  }

  function say(type, values = {}) {
    if (!messageElement) return;
    messageElement.textContent = fill(pick(MESSAGES[type] || MESSAGES.tip), values);
    bubbleElement?.classList.remove('sn-bot-talk');
    if (bubbleElement) void bubbleElement.offsetWidth;
    bubbleElement?.classList.add('sn-bot-talk');
    react();
  }

  function sayText(message) {
    if (!messageElement) return;
    messageElement.textContent = message;
    bubbleElement?.classList.remove('sn-bot-talk');
    if (bubbleElement) void bubbleElement.offsetWidth;
    bubbleElement?.classList.add('sn-bot-talk');
    react();
  }

  function announce(event, values = {}) {
    const type = { mistake: 'mistake', 'block-clear': 'blockClear', hint: 'hint', win: 'win', lose: 'lose' }[event] || 'tip';
    say(type, values);
  }

  function attach() {
    bind();
    root.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeydown);
  }

  function detach() {
    root.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKeydown);
  }

  return { attach, detach, bind, say, sayText, announce, react };
}
