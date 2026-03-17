(() => {
  'use strict';

  // ─── Word list ───
  const WORDS = [
    "HTML", "CSS", "JavaScript", "API", "JSON", "deploy", "server",
    "localhost", "GitHub", "commit", "push", "pull", "branch", "merge",
    "frontend", "backend", "database", "token", "prompt", "webhook",
    "responsive", "component", "framework", "runtime", "endpoint",
    "middleware", "authentication", "encryption", "bandwidth", "latency",
    "DNS", "HTTP", "REST", "GraphQL", "Docker", "container", "CLI",
    "npm", "node", "React", "Next.js", "Vercel", "cron", "SSH",
    "proxy", "cache", "cookie", "session", "schema", "migration"
  ];

  // ─── Config ───
  const BASE_SPEED = 0.4;          // px per frame at wave 1
  const SPEED_INCREMENT = 0.08;    // added per wave
  const BASE_SPAWN_INTERVAL = 3000; // ms between spawns at wave 1
  const MIN_SPAWN_INTERVAL = 800;
  const SPAWN_DECREASE = 200;      // ms less per wave
  const MAX_LIVES = 3;
  const INPUT_BOTTOM_ZONE = 100;   // px from bottom reserved for input
  const TOTAL_WAVES = 5;
  const WAVE_WORD_COUNTS = [8, 10, 12, 14, 16]; // words per wave
  const BREATHER_DURATION = 3000;  // ms between waves
  const COMBO_SLOW_DURATION = 3000; // ms for slow effect
  const COMBO_SLOW_THRESHOLD = 3;
  const COMBO_CLEAR_THRESHOLD = 5;

  // ─── DOM refs ───
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const input = document.getElementById('word-input');
  const scoreEl = document.getElementById('score-display');
  const levelEl = document.getElementById('level-display');
  const livesEl = document.getElementById('lives-display');
  const startScreen = document.getElementById('start-screen');
  const startBtn = document.getElementById('start-btn');
  const gameoverScreen = document.getElementById('gameover-screen');
  const restartBtn = document.getElementById('restart-btn');
  const finalScoreEl = document.getElementById('final-score');
  const finalLevelEl = document.getElementById('final-level');

  // ─── State ───
  let fallingWords = [];
  let score = 0;
  let lives = MAX_LIVES;
  let running = false;
  let animFrameId = null;
  let spawnTimerId = null;
  let lastTime = 0;
  let particles = [];

  // Wave system
  let currentWave = 1;
  let wordsSpawnedThisWave = 0;
  let wordsResolvedThisWave = 0; // cleared + missed
  let inBreather = false;
  let breatherStartTime = 0;
  let waveClearText = null;      // { text, startTime }
  let victory = false;

  // Combo system
  let combo = 0;
  let comboDisplayTimer = 0;     // frames remaining to show combo
  let effectText = null;         // { text, startTime, duration }
  let slowActive = false;
  let slowEndTime = 0;

  // ─── Canvas sizing ───
  function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // ─── Helpers ───
  function randomWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
  }

  function currentSpeed() {
    return BASE_SPEED + (currentWave - 1) * SPEED_INCREMENT;
  }

  function currentSpawnInterval() {
    return Math.max(MIN_SPAWN_INTERVAL, BASE_SPAWN_INTERVAL - (currentWave - 1) * SPAWN_DECREASE);
  }

  function currentWaveWordCount() {
    return WAVE_WORD_COUNTS[currentWave - 1] || 16;
  }

  function updateHUD() {
    scoreEl.textContent = `Score: ${score}`;
    levelEl.textContent = `Wave ${currentWave}/${TOTAL_WAVES}`;
    const hearts = [];
    for (let i = 0; i < MAX_LIVES; i++) {
      hearts.push(i < lives ? '♥' : '♡');
    }
    livesEl.textContent = hearts.join(' ');
  }

  // ─── Particles ───
  function spawnParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        color,
        size: Math.random() * 3 + 1
      });
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ─── Spawn word ───
  function spawnWord() {
    if (!running || inBreather) return;
    if (wordsSpawnedThisWave >= currentWaveWordCount()) return; // all words for this wave spawned

    const word = randomWord();
    // Measure width to keep it within canvas
    ctx.font = '22px Courier New, Consolas, monospace';
    const textWidth = ctx.measureText(word).width;
    const padding = 20;
    const maxX = canvas.width - textWidth - padding;
    const x = padding + Math.random() * Math.max(0, maxX);
    // Slight speed variation
    const speedMult = 0.8 + Math.random() * 0.4;

    fallingWords.push({
      text: word,
      x,
      y: -10,
      speed: currentSpeed() * speedMult,
      baseSpeed: currentSpeed() * speedMult,
      opacity: 1,
      matched: false,
      flash: null, // 'green' or null
      flashTimer: 0
    });

    wordsSpawnedThisWave++;

    // Schedule next spawn if more words to go
    if (wordsSpawnedThisWave < currentWaveWordCount()) {
      scheduleSpawn();
    }
  }

  function scheduleSpawn() {
    if (spawnTimerId) clearTimeout(spawnTimerId);
    const jitter = (Math.random() - 0.5) * 400;
    spawnTimerId = setTimeout(spawnWord, currentSpawnInterval() + jitter);
  }

  // ─── Wave management ───
  function checkWaveEnd() {
    if (inBreather || !running) return;
    const totalNeeded = currentWaveWordCount();
    // All words spawned and none left on screen (not counting fading matched ones)
    const activeWords = fallingWords.filter(fw => !fw.matched);
    if (wordsSpawnedThisWave >= totalNeeded && activeWords.length === 0) {
      if (currentWave >= TOTAL_WAVES) {
        // Victory!
        showVictory();
      } else {
        startBreather();
      }
    }
  }

  function startBreather() {
    inBreather = true;
    breatherStartTime = performance.now();
    input.disabled = true;
    if (spawnTimerId) clearTimeout(spawnTimerId);
    waveClearText = { text: `WAVE ${currentWave} CLEAR!`, startTime: performance.now() };
  }

  function updateBreather(now) {
    if (!inBreather) return;
    const elapsed = now - breatherStartTime;

    // First 2 seconds: show "WAVE X CLEAR!"
    // Last 1 second: show upcoming wave "WAVE X"
    if (elapsed >= BREATHER_DURATION) {
      // End breather, start next wave
      inBreather = false;
      waveClearText = null;
      currentWave++;
      wordsSpawnedThisWave = 0;
      wordsResolvedThisWave = 0;
      input.disabled = false;
      input.value = '';
      input.focus();
      updateHUD();
      spawnWord();
    }
  }

  function drawBreather(now) {
    if (!inBreather) return;
    const elapsed = now - breatherStartTime;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (elapsed < 2000) {
      // "WAVE X CLEAR!"
      const alpha = Math.min(1, elapsed / 300);
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 42px Courier New, Consolas, monospace';
      ctx.shadowColor = '#4caf50';
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#4caf50';
      ctx.fillText(`WAVE ${currentWave} CLEAR!`, cx, cy);
    } else {
      // "WAVE X" (next wave) with fade-in
      const fadeElapsed = elapsed - 2000;
      const alpha = Math.min(1, fadeElapsed / 500);
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 48px Courier New, Consolas, monospace';
      ctx.shadowColor = '#4fc3f7';
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#4fc3f7';
      ctx.fillText(`WAVE ${currentWave + 1}`, cx, cy);
    }

    ctx.restore();
  }

  function showVictory() {
    running = false;
    victory = true;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (spawnTimerId) clearTimeout(spawnTimerId);
    input.disabled = true;

    // Reuse gameover screen with victory text
    const heading = gameoverScreen.querySelector('h2');
    if (heading) heading.textContent = 'ALL CLEAR!';
    finalScoreEl.textContent = `Score: ${score}`;
    finalLevelEl.textContent = `All ${TOTAL_WAVES} waves cleared!`;
    gameoverScreen.classList.remove('hidden');
  }

  // ─── Combo system ───
  function onComboIncrease() {
    combo++;
    comboDisplayTimer = 120; // ~2 seconds at 60fps

    if (combo >= COMBO_CLEAR_THRESHOLD) {
      // Clear all words on screen
      let cleared = 0;
      for (const fw of fallingWords) {
        if (!fw.matched) {
          fw.matched = true;
          fw.flash = 'green';
          fw.flashTimer = 20;
          score++;
          cleared++;
          wordsResolvedThisWave++;
          spawnParticles(fw.x + ctx.measureText(fw.text).width / 2, fw.y, '#ff9800');
        }
      }
      effectText = { text: 'CLEAR!', startTime: performance.now(), duration: 1500, color: '#ff9800' };
      combo = 0; // reset after clear
      updateHUD();
    } else if (combo >= COMBO_SLOW_THRESHOLD) {
      // Slow all words
      slowActive = true;
      slowEndTime = performance.now() + COMBO_SLOW_DURATION;
      for (const fw of fallingWords) {
        if (!fw.matched) {
          fw.speed = fw.baseSpeed * 0.5;
        }
      }
      effectText = { text: 'SLOW!', startTime: performance.now(), duration: 1500, color: '#4fc3f7' };
    }
  }

  function resetCombo() {
    combo = 0;
    comboDisplayTimer = 0;
  }

  function updateSlow(now) {
    if (slowActive && now >= slowEndTime) {
      slowActive = false;
      // Restore speeds
      for (const fw of fallingWords) {
        if (!fw.matched) {
          fw.speed = fw.baseSpeed;
        }
      }
    }
  }

  function drawCombo(now) {
    if (combo < 2 && comboDisplayTimer <= 0) return;
    if (comboDisplayTimer > 0) comboDisplayTimer--;

    const displayCombo = combo >= 2 ? combo : 0;
    if (displayCombo < 2 && comboDisplayTimer <= 0) return;

    ctx.save();
    const cx = canvas.width / 2;
    const baseSize = 24 + Math.min(combo, 10) * 3;
    const alpha = Math.min(1, comboDisplayTimer / 30);
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${baseSize}px Courier New, Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Brighter with higher combos
    const brightness = Math.min(255, 150 + combo * 20);
    ctx.shadowColor = `rgb(${brightness}, ${brightness}, 50)`;
    ctx.shadowBlur = 10 + combo * 3;
    ctx.fillStyle = `rgb(${brightness}, ${brightness}, 50)`;
    ctx.fillText(`x${displayCombo >= 2 ? displayCombo : combo} COMBO`, cx, 50);
    ctx.restore();
  }

  function drawEffectText(now) {
    if (!effectText) return;
    const elapsed = now - effectText.startTime;
    if (elapsed > effectText.duration) {
      effectText = null;
      return;
    }
    const alpha = 1 - elapsed / effectText.duration;
    const yOffset = elapsed * 0.02;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 36px Courier New, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = effectText.color;
    ctx.shadowBlur = 25;
    ctx.fillStyle = effectText.color;
    ctx.fillText(effectText.text, canvas.width / 2, canvas.height / 2 - 60 - yOffset);
    ctx.restore();
  }

  // ─── Input handling ───
  input.addEventListener('input', () => {
    if (inBreather) return;
    const typed = input.value;
    // Check against all falling words
    for (let i = 0; i < fallingWords.length; i++) {
      const fw = fallingWords[i];
      if (!fw.matched && typed === fw.text) {
        // Match!
        fw.matched = true;
        fw.flash = 'green';
        fw.flashTimer = 20;
        input.value = '';
        score++;
        wordsResolvedThisWave++;
        // Green flash on input
        flashInput('green');
        // Particles
        spawnParticles(fw.x + ctx.measureText(fw.text).width / 2, fw.y, '#4caf50');
        // Combo
        onComboIncrease();
        updateHUD();
        return;
      }
    }
  });

  function flashInput(color) {
    const cls = color === 'green' ? 'flash-green' : 'flash-red';
    input.classList.remove('flash-green', 'flash-red');
    // Force reflow
    void input.offsetWidth;
    input.classList.add(cls);
    setTimeout(() => input.classList.remove(cls), 400);
  }

  // ─── Game loop ───
  function gameLoop(timestamp) {
    if (!running) return;

    const delta = timestamp - lastTime;
    lastTime = timestamp;
    // Cap delta to avoid huge jumps on tab switch
    const dt = Math.min(delta, 50) / 16.67;
    const now = performance.now();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid lines for atmosphere
    drawBackground();

    // Update slow effect timer
    updateSlow(now);

    // Update breather
    updateBreather(now);

    // Update & draw falling words
    const bottomLimit = canvas.height - INPUT_BOTTOM_ZONE;

    for (let i = fallingWords.length - 1; i >= 0; i--) {
      const fw = fallingWords[i];

      if (fw.matched) {
        // Fade out
        fw.flashTimer--;
        fw.opacity -= 0.08;
        if (fw.opacity <= 0) {
          fallingWords.splice(i, 1);
          continue;
        }
      } else {
        // Move down
        fw.y += fw.speed * dt;

        // Check if reached bottom
        if (fw.y >= bottomLimit) {
          // Missed!
          lives--;
          wordsResolvedThisWave++;
          resetCombo();
          flashInput('red');
          spawnParticles(fw.x + 30, bottomLimit, '#ef5350');
          fallingWords.splice(i, 1);
          updateHUD();

          if (lives <= 0) {
            gameOver();
            return;
          }
          continue;
        }
      }

      // Draw word
      drawWord(fw);
    }

    // Particles
    updateParticles();
    drawParticles();

    // Highlight matching prefix
    drawMatchHint();

    // Draw combo and effects
    drawCombo(now);
    drawEffectText(now);

    // Draw breather overlay
    drawBreather(now);

    // Check if wave ended
    checkWaveEnd();

    animFrameId = requestAnimationFrame(gameLoop);
  }

  function drawBackground() {
    // Subtle vertical scan lines
    ctx.strokeStyle = 'rgba(79, 195, 247, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    // Bottom line (danger zone)
    const bottomY = canvas.height - INPUT_BOTTOM_ZONE;
    ctx.strokeStyle = 'rgba(239, 83, 80, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.moveTo(0, bottomY);
    ctx.lineTo(canvas.width, bottomY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawWord(fw) {
    ctx.save();
    ctx.globalAlpha = fw.opacity;
    ctx.font = '22px Courier New, Consolas, monospace';

    if (fw.matched) {
      // Green glow
      ctx.shadowColor = '#4caf50';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#4caf50';
    } else {
      // Subtle glow
      ctx.shadowColor = 'rgba(79, 195, 247, 0.3)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#e8edf2';
    }

    ctx.fillText(fw.text, fw.x, fw.y);
    ctx.restore();
  }

  function drawMatchHint() {
    // Show which word(s) partially match current input
    const typed = input.value;
    if (!typed) return;

    for (const fw of fallingWords) {
      if (fw.matched) continue;
      if (fw.text.startsWith(typed)) {
        // Draw underline/highlight on matched portion
        ctx.save();
        ctx.font = '22px Courier New, Consolas, monospace';
        const matchedWidth = ctx.measureText(typed).width;
        ctx.fillStyle = 'rgba(79, 195, 247, 0.15)';
        ctx.fillRect(fw.x - 2, fw.y - 20, matchedWidth + 4, 26);

        // Redraw matched chars in accent color
        ctx.fillStyle = '#4fc3f7';
        ctx.shadowColor = 'rgba(79, 195, 247, 0.4)';
        ctx.shadowBlur = 6;
        ctx.fillText(typed, fw.x, fw.y);
        ctx.restore();
      }
    }
  }

  // ─── Game control ───
  function startGame() {
    score = 0;
    lives = MAX_LIVES;
    currentWave = 1;
    wordsSpawnedThisWave = 0;
    wordsResolvedThisWave = 0;
    fallingWords = [];
    particles = [];
    running = true;
    victory = false;
    inBreather = false;
    combo = 0;
    comboDisplayTimer = 0;
    effectText = null;
    slowActive = false;
    waveClearText = null;
    updateHUD();

    // Reset gameover heading in case it was changed to "ALL CLEAR!"
    const heading = gameoverScreen.querySelector('h2');
    if (heading) heading.textContent = 'GAME OVER';

    startScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    input.value = '';
    input.disabled = false;
    input.focus();

    lastTime = performance.now();
    animFrameId = requestAnimationFrame(gameLoop);
    spawnWord();
  }

  function gameOver() {
    running = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (spawnTimerId) clearTimeout(spawnTimerId);

    input.disabled = true;

    const heading = gameoverScreen.querySelector('h2');
    if (heading) heading.textContent = 'GAME OVER';
    finalScoreEl.textContent = `Score: ${score}`;
    finalLevelEl.textContent = `Wave ${currentWave}/${TOTAL_WAVES}`;
    gameoverScreen.classList.remove('hidden');
  }

  // ─── Event listeners ───
  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);

  // Keep input focused during game
  document.addEventListener('keydown', (e) => {
    if (running && document.activeElement !== input) {
      input.focus();
    }
    // Prevent tab from leaving input
    if (e.key === 'Tab' && running) {
      e.preventDefault();
      input.focus();
    }
  });

  // Prevent losing focus on canvas click
  canvas.addEventListener('mousedown', (e) => {
    if (running) {
      e.preventDefault();
      input.focus();
    }
  });
})();
