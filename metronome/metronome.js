(() => {
  'use strict';

  // --- State ---
  let bpm = 120;
  let isRunning = false;
  let beatsPerMeasure = 4;
  let subdivision = 1;
  let volume = 0.7;
  let accentEnabled = true;

  // Audio scheduling
  let audioCtx = null;
  let currentBeat = 0;       // which main beat we're on (0-indexed)
  let currentSubBeat = 0;    // which sub-beat within a beat (0-indexed)
  let nextNoteTime = 0;      // when the next note is due (audioCtx time)
  let timerID = null;

  const LOOKAHEAD = 25;      // ms - how often the scheduler runs
  const SCHEDULE_AHEAD = 0.1; // seconds - how far ahead to schedule

  // Tap tempo
  let tapTimes = [];
  let tapTimeout = null;

  // Cached noise buffers (so every click sounds identical)
  let noiseBufferCache = null;

  // --- DOM ---
  const bpmValueEl = document.getElementById('bpm-value');
  const bpmInput = document.getElementById('bpm-input');
  const bpmSlider = document.getElementById('bpm-slider');
  const startBtn = document.getElementById('start-btn');
  const tapBtn = document.getElementById('tap-btn');
  const timeSigSelect = document.getElementById('time-sig');
  const subdivisionSelect = document.getElementById('subdivision');
  const volumeSlider = document.getElementById('volume');
  const accentModeSelect = document.getElementById('accent-mode');
  const beatDisplay = document.getElementById('beat-display');
  const bpmBtns = document.querySelectorAll('.bpm-btn');

  // --- Init ---
  function init() {
    updateBPMDisplay();
    buildBeatIndicators();
    bindEvents();
  }

  // --- BPM ---
  function setBPM(val) {
    bpm = Math.max(40, Math.min(240, Math.round(val)));
    updateBPMDisplay();
  }

  function updateBPMDisplay() {
    bpmValueEl.textContent = bpm;
    bpmInput.value = bpm;
    bpmSlider.value = bpm;
  }

  // --- Time Signature ---
  function parseTimeSig(str) {
    const [num] = str.split('/').map(Number);
    return num;
  }

  function updateTimeSig() {
    beatsPerMeasure = parseTimeSig(timeSigSelect.value);
    currentBeat = 0;
    currentSubBeat = 0;
    buildBeatIndicators();
  }

  function updateSubdivision() {
    subdivision = parseInt(subdivisionSelect.value);
    currentSubBeat = 0;
    buildBeatIndicators();
  }

  // --- Beat Indicators ---
  function buildBeatIndicators() {
    beatDisplay.innerHTML = '';
    for (let i = 0; i < beatsPerMeasure; i++) {
      const dot = document.createElement('div');
      dot.className = 'beat-dot' + (i === 0 ? ' accent' : '');
      dot.dataset.beat = i;
      beatDisplay.appendChild(dot);

      // Subdivision dots between beats (not after the last)
      if (subdivision > 1 && i < beatsPerMeasure - 1) {
        for (let s = 1; s < subdivision; s++) {
          const sub = document.createElement('div');
          sub.className = 'sub-dot';
          sub.dataset.beat = i;
          sub.dataset.sub = s;
          beatDisplay.appendChild(sub);
        }
      }
      // Also add subdivision dots after the last beat (they wrap to next measure feel)
      if (subdivision > 1 && i === beatsPerMeasure - 1) {
        for (let s = 1; s < subdivision; s++) {
          const sub = document.createElement('div');
          sub.className = 'sub-dot';
          sub.dataset.beat = i;
          sub.dataset.sub = s;
          beatDisplay.appendChild(sub);
        }
      }
    }
    clearActiveIndicators();
  }

  function clearActiveIndicators() {
    beatDisplay.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
  }

  function highlightBeat(beat, sub) {
    clearActiveIndicators();

    if (sub === 0) {
      // Main beat
      const dot = beatDisplay.querySelector(`.beat-dot[data-beat="${beat}"]`);
      if (dot) dot.classList.add('active');
    } else {
      // Subdivision
      const subDot = beatDisplay.querySelector(`.sub-dot[data-beat="${beat}"][data-sub="${sub}"]`);
      if (subDot) subDot.classList.add('active');
    }
  }

  // --- Sound ---
  function ensureAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function createNoiseBuffer(duration) {
    const sampleRate = audioCtx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function playClick(time, type) {
    // type: 'accent', 'beat', 'sub'
    // Use noise-based click for natural "click" sound
    const noise = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    if (!noiseBufferCache) {
      noiseBufferCache = createNoiseBuffer(0.05);
    }
    noise.buffer = noiseBufferCache;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    let filterFreq, dur, vol;
    switch (type) {
      case 'accent':
        filterFreq = 3000;
        dur = 0.015;
        vol = volume * 1.0;
        break;
      case 'beat':
        filterFreq = 2500;
        dur = 0.012;
        vol = volume * 0.8;
        break;
      case 'sub':
        filterFreq = 2000;
        dur = 0.008;
        vol = volume * 0.4;
        break;
    }

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(filterFreq, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.start(time);
    noise.stop(time + dur + 0.01);
  }

  // --- Scheduler ---
  function getSubBeatDuration() {
    const beatDuration = 60.0 / bpm;
    return beatDuration / subdivision;
  }

  function scheduleNote(time) {
    let type;
    if (currentSubBeat === 0) {
      type = (accentEnabled && currentBeat === 0) ? 'accent' : 'beat';
    } else {
      type = 'sub';
    }

    playClick(time, type);

    // Schedule UI update (approximate, not audio-critical)
    const delayMs = (time - audioCtx.currentTime) * 1000;
    setTimeout(() => {
      highlightBeat(currentBeat, currentSubBeat);
    }, Math.max(0, delayMs));
  }

  function advanceNote() {
    currentSubBeat++;
    if (currentSubBeat >= subdivision) {
      currentSubBeat = 0;
      currentBeat++;
      if (currentBeat >= beatsPerMeasure) {
        currentBeat = 0;
      }
    }
    nextNoteTime += getSubBeatDuration();
  }

  function scheduler() {
    while (nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD) {
      scheduleNote(nextNoteTime);
      advanceNote();
    }
  }

  // --- Start / Stop ---
  function start() {
    if (isRunning) return;
    ensureAudioCtx();
    isRunning = true;
    currentBeat = 0;
    currentSubBeat = 0;
    nextNoteTime = audioCtx.currentTime + 0.05; // small delay to avoid glitch
    timerID = setInterval(scheduler, LOOKAHEAD);
    scheduler(); // run immediately
    startBtn.textContent = 'Stop';
    startBtn.classList.add('running');
  }

  function stop() {
    if (!isRunning) return;
    isRunning = false;
    clearInterval(timerID);
    timerID = null;
    clearActiveIndicators();
    startBtn.textContent = 'Start';
    startBtn.classList.remove('running');
  }

  function toggle() {
    if (isRunning) stop(); else start();
  }

  // --- Tap Tempo ---
  function tap() {
    const now = performance.now();

    if (tapTimeout) clearTimeout(tapTimeout);
    tapTimeout = setTimeout(() => {
      tapTimes = [];
    }, 2000);

    tapTimes.push(now);

    // Keep last 5 taps (= 4 intervals)
    if (tapTimes.length > 5) {
      tapTimes.shift();
    }

    if (tapTimes.length >= 2) {
      let totalInterval = 0;
      const count = tapTimes.length - 1;
      for (let i = 1; i < tapTimes.length; i++) {
        totalInterval += tapTimes[i] - tapTimes[i - 1];
      }
      const avgInterval = totalInterval / count;
      const tapBPM = Math.round(60000 / avgInterval);
      setBPM(tapBPM);
    }
  }

  // --- Events ---
  function bindEvents() {
    startBtn.addEventListener('click', toggle);
    tapBtn.addEventListener('click', tap);

    bpmSlider.addEventListener('input', () => setBPM(+bpmSlider.value));
    bpmInput.addEventListener('change', () => setBPM(+bpmInput.value));
    bpmInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        setBPM(+bpmInput.value);
        bpmInput.blur();
      }
    });

    bpmBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        setBPM(bpm + parseInt(btn.dataset.delta));
      });
    });

    timeSigSelect.addEventListener('change', () => {
      updateTimeSig();
      if (isRunning) { stop(); start(); }
    });

    subdivisionSelect.addEventListener('change', () => {
      updateSubdivision();
      if (isRunning) { stop(); start(); }
    });

    accentModeSelect.addEventListener('change', () => {
      accentEnabled = accentModeSelect.value === 'on';
    });

    volumeSlider.addEventListener('input', () => {
      volume = parseFloat(volumeSlider.value);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Don't capture when typing in input
      if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          toggle();
          break;
        case 'KeyT':
          e.preventDefault();
          tap();
          tapBtn.classList.add('active');
          setTimeout(() => tapBtn.classList.remove('active'), 100);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setBPM(bpm + 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setBPM(bpm - 1);
          break;
      }
    });
  }

  // --- Go ---
  init();
})();
