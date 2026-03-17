(() => {
  // === DOM ===
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  const modeLabel = document.getElementById('modeLabel');
  const sessionCountEl = document.getElementById('sessionCount');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const workInput = document.getElementById('workInput');
  const breakInput = document.getElementById('breakInput');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const progressCircle = document.querySelector('.progress-ring__circle');

  const CIRCUMFERENCE = 2 * Math.PI * 120; // r=120

  // === State ===
  let workMinutes = 25;
  let breakMinutes = 5;
  let totalSeconds = workMinutes * 60;
  let remainingSeconds = totalSeconds;
  let isRunning = false;
  let isWork = true;
  let sessions = 0;
  let intervalId = null;

  // === Init ===
  loadSettings();
  updateDisplay();
  updateProgress();
  requestNotificationPermission();

  // === Events ===
  startBtn.addEventListener('click', start);
  pauseBtn.addEventListener('click', pause);
  resetBtn.addEventListener('click', reset);
  saveSettingsBtn.addEventListener('click', saveSettings);

  function start() {
    if (isRunning) return;
    isRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    intervalId = setInterval(() => {
      remainingSeconds--;
      updateDisplay();
      updateProgress();

      if (remainingSeconds <= 0) {
        clearInterval(intervalId);
        intervalId = null;
        playBeep();

        if (isWork) {
          sessions++;
          sessionCountEl.textContent = sessions;
          localStorage.setItem('pomodoro_sessions', sessions);
          notify('Work done!', 'Time for a break 🍵');
          switchMode(false);
        } else {
          notify('Break over!', 'Time to focus 🍅');
          switchMode(true);
        }

        // Auto-start next phase
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        start();
      }
    }, 1000);
  }

  function pause() {
    if (!isRunning) return;
    isRunning = false;
    clearInterval(intervalId);
    intervalId = null;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }

  function reset() {
    pause();
    switchMode(true);
  }

  function switchMode(toWork) {
    isWork = toWork;
    totalSeconds = (isWork ? workMinutes : breakMinutes) * 60;
    remainingSeconds = totalSeconds;
    modeLabel.textContent = isWork ? 'Work' : 'Break';
    document.body.classList.toggle('break-mode', !isWork);
    updateDisplay();
    updateProgress();
  }

  function updateDisplay() {
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    minutesEl.textContent = String(m).padStart(2, '0');
    secondsEl.textContent = String(s).padStart(2, '0');
    document.title = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} — Pomodoro`;
  }

  function updateProgress() {
    const fraction = 1 - remainingSeconds / totalSeconds;
    const offset = CIRCUMFERENCE * (1 - fraction);
    progressCircle.style.strokeDasharray = CIRCUMFERENCE;
    progressCircle.style.strokeDashoffset = offset;
  }

  // === Sound (Web Audio API) ===
  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();

      // Two-tone gentle beep
      [0, 0.3].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 660;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.4);
      });
    } catch (e) {
      // Audio not available — silent fail
    }
  }

  // === Notifications ===
  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function notify(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '🍅' });
    }
  }

  // === Settings / localStorage ===
  function loadSettings() {
    const saved = localStorage.getItem('pomodoro_settings');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        workMinutes = s.work || 25;
        breakMinutes = s.break || 5;
      } catch (e) {}
    }
    workInput.value = workMinutes;
    breakInput.value = breakMinutes;
    totalSeconds = workMinutes * 60;
    remainingSeconds = totalSeconds;

    sessions = parseInt(localStorage.getItem('pomodoro_sessions') || '0', 10);
    sessionCountEl.textContent = sessions;
  }

  function saveSettings() {
    const w = parseInt(workInput.value, 10);
    const b = parseInt(breakInput.value, 10);
    if (w >= 1 && w <= 120) workMinutes = w;
    if (b >= 1 && b <= 60) breakMinutes = b;

    localStorage.setItem('pomodoro_settings', JSON.stringify({ work: workMinutes, break: breakMinutes }));

    // Reset timer with new settings if not running
    if (!isRunning) {
      switchMode(isWork);
    }
  }
})();
