(() => {
  const COLS = 50;
  const ROWS = 50;
  const CELL_SIZE = 10;
  const ALIVE_COLOR = '#4adbc4';
  const DEAD_COLOR = '#1a1e2e';
  const GRID_COLOR = '#252940';

  const canvas = document.getElementById('life-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = COLS * CELL_SIZE;
  canvas.height = ROWS * CELL_SIZE;

  let grid = createGrid();
  let running = false;
  let generation = 0;
  let speed = 10;
  let animId = null;
  let lastTime = 0;
  let isDrawing = false;
  let drawValue = 1;

  const playBtn = document.getElementById('play-btn');
  const stepBtn = document.getElementById('step-btn');
  const clearBtn = document.getElementById('clear-btn');
  const randomBtn = document.getElementById('random-btn');
  const speedSlider = document.getElementById('speed-slider');
  const speedDisplay = document.getElementById('speed-display');
  const genCount = document.getElementById('gen-count');

  function createGrid() {
    return Array.from({ length: ROWS }, () => new Uint8Array(COLS));
  }

  function draw() {
    ctx.fillStyle = DEAD_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, ROWS * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(COLS * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // Alive cells
    ctx.fillStyle = ALIVE_COLOR;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c]) {
          ctx.fillRect(c * CELL_SIZE + 1, r * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        }
      }
    }
  }

  function countNeighbors(r, c) {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = (r + dr + ROWS) % ROWS;
        const nc = (c + dc + COLS) % COLS;
        count += grid[nr][nc];
      }
    }
    return count;
  }

  function step() {
    const next = createGrid();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const n = countNeighbors(r, c);
        if (grid[r][c]) {
          next[r][c] = (n === 2 || n === 3) ? 1 : 0;
        } else {
          next[r][c] = (n === 3) ? 1 : 0;
        }
      }
    }
    grid = next;
    generation++;
    genCount.textContent = generation;
  }

  function loop(time) {
    if (!running) return;
    const interval = 1000 / speed;
    if (time - lastTime >= interval) {
      step();
      draw();
      lastTime = time;
    }
    animId = requestAnimationFrame(loop);
  }

  playBtn.addEventListener('click', () => {
    running = !running;
    if (running) {
      playBtn.textContent = '⏸ Pause';
      playBtn.classList.add('active');
      lastTime = performance.now();
      animId = requestAnimationFrame(loop);
    } else {
      playBtn.textContent = '▶ Play';
      playBtn.classList.remove('active');
      cancelAnimationFrame(animId);
    }
  });

  stepBtn.addEventListener('click', () => {
    if (running) return;
    step();
    draw();
  });

  clearBtn.addEventListener('click', () => {
    running = false;
    playBtn.textContent = '▶ Play';
    playBtn.classList.remove('active');
    cancelAnimationFrame(animId);
    grid = createGrid();
    generation = 0;
    genCount.textContent = '0';
    draw();
  });

  randomBtn.addEventListener('click', () => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        grid[r][c] = Math.random() < 0.3 ? 1 : 0;
      }
    }
    generation = 0;
    genCount.textContent = '0';
    draw();
  });

  speedSlider.addEventListener('input', () => {
    speed = parseInt(speedSlider.value);
    speedDisplay.textContent = speed + ' gen/s';
  });

  // Mouse drawing
  function getCellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const c = Math.floor((e.clientX - rect.left) * scaleX / CELL_SIZE);
    const r = Math.floor((e.clientY - rect.top) * scaleY / CELL_SIZE);
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) return { r, c };
    return null;
  }

  canvas.addEventListener('mousedown', (e) => {
    const cell = getCellFromEvent(e);
    if (!cell) return;
    isDrawing = true;
    drawValue = grid[cell.r][cell.c] ? 0 : 1;
    grid[cell.r][cell.c] = drawValue;
    draw();
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const cell = getCellFromEvent(e);
    if (!cell) return;
    grid[cell.r][cell.c] = drawValue;
    draw();
  });

  window.addEventListener('mouseup', () => {
    isDrawing = false;
  });

  // Pattern definitions (used by both presets and encyclopedia)
  const allPatterns = {
    // Still lifes
    block: [[0,0],[0,1],[1,0],[1,1]],
    beehive: [[0,1],[0,2],[1,0],[1,3],[2,1],[2,2]],
    loaf: [[0,1],[0,2],[1,0],[1,3],[2,1],[2,3],[3,2]],
    boat: [[0,0],[0,1],[1,0],[1,2],[2,1]],
    // Oscillators
    blinker: [[1,0],[1,1],[1,2]],
    toad: [[0,1],[0,2],[0,3],[1,0],[1,1],[1,2]],
    beacon: [[0,0],[0,1],[1,0],[1,1],[2,2],[2,3],[3,2],[3,3]],
    pulsar: (() => {
      const cells = [];
      const offsets = [
        [0,2],[0,3],[0,4],[0,8],[0,9],[0,10],
        [2,0],[3,0],[4,0],[2,5],[3,5],[4,5],
        [2,7],[3,7],[4,7],[2,12],[3,12],[4,12],
        [5,2],[5,3],[5,4],[5,8],[5,9],[5,10],
        [7,2],[7,3],[7,4],[7,8],[7,9],[7,10],
        [8,0],[9,0],[10,0],[8,5],[9,5],[10,5],
        [8,7],[9,7],[10,7],[8,12],[9,12],[10,12],
        [12,2],[12,3],[12,4],[12,8],[12,9],[12,10]
      ];
      offsets.forEach(([r,c]) => cells.push([r,c]));
      return cells;
    })(),
    // Spaceships
    glider: [[0,1],[1,2],[2,0],[2,1],[2,2]],
    lwss: [[0,1],[0,4],[1,0],[2,0],[2,4],[3,0],[3,1],[3,2],[3,3]],
    // Methuselahs
    rpentomino: [[0,1],[0,2],[1,0],[1,1],[2,1]],
    diehard: [[0,6],[1,0],[1,1],[2,1],[2,5],[2,6],[2,7]],
    acorn: [[0,1],[1,3],[2,0],[2,1],[2,4],[2,5],[2,6]],
    // Guns
    gospergun: [
      [0,24],[1,22],[1,24],[2,12],[2,13],[2,20],[2,21],[2,34],[2,35],
      [3,11],[3,15],[3,20],[3,21],[3,34],[3,35],[4,0],[4,1],[4,10],
      [4,16],[4,20],[4,21],[5,0],[5,1],[5,10],[5,14],[5,16],[5,17],
      [5,22],[5,24],[6,10],[6,16],[6,24],[7,11],[7,15],[8,12],[8,13]
    ]
  };

  // Legacy preset map for existing buttons
  const presets = {
    glider: allPatterns.glider,
    blinker: allPatterns.blinker,
    pulsar: allPatterns.pulsar,
    gun: allPatterns.gospergun
  };

  document.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      grid = createGrid();
      generation = 0;
      genCount.textContent = '0';

      const name = btn.dataset.preset;
      const cells = presets[name];
      // Center the pattern
      let minR = Infinity, minC = Infinity, maxR = 0, maxC = 0;
      cells.forEach(([r, c]) => {
        minR = Math.min(minR, r);
        minC = Math.min(minC, c);
        maxR = Math.max(maxR, r);
        maxC = Math.max(maxC, c);
      });
      const patH = maxR - minR + 1;
      const patW = maxC - minC + 1;
      const offR = Math.floor((ROWS - patH) / 2) - minR;
      const offC = Math.floor((COLS - patW) / 2) - minC;

      cells.forEach(([r, c]) => {
        const nr = r + offR;
        const nc = c + offC;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          grid[nr][nc] = 1;
        }
      });

      draw();
    });
  });

  // Initial draw
  draw();

  // Encyclopedia: draw pattern thumbnails and handle clicks
  function loadPatternToGrid(patternName) {
    const cells = allPatterns[patternName];
    if (!cells) return;
    grid = createGrid();
    generation = 0;
    genCount.textContent = '0';
    running = false;
    playBtn.textContent = '▶ Play';
    playBtn.classList.remove('active');
    cancelAnimationFrame(animId);

    let minR = Infinity, minC = Infinity, maxR = 0, maxC = 0;
    cells.forEach(([r, c]) => {
      minR = Math.min(minR, r);
      minC = Math.min(minC, c);
      maxR = Math.max(maxR, r);
      maxC = Math.max(maxC, c);
    });
    const patH = maxR - minR + 1;
    const patW = maxC - minC + 1;
    const offR = Math.floor((ROWS - patH) / 2) - minR;
    const offC = Math.floor((COLS - patW) / 2) - minC;

    cells.forEach(([r, c]) => {
      const nr = r + offR;
      const nc = c + offC;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        grid[nr][nc] = 1;
      }
    });
    draw();
    // Scroll to top of game
    canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  document.querySelectorAll('.pattern-card').forEach(card => {
    const patternName = card.dataset.pattern;
    const cells = allPatterns[patternName];
    if (!cells) return;

    // Draw thumbnail
    const thumbCanvas = card.querySelector('.pattern-canvas');
    const tctx = thumbCanvas.getContext('2d');
    const w = thumbCanvas.width;
    const h = thumbCanvas.height;

    // Calculate bounds
    let minR = Infinity, minC = Infinity, maxR = 0, maxC = 0;
    cells.forEach(([r, c]) => {
      minR = Math.min(minR, r);
      minC = Math.min(minC, c);
      maxR = Math.max(maxR, r);
      maxC = Math.max(maxC, c);
    });
    const patRows = maxR - minR + 1;
    const patCols = maxC - minC + 1;

    // Add padding cells around pattern
    const pad = 1;
    const totalRows = patRows + pad * 2;
    const totalCols = patCols + pad * 2;
    const cellPx = Math.floor(Math.min(w / totalCols, h / totalRows));
    const gridW = totalCols * cellPx;
    const gridH = totalRows * cellPx;
    const ox = Math.floor((w - gridW) / 2);
    const oy = Math.floor((h - gridH) / 2);

    // Background
    tctx.fillStyle = '#1a1e2e';
    tctx.fillRect(0, 0, w, h);

    // Grid lines
    tctx.strokeStyle = '#252940';
    tctx.lineWidth = 0.5;
    for (let x = 0; x <= totalCols; x++) {
      tctx.beginPath();
      tctx.moveTo(ox + x * cellPx, oy);
      tctx.lineTo(ox + x * cellPx, oy + gridH);
      tctx.stroke();
    }
    for (let y = 0; y <= totalRows; y++) {
      tctx.beginPath();
      tctx.moveTo(ox, oy + y * cellPx);
      tctx.lineTo(ox + gridW, oy + y * cellPx);
      tctx.stroke();
    }

    // Alive cells
    tctx.fillStyle = ALIVE_COLOR;
    cells.forEach(([r, c]) => {
      const cr = r - minR + pad;
      const cc = c - minC + pad;
      tctx.fillRect(ox + cc * cellPx + 1, oy + cr * cellPx + 1, cellPx - 2, cellPx - 2);
    });

    // Click to load
    card.addEventListener('click', () => loadPatternToGrid(patternName));
  });
})();
