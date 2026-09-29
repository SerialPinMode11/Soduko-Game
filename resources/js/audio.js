let audioContext;
let gainNode;
let musicTimer;
let musicEnabled = localStorage.getItem('sudoku-music') !== '0';
let clickSoundsEnabled = localStorage.getItem('sudoku-click-sounds') !== '0';
let musicVolume = Number(localStorage.getItem('sudoku-music-volume') ?? 35) / 100;
const melody = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];

function playNote(frequency, start, duration) {
  if (!audioContext || !musicEnabled) return;
  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(0.13 * musicVolume, start + 0.03);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(envelope).connect(gainNode);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.04);
}

function startMusic() {
  if (!audioContext || !musicEnabled || musicTimer) return;
  const schedule = () => {
    const start = audioContext.currentTime + 0.05;
    melody.forEach((frequency, index) => playNote(frequency, start + index * 0.42, 0.34));
  };
  schedule();
  musicTimer = setInterval(schedule, melody.length * 420);
}

function ensureAudio() {
  if (!audioContext) {
    audioContext = new AudioContext();
    gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
  }
  if (audioContext.state === 'suspended') audioContext.resume();
}

function playClick() {
  if (!clickSoundsEnabled) return;
  ensureAudio();
  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  const start = audioContext.currentTime;
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(520, start);
  oscillator.frequency.exponentialRampToValueAtTime(260, start + 0.06);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(0.07, start + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.07);
  oscillator.connect(envelope).connect(gainNode);
  oscillator.start(start);
  oscillator.stop(start + 0.08);
}

function playTone(frequency, start, duration, type = 'triangle', peak = 0.12) {
  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(peak, start + 0.02);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(envelope).connect(gainNode);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

export function playWinFanfare() {
  ensureAudio();
  const start = audioContext.currentTime + 0.02;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((frequency, index) => {
    playTone(frequency, start + index * 0.14, 0.28, 'triangle', 0.14);
  });
  playTone(1318.51, start + 0.55, 0.35, 'sine', 0.1);
}

export function playLoseSting() {
  ensureAudio();
  const start = audioContext.currentTime + 0.02;
  const notes = [392, 349.23, 311.13, 261.63];
  notes.forEach((frequency, index) => {
    playTone(frequency, start + index * 0.16, 0.3, 'sine', 0.11);
  });
}

export function initAudio() {
  const begin = () => {
    ensureAudio();
    startMusic();
  };
  document.body.addEventListener('click', begin, { once: true });
  document.addEventListener('click', (event) => {
    if (event.target.closest('button, a, input[type="checkbox"], input[type="range"]')) playClick();
  });

  const modal = document.querySelector('#settings-modal');
  const musicControl = document.querySelector('#music-enabled');
  const soundControl = document.querySelector('#sound-enabled');
  const volumeControl = document.querySelector('#music-volume');
  const openSettings = () => { modal.hidden = false; document.querySelector('#settings-close').focus(); };
  const closeSettings = () => { modal.hidden = true; document.querySelector('#settings-button').focus(); };
  document.querySelector('#settings-button').addEventListener('click', openSettings);
  document.querySelector('#settings-close').addEventListener('click', closeSettings);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeSettings(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeSettings(); });
  musicControl.checked = musicEnabled;
  soundControl.checked = clickSoundsEnabled;
  volumeControl.value = Math.round(musicVolume * 100);
  musicControl.addEventListener('change', () => {
    musicEnabled = musicControl.checked;
    localStorage.setItem('sudoku-music', musicEnabled ? '1' : '0');
    if (musicEnabled) begin();
    else { clearInterval(musicTimer); musicTimer = null; }
  });
  soundControl.addEventListener('change', () => {
    clickSoundsEnabled = soundControl.checked;
    localStorage.setItem('sudoku-click-sounds', clickSoundsEnabled ? '1' : '0');
  });
  volumeControl.addEventListener('input', () => {
    musicVolume = Number(volumeControl.value) / 100;
    localStorage.setItem('sudoku-music-volume', volumeControl.value);
  });
}
