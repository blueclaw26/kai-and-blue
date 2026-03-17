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
  const BASE_SPEED = 0.4;          // px per frame at level 1
  const SPEED_INCREMENT = 0.08;    // added per level
  const BASE_SPAWN_INTERVAL = 3000; // ms between spawns at level 1
  const MIN_SPAWN_INTERVAL = 800;
  const SPAWN_DECREASE = 200;      // ms less per level
  const LEVEL_UP_EVERY = 5;        // words per level
  const MAX_LIVES = 3;
  const INPUT_BOTTOM_ZONE = 100;   // px from bottom reserved for input

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
  let level = 1;
  let running = false;
  let animFrameId = null;
  let spawnTimerId = null;
  let lastTime = 0;
  let particles = [];

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
    return BASE_SPEED + (level - 1) * SPEED_INCREMENT;
  }

  function currentSpawnInterval() {
    return Math.max(MIN_SPAWN_INTERVAL, BASE_SPAWN_INTERVAL - (level - 1) * SPAWN_DECREASE);
  }

  function updateHUD() {
    scoreEl.textContent = `Score: ${score}`;
    levelEl.textContent = `Level: ${level}`;
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
    if (!running) return;
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
      opacity: 1,
      matched: false,
      flash: null, // 'green' or null
      flashTimer: 0
    });

    // Schedule next spawn
    scheduleSpawn();
  }

  function scheduleSpawn() {
    if (spawnTimerId) clearTimeout(spawnTimerId);
    const jitter = (Math.random() - 0.5) * 400;
    spawnTimerId = setTimeout(spawnWord, currentSpawnInterval() + jitter);
  }

  // ─── Input handling ───
  input.addEventListener('input', () => {
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
        // Level up
        if (score % LEVEL_UP_EVERY === 0) {
          level++;
        }
        // Green flash on input
        flashInput('green');
        // Particles
        spawnParticles(fw.x + ctx.measureText(fw.text).width / 2, fw.y, '#4caf50');
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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid lines for atmosphere
    drawBackground();

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
    level = 1;
    fallingWords = [];
    particles = [];
    running = true;
    updateHUD();

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

    finalScoreEl.textContent = `Score: ${score}`;
    finalLevelEl.textContent = `Level: ${level}`;
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
