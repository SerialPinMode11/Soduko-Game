const KEYS = {
  music: 'sn-music',
  clicks: 'sn-click-sounds',
  volume: 'sn-music-volume',
};

const melody = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];

export function createAudio(root, { music = true } = {}) {
  let audioContext = null;
  let gainNode = null;
  let musicTimer = null;
  let musicEnabled = music && localStorage.getItem(KEYS.music) !== '0';
  let clickSoundsEnabled = localStorage.getItem(KEYS.clicks) !== '0';
  let musicVolume = Number(localStorage.getItem(KEYS.volume) ?? 35) / 100;
  const cleanups = [];
  const settingsCleanups = [];

  function ensureAudio() {
    if (!audioContext) {
      audioContext = new AudioContext();
      gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
    }
    if (audioContext.state === 'suspended') audioContext.resume();
  }

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

  function stopMusic() {
    clearInterval(musicTimer);
    musicTimer = null;
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

  function playWinFanfare() {
    ensureAudio();
    const start = audioContext.currentTime + 0.02;
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      playTone(frequency, start + index * 0.14, 0.28, 'triangle', 0.14);
    });
    playTone(1318.51, start + 0.55, 0.35, 'sine', 0.1);
  }

  function playLoseSting() {
    ensureAudio();
    const start = audioContext.currentTime + 0.02;
    [392, 349.23, 311.13, 261.63].forEach((frequency, index) => {
      playTone(frequency, start + index * 0.16, 0.3, 'sine', 0.11);
    });
  }

  function on(target, type, handler, options, bucket = cleanups) {
    if (!target) return;
    target.addEventListener(type, handler, options);
    bucket.push(() => target.removeEventListener(type, handler, options));
  }

  function bindSettings() {
    settingsCleanups.splice(0).forEach((fn) => fn());
    const modal = root.querySelector('#sn-settings-modal');
    const musicControl = root.querySelector('#sn-music-enabled');
    const soundControl = root.querySelector('#sn-sound-enabled');
    const volumeControl = root.querySelector('#sn-music-volume');
    if (!modal || !musicControl || !soundControl || !volumeControl) return;

    const openSettings = () => {
      modal.hidden = false;
      root.querySelector('#sn-settings-close')?.focus();
    };
    const closeSettings = () => {
      modal.hidden = true;
      root.querySelector('#sn-settings-button')?.focus();
    };

    on(root.querySelector('#sn-settings-button'), 'click', openSettings, undefined, settingsCleanups);
    on(root.querySelector('#sn-settings-close'), 'click', closeSettings, undefined, settingsCleanups);
    on(modal, 'click', (event) => {
      if (event.target === modal) closeSettings();
    }, undefined, settingsCleanups);
    on(document, 'keydown', (event) => {
      if (event.key === 'Escape' && !modal.hidden) closeSettings();
    }, undefined, settingsCleanups);

    musicControl.checked = musicEnabled;
    soundControl.checked = clickSoundsEnabled;
    volumeControl.value = Math.round(musicVolume * 100);

    on(musicControl, 'change', () => {
      musicEnabled = musicControl.checked;
      localStorage.setItem(KEYS.music, musicEnabled ? '1' : '0');
      if (musicEnabled) {
        ensureAudio();
        startMusic();
      } else stopMusic();
    }, undefined, settingsCleanups);
    on(soundControl, 'change', () => {
      clickSoundsEnabled = soundControl.checked;
      localStorage.setItem(KEYS.clicks, clickSoundsEnabled ? '1' : '0');
    }, undefined, settingsCleanups);
    on(volumeControl, 'input', () => {
      musicVolume = Number(volumeControl.value) / 100;
      localStorage.setItem(KEYS.volume, volumeControl.value);
    }, undefined, settingsCleanups);
  }

  function attach() {
    const begin = () => {
      ensureAudio();
      if (musicEnabled) startMusic();
    };
    on(root, 'click', begin, { once: true });
    on(root, 'click', (event) => {
      if (event.target.closest('button, a, input[type="checkbox"], input[type="range"]')) playClick();
    });
  }

  function destroy() {
    stopMusic();
    settingsCleanups.splice(0).forEach((fn) => fn());
    cleanups.splice(0).forEach((fn) => fn());
    if (audioContext) {
      audioContext.close().catch(() => {});
      audioContext = null;
      gainNode = null;
    }
  }

  return { attach, destroy, playWinFanfare, playLoseSting, bindSettings };
}
