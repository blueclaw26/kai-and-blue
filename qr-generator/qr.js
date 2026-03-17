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

    generateArt();
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

  function randomSuffix(len) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function applyFilter(imageData, filter) {
    const data = imageData.data;
    // Color tints: [darkR, darkG, darkB, lightR, lightG, lightB]
    const tints = {
      'bw':     [0, 0, 0, 255, 255, 255],
      'blue':   [0, 30, 100, 200, 220, 255],
      'green':  [0, 60, 20, 200, 255, 220],
      'red':    [100, 0, 0, 255, 210, 200],
      'purple': [50, 0, 80, 230, 200, 255],
      'teal':   [0, 60, 60, 200, 255, 245],
    };
    const tint = tints[filter] || tints['bw'];
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
      if (gray > 128) {
        // Light pixel
        data[i] = tint[3];
        data[i+1] = tint[4];
        data[i+2] = tint[5];
      } else {
        // Dark pixel
        data[i] = tint[0];
        data[i+1] = tint[1];
        data[i+2] = tint[2];
      }
    }
  }

  function generateArt() {
    let text = input.value.trim();
    if (!text || !overlayImage) {
      if (!overlayImage) {
        hint.textContent = '画像をアップロードしてください';
        hint.style.display = 'block';
      }
      return;
    }

    const sep = text.includes('?') ? '&' : '?';
      text = text + sep + '_=' + randomSuffix(6);

    // Pad text to force higher QR version (more modules = better image resolution)
    // QR version 10+ has 57+ modules, giving much better image detail
    while (text.length < 120) {
      text += text.includes('?') ? '&_p=' + randomSuffix(20) : '?_p=' + randomSuffix(20);
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

        // Check if this module is a dark QR module
        const isQRDark = (moduleRow >= 0 && moduleCol >= 0 && 
                          moduleRow < moduleCount && moduleCol < moduleCount) 
                          ? modules.get(moduleRow, moduleCol) : false;
        const isFinderArea = isProtectedPixel(moduleRow, moduleCol, subX, subY, moduleCount);

        if (isFinderArea) {
          // Finder patterns: always keep QR data
          resultData.data[idx] = qrPixels.data[idx];
          resultData.data[idx + 1] = qrPixels.data[idx + 1];
          resultData.data[idx + 2] = qrPixels.data[idx + 2];
          resultData.data[idx + 3] = 255;
        } else if (isQRDark) {
          // Dark modules: keep center cross (5 of 9 pixels) as QR, corners as image
          // Center pixel + 4 edge-centers = cross shape
          const isCenter = (subX === 1 && subY === 1);
          const isEdgeCenter = (subX === 1 || subY === 1) && !(subX === subY);
          if (isCenter || isEdgeCenter) {
            // QR data (black)
            resultData.data[idx] = qrPixels.data[idx];
            resultData.data[idx + 1] = qrPixels.data[idx + 1];
            resultData.data[idx + 2] = qrPixels.data[idx + 2];
            resultData.data[idx + 3] = 255;
          } else {
            // Corners: blend - use image
            resultData.data[idx] = bgData.data[idx];
            resultData.data[idx + 1] = bgData.data[idx + 1];
            resultData.data[idx + 2] = bgData.data[idx + 2];
            resultData.data[idx + 3] = 255;
          }
        } else {
          // Light modules: show image
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

    // For dark QR modules: protect ALL pixels (solid black blocks, QR-like)
    // For light QR modules: not protected (image shows through)
    // We need access to module data here, so we pass isDark
    // This is handled in the main loop instead

    // Finder patterns (top-left, top-right, bottom-left) - core 7x7 only
    if (moduleRow < 7 && moduleCol < 7) return true;         // top-left
    if (moduleRow < 7 && moduleCol >= moduleCount - 7) return true;  // top-right
    if (moduleRow >= moduleCount - 7 && moduleCol < 7) return true;  // bottom-left

    // Timing patterns (row 6, col 6) - only protect center pixel
    // (center pixel protection above already handles this)

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
