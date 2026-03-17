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

    // Step 1: Generate QR to a temp canvas at module resolution * 3
    const qrData = QRCode.create(text, { errorCorrectionLevel: 'H' });
    const modules = qrData.modules;
    const moduleCount = modules.size;
    const unit = 3; // pixels per module
    const qrMargin = 4; // modules of margin
    const qrImageSize = (moduleCount + qrMargin * 2) * unit;

    // Draw QR at pixel level
    const qrCanvas = document.createElement('canvas');
    qrCanvas.width = qrImageSize;
    qrCanvas.height = qrImageSize;
    const qrCtx = qrCanvas.getContext('2d');
    qrCtx.fillStyle = '#ffffff';
    qrCtx.fillRect(0, 0, qrImageSize, qrImageSize);

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (modules.get(row, col)) {
          const x = (col + qrMargin) * unit;
          const y = (row + qrMargin) * unit;
          qrCtx.fillStyle = '#000000';
          qrCtx.fillRect(x, y, unit, unit);
        }
      }
    }

    // Step 2: Resize uploaded image to same size as QR image
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = qrImageSize;
    bgCanvas.height = qrImageSize;
    const bgCtx = bgCanvas.getContext('2d');
    bgCtx.fillStyle = '#ffffff';
    bgCtx.fillRect(0, 0, qrImageSize, qrImageSize);

    // Crop to square and resize
    const img = overlayImage;
    const imgMin = Math.min(img.width, img.height);
    const sx = (img.width - imgMin) / 2;
    const sy = (img.height - imgMin) / 2;
    bgCtx.drawImage(img, sx, sy, imgMin, imgMin, 0, 0, qrImageSize, qrImageSize);

    const bgData = bgCtx.getImageData(0, 0, qrImageSize, qrImageSize);
    const qrPixels = qrCtx.getImageData(0, 0, qrImageSize, qrImageSize);

    // Step 3: Merge - replace QR pixels with image pixels except protected areas
    const resultData = qrCtx.createImageData(qrImageSize, qrImageSize);

    for (let y = 0; y < qrImageSize; y++) {
      for (let x = 0; x < qrImageSize; x++) {
        const idx = (y * qrImageSize + x) * 4;

        // Convert to module-relative coordinates
        const moduleCol = Math.floor(x / unit) - qrMargin;
        const moduleRow = Math.floor(y / unit) - qrMargin;
        const subX = x % unit;
        const subY = y % unit;

        const prot = isProtectedPixel(moduleRow, moduleCol, subX, subY, moduleCount);

        if (prot) {
          // Keep QR data
          resultData.data[idx] = qrPixels.data[idx];
          resultData.data[idx + 1] = qrPixels.data[idx + 1];
          resultData.data[idx + 2] = qrPixels.data[idx + 2];
          resultData.data[idx + 3] = 255;
        } else {
          // Use image pixel
          resultData.data[idx] = bgData.data[idx];
          resultData.data[idx + 1] = bgData.data[idx + 1];
          resultData.data[idx + 2] = bgData.data[idx + 2];
          resultData.data[idx + 3] = 255;
        }
      }
    }

    qrCtx.putImageData(resultData, 0, 0);

    // Step 4: Scale to output size
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false; // keep pixel art crisp
    ctx.drawImage(qrCanvas, 0, 0, size, size);

    canvas.style.display = 'block';
    hint.style.display = 'none';
    downloadBtn.disabled = false;
  }

  function isProtectedPixel(moduleRow, moduleCol, subX, subY, moduleCount) {
    // Outside QR area (margin)
    if (moduleRow < 0 || moduleCol < 0 || moduleRow >= moduleCount || moduleCol >= moduleCount) {
      return true; // keep margin white
    }

    // Center pixel of each module (carries QR data)
    if (subX === 1 && subY === 1) {
      return true;
    }

    // Finder patterns (top-left, top-right, bottom-left) + 1 module separator
    if (moduleRow <= 7 && moduleCol <= 7) return true;         // top-left
    if (moduleRow <= 7 && moduleCol >= moduleCount - 8) return true;  // top-right
    if (moduleRow >= moduleCount - 8 && moduleCol <= 7) return true;  // bottom-left

    // Timing patterns (row 6, col 6)
    if (moduleRow === 6 || moduleCol === 6) return true;

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
