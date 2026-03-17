(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayMessage = document.getElementById('overlay-message');
  const startBtn = document.getElementById('start-btn');
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('high-score');

  // --- Constants ---
  const GRID = 20; // grid cells
  const SNAKE_COLOR = '#4a8f7f';
  const SNAKE_HEAD_COLOR = '#5db8a3';
  const FOOD_COLOR = '#e8a44a';
  const BG_COLOR = '#1a1e2e';
  const GRID_LINE_COLOR = 'rgba(255,255,255,0.03)';
  const BASE_SPEED = 8; // moves per second
  const MAX_SPEED = 18;
  const SPEED_INCREMENT = 0.3;

  let cellSize, offsetX, offsetY;
  let snake, direction, nextDirection, food, score, highScore, speed;
  let gameRunning = false;
  let lastMoveTime = 0;
  let animFrame = null;

  // Smooth rendering: track interpolation
  let moveProgress = 0;

  // --- Init ---
  function init() {
    highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
    highScoreEl.textContent = 'Best: ' + highScore;
    resizeCanvas();
    drawIdle();
  }

  function resizeCanvas() {
    const wrapper = canvas.parentElement;
    const rect = wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(rect.width, rect.height);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cellSize = size / GRID;
    offsetX = 0;
    offsetY = 0;
  }

  function drawIdle() {
    const size = canvas.width / (window.devicePixelRatio || 1);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, size, size);
    drawGrid(size);
  }

  function drawGrid(size) {
    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID; i++) {
      const p = i * cellSize;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
    }
  }

  // --- Game state ---
  function resetGame() {
    const cx = Math.floor(GRID / 2);
    const cy = Math.floor(GRID / 2);
    snake = [
      { x: cx, y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    speed = BASE_SPEED;
    scoreEl.textContent = 'Score: 0';
    placeFood();
  }

  function placeFood() {
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    food = pos;
  }

  // --- Game loop ---
  function startGame() {
    resetGame();
    overlay.classList.add('hidden');
    gameRunning = true;
    lastMoveTime = performance.now();
    moveProgress = 0;
    if (animFrame) cancelAnimationFrame(animFrame);
    animFrame = requestAnimationFrame(gameLoop);
  }

  function gameLoop(timestamp) {
    if (!gameRunning) return;

    const moveInterval = 1000 / speed;
    const elapsed = timestamp - lastMoveTime;
    moveProgress = Math.min(elapsed / moveInterval, 1);

    if (elapsed >= moveInterval) {
      direction = { ...nextDirection };
      const moved = moveSnake();
      if (!moved) {
        gameOver();
        return;
      }
      lastMoveTime = timestamp;
      moveProgress = 0;
    }

    draw();
    animFrame = requestAnimationFrame(gameLoop);
  }

  function moveSnake() {
    const head = snake[0];
    const newHead = { x: head.x + direction.x, y: head.y + direction.y };

    // Wall collision
    if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
      return false;
    }

    // Self collision
    if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      return false;
    }

    snake.unshift(newHead);

    // Food
    if (newHead.x === food.x && newHead.y === food.y) {
      score++;
      scoreEl.textContent = 'Score: ' + score;
      speed = Math.min(MAX_SPEED, BASE_SPEED + score * SPEED_INCREMENT);
      placeFood();
    } else {
      snake.pop();
    }

    return true;
  }

  function gameOver() {
    gameRunning = false;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('snakeHighScore', String(highScore));
      highScoreEl.textContent = 'Best: ' + highScore;
    }
    overlayTitle.textContent = 'ゲームオーバー';
    overlayMessage.innerHTML = `スコア: <strong>${score}</strong>`;
    startBtn.textContent = 'もう一度';
    overlay.classList.remove('hidden');
  }

  // --- Drawing ---
  function draw() {
    const size = canvas.width / (window.devicePixelRatio || 1);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, size, size);
    drawGrid(size);
    drawFood();
    drawSnake();
  }

  function drawFood() {
    const cx = food.x * cellSize + cellSize / 2;
    const cy = food.y * cellSize + cellSize / 2;
    const r = cellSize * 0.35;

    // Glow
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(232, 164, 74, 0.25)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = FOOD_COLOR;
    ctx.fill();
  }

  function drawSnake() {
    const r = cellSize * 0.42;

    snake.forEach((seg, i) => {
      let drawX = seg.x * cellSize + cellSize / 2;
      let drawY = seg.y * cellSize + cellSize / 2;

      // Smooth interpolation for head
      if (i === 0 && gameRunning) {
        drawX += direction.x * cellSize * moveProgress;
        drawY += direction.y * cellSize * moveProgress;
      }
      // Smooth tail
      else if (i === snake.length - 1 && gameRunning && moveProgress > 0) {
        const prev = snake[i - 1];
        const dx = prev.x - seg.x;
        const dy = prev.y - seg.y;
        drawX += dx * cellSize * moveProgress;
        drawY += dy * cellSize * moveProgress;
      }

      // Rounded rect segment
      const segSize = cellSize * 0.84;
      const segR = segSize * 0.3;
      const sx = drawX - segSize / 2;
      const sy = drawY - segSize / 2;

      ctx.beginPath();
      roundRect(ctx, sx, sy, segSize, segSize, segR);
      ctx.fillStyle = i === 0 ? SNAKE_HEAD_COLOR : SNAKE_COLOR;
      ctx.fill();

      // Eyes on head
      if (i === 0) {
        const eyeR = cellSize * 0.08;
        const eyeOffset = cellSize * 0.15;
        let e1x, e1y, e2x, e2y;

        if (direction.x === 1) { e1x = drawX + eyeOffset; e1y = drawY - eyeOffset; e2x = drawX + eyeOffset; e2y = drawY + eyeOffset; }
        else if (direction.x === -1) { e1x = drawX - eyeOffset; e1y = drawY - eyeOffset; e2x = drawX - eyeOffset; e2y = drawY + eyeOffset; }
        else if (direction.y === -1) { e1x = drawX - eyeOffset; e1y = drawY - eyeOffset; e2x = drawX + eyeOffset; e2y = drawY - eyeOffset; }
        else { e1x = drawX - eyeOffset; e1y = drawY + eyeOffset; e2x = drawX + eyeOffset; e2y = drawY + eyeOffset; }

        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(e1x, e1y, eyeR, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(e2x, e2y, eyeR, 0, Math.PI * 2); ctx.fill();
      }
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // --- Input ---
  document.addEventListener('keydown', (e) => {
    if (!gameRunning) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startGame();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W':
        if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
        e.preventDefault(); break;
      case 'ArrowDown': case 's': case 'S':
        if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
        e.preventDefault(); break;
      case 'ArrowLeft': case 'a': case 'A':
        if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
        e.preventDefault(); break;
      case 'ArrowRight': case 'd': case 'D':
        if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
        e.preventDefault(); break;
    }
  });

  // Touch controls
  let touchStartX = 0, touchStartY = 0;

  canvas.addEventListener('touchstart', (e) => {
    if (!gameRunning && !overlay.classList.contains('hidden')) return;
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (!gameRunning) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 20) return; // too short

    if (absDx > absDy) {
      if (dx > 0 && direction.x !== -1) nextDirection = { x: 1, y: 0 };
      else if (dx < 0 && direction.x !== 1) nextDirection = { x: -1, y: 0 };
    } else {
      if (dy > 0 && direction.y !== -1) nextDirection = { x: 0, y: 1 };
      else if (dy < 0 && direction.y !== 1) nextDirection = { x: 0, y: -1 };
    }
  }, { passive: true });

  // Button
  startBtn.addEventListener('click', startGame);

  // Resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeCanvas();
      if (gameRunning) draw();
      else drawIdle();
    }, 200);
  });

  init();
})();
