(() => {
  const input = document.getElementById('qr-input');
  const errorLevel = document.getElementById('error-level');
  const errorLevelGroup = document.getElementById('error-level-group');
  const sizeSelect = document.getElementById('qr-size');
  const overlayInput = document.getElementById('overlay-input');
  const overlayLabel = document.getElementById('overlay-label');
  const overlayGroup = document.getElementById('overlay-group');
  const clearOverlayBtn = document.getElementById('clear-overlay');
  const generateBtn = document.getElementById('generate-btn');
  const downloadBtn = document.getElementById('download-btn');
  const canvas = document.getElementById('qr-canvas');
  const hint = document.getElementById('preview-hint');
  const modeBtns = document.querySelectorAll('.mode-btn');

  let overlayImage = null;
  let currentMode = 'standard';

  // Mode toggle
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
      updateUI();
    });
  });

  function updateUI() {
    if (currentMode === 'art') {
      errorLevelGroup.style.display = 'none';
      overlayLabel.textContent = 'アート用画像（必須）';
    } else {
      errorLevelGroup.style.display = '';
      overlayLabel.textContent = '中央に画像を配置（任意）';
    }
  }

  overlayInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        overlayImage = img;
        clearOverlayBtn.style.display = 'inline-block';
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  clearOverlayBtn.addEventListener('click', () => {
    overlayImage = null;
    overlayInput.value = '';
    clearOverlayBtn.style.display = 'none';
  });

  generateBtn.addEventListener('click', () => {
    if (currentMode === 'art') {
      generateArt();
    } else {
      generate();
    }
  });

  // Generate on load with default text
  generate();

  function generate() {
    const text = input.value.trim();
    if (!text) return;

    const size = parseInt(sizeSelect.value);
    const level = errorLevel.value;

    const tmpCanvas = document.createElement('canvas');

    QRCode.toCanvas(tmpCanvas, text, {
      width: size,
      margin: 2,
      errorCorrectionLevel: level,
      color: {
        dark: '#1a1a1a',
        light: '#ffffff'
      }
    }, (err) => {
      if (err) {
        console.error(err);
        return;
      }

      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(tmpCanvas, 0, 0, size, size);

      if (overlayImage) {
        const overlaySize = Math.floor(size * 0.25);
        const x = Math.floor((size - overlaySize) / 2);
        const y = Math.floor((size - overlaySize) / 2);

        const padding = 4;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - padding, y - padding, overlaySize + padding * 2, overlaySize + padding * 2);

        ctx.drawImage(overlayImage, x, y, overlaySize, overlaySize);
      }

      canvas.style.display = 'block';
      hint.style.display = 'none';
      downloadBtn.disabled = false;
    });
  }

  function generateArt() {
    const text = input.value.trim();
    if (!text || !overlayImage) {
      if (!overlayImage) {
        hint.textContent = '画像をアップロードしてください';
        hint.style.display = 'block';
      }
      return;
    }

    const size = parseInt(sizeSelect.value);

    // Generate QR data matrix with highest error correction
    const qrData = QRCode.create(text, { errorCorrectionLevel: 'H' });
    const modules = qrData.modules;
    const moduleCount = modules.size;
    const moduleSize = Math.floor(size / (moduleCount + 4));
    const margin = Math.floor((size - moduleCount * moduleSize) / 2);

    // Resize overlay image to module grid
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = moduleCount;
    tmpCanvas.height = moduleCount;
    const tmpCtx = tmpCanvas.getContext('2d');
    tmpCtx.drawImage(overlayImage, 0, 0, moduleCount, moduleCount);
    const imageData = tmpCtx.getImageData(0, 0, moduleCount, moduleCount);

    // Draw on main canvas
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        const isDark = modules.get(row, col);
        const isFinder = isInFinderPattern(row, col, moduleCount);

        // Get pixel color from image
        const idx = (row * moduleCount + col) * 4;
        const r = imageData.data[idx];
        const g = imageData.data[idx + 1];
        const b = imageData.data[idx + 2];

        let fillColor;
        if (isFinder) {
          fillColor = isDark ? '#000000' : '#ffffff';
        } else if (isDark) {
          // Dark module: use the image color but ensure it's dark enough to scan
          // Clamp each channel to max 100 so dark modules stay dark
          const dr = Math.min(r, 100);
          const dg = Math.min(g, 100);
          const db = Math.min(b, 100);
          fillColor = `rgb(${dr}, ${dg}, ${db})`;
        } else {
          // Light module: use the image color but ensure it's light enough
          // Push each channel toward 255
          const lr = Math.max(r, 180);
          const lg = Math.max(g, 180);
          const lb = Math.max(b, 180);
          fillColor = `rgb(${lr}, ${lg}, ${lb})`;
        }

        ctx.fillStyle = fillColor;
        ctx.fillRect(
          margin + col * moduleSize,
          margin + row * moduleSize,
          moduleSize,
          moduleSize
        );
      }
    }

    canvas.style.display = 'block';
    hint.style.display = 'none';
    downloadBtn.disabled = false;
  }

  function isInFinderPattern(row, col, size) {
    if (row < 7 && col < 7) return true;
    if (row < 7 && col >= size - 7) return true;
    if (row >= size - 7 && col < 7) return true;
    return false;
  }

  downloadBtn.addEventListener('click', () => {
    const size = sizeSelect.value;
    const link = document.createElement('a');
    link.download = `qrcode-${size}x${size}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
})();
